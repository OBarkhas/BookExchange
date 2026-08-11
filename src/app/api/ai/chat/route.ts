import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import {
  getLibraryContextCached,
  buildSystemPrompt,
  streamGroqChat,
  type ChatMessage,
} from "@/lib/groq";

const encoder = new TextEncoder();

const LLM_HISTORY_LIMIT = 12;
const USER_MESSAGE_LIMIT = 8000;
const ASSISTANT_MESSAGE_LIMIT = 20000;
const TITLE_LIMIT = 40;

async function persistMessage(
  userId: string,
  sessionId: string,
  role: "user" | "assistant",
  content: string,
) {
  const trimmed = content.trim();
  if (!trimmed) return;
  const limit = role === "user" ? USER_MESSAGE_LIMIT : ASSISTANT_MESSAGE_LIMIT;
  await db.aiChatMessage.create({
    data: { userId, sessionId, role, content: trimmed.slice(0, limit) },
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

export async function POST(req: Request) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as {
      sessionId?: unknown;
      content?: unknown;
    } | null;
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (!content) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }
    if (content.length > USER_MESSAGE_LIMIT) {
      return NextResponse.json(
        { error: "Message too long" },
        { status: 400 },
      );
    }

    const sessionId =
      typeof body?.sessionId === "string" ? body.sessionId.trim() : "";

    let session: { id: string; title: string } | null = null;
    if (sessionId) {
      session = await db.aiChatSession.findFirst({
        where: { id: sessionId, userId: user.id },
        select: { id: true, title: true },
      });
    } else {
      session = await db.aiChatSession.create({
        data: { userId: user.id, title: content.slice(0, TITLE_LIMIT) },
        select: { id: true, title: true },
      });
    }
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Give placeholder sessions a real title from their first message.
    if (session.title === "New Chat" || session.title === "Chat history") {
      await db.aiChatSession.update({
        where: { id: session.id },
        data: { title: content.slice(0, TITLE_LIMIT) },
      });
    }

    // History is loaded server-side so the client only sends the new message
    // instead of re-uploading the whole conversation on every turn.
    const history = await db.aiChatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: "desc" },
      take: LLM_HISTORY_LIMIT,
      select: { role: true, content: true },
    });
    history.reverse();

    const messages: ChatMessage[] = [
      ...history.map((message) => ({
        role: message.role as ChatMessage["role"],
        content: message.content,
      })),
      { role: "user", content },
    ];

    await persistMessage(user.id, session.id, "user", content);

    // Touch recency now (not only in the stream flush) so the session list
    // reorders correctly even if the stream is aborted mid-reply.
    await db.aiChatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() },
    });

    const context = await getLibraryContextCached(user.id);
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
          await persistMessage(user.id, session.id, "assistant", assistantContent);
          // Keep the session list sorted by recency.
          await db.aiChatSession.update({
            where: { id: session.id },
            data: { updatedAt: new Date() },
          });
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
