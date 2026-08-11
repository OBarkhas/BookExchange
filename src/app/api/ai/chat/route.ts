import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import {
  fetchLibraryContext,
  buildSystemPrompt,
  streamGroqChat,
  type ChatMessage,
} from "@/lib/groq";

const encoder = new TextEncoder();

const HISTORY_LIMIT = 50;
const USER_MESSAGE_LIMIT = 8000;
const ASSISTANT_MESSAGE_LIMIT = 20000;

async function persistMessage(
  userId: string,
  role: "user" | "assistant",
  content: string,
) {
  const trimmed = content.trim();
  if (!trimmed) return;
  const limit = role === "user" ? USER_MESSAGE_LIMIT : ASSISTANT_MESSAGE_LIMIT;
  await db.aiChatMessage.create({
    data: { userId, role, content: trimmed.slice(0, limit) },
  });
}

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

export async function GET() {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messages = await db.aiChatMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: HISTORY_LIMIT,
      select: { id: true, role: true, content: true, createdAt: true },
    });
    messages.reverse();

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("[api/ai/chat] GET failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
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

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === "user") {
      await persistMessage(user.id, "user", lastMessage.content);
    }

    const context = await fetchLibraryContext(user.id);
    const systemPrompt = buildSystemPrompt(context);
    const source = await streamGroqChat(messages, systemPrompt);
    const parsed = toTextStream(source);

    const decoder = new TextDecoder();
    let assistantContent = "";
    const persistingStream = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        assistantContent += decoder.decode(chunk, { stream: true });
        controller.enqueue(chunk);
      },
      async flush() {
        assistantContent += decoder.decode();
        try {
          await persistMessage(user.id, "assistant", assistantContent);
        } catch {
          console.error("[api/ai/chat] failed to persist assistant message");
        }
      },
    });

    return new Response(parsed.pipeThrough(persistingStream), {
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
