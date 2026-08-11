import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/auth";
import {
  fetchLibraryContext,
  buildSystemPrompt,
  streamGroqChat,
  type ChatMessage,
} from "@/lib/groq";

const encoder = new TextEncoder();

function toTextStream(source: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = source.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const enqueueLine = (
    line: string,
    controller: ReadableStreamDefaultController<Uint8Array>,
  ) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) return;

    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") return;

    let parsed: { choices?: Array<{ delta?: { content?: string } }> };
    try {
      parsed = JSON.parse(payload);
    } catch {
      return;
    }

    const content = parsed.choices?.[0]?.delta?.content;
    if (content) controller.enqueue(encoder.encode(content));
  };

  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) enqueueLine(line, controller);
        }
        if (buffer.trim()) enqueueLine(buffer, controller);
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
    cancel() {
      reader.cancel().catch(() => undefined);
    },
  });
}

export async function POST(req: Request) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as {
      messages?: unknown;
    } | null;
    const rawMessages = Array.isArray(body?.messages)
      ? (body.messages as ChatMessage[])
      : [];

    const messages: ChatMessage[] = rawMessages
      .filter(
        (message): message is ChatMessage =>
          message != null &&
          typeof message === "object" &&
          (message.role === "user" || message.role === "assistant") &&
          typeof message.content === "string" &&
          message.content.trim().length > 0,
      )
      .map((message) => ({
        role: message.role,
        content: message.content.trim(),
      }))
      .slice(-12);

    if (messages.length === 0) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    const context = await fetchLibraryContext(user.id);
    const systemPrompt = buildSystemPrompt(context);
    const source = await streamGroqChat(messages, systemPrompt);

    return new Response(toTextStream(source), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[api/ai/chat] failed:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const expose = /GROQ_API_KEY|Groq API error/.test(message)
      ? message
      : "Internal server error";
    return NextResponse.json({ error: expose }, { status: 500 });
  }
}
