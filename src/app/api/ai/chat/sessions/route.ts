import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await db.aiChatSession.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, role: true },
        },
      },
    });

    return NextResponse.json({
      sessions: sessions.map((session) => ({
        id: session.id,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messageCount: session._count.messages,
        lastMessage: session.messages[0] ?? null,
      })),
    });
  } catch (error) {
    console.error("[api/ai/chat/sessions] GET failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Tidy up: remove any empty placeholder chats so "New Chat" clicks don't
    // pile up unused rows.
    const empties = await db.aiChatSession.findMany({
      where: { userId: user.id, messages: { none: {} } },
      select: { id: true },
    });
    if (empties.length > 0) {
      await db.aiChatSession.deleteMany({
        where: { id: { in: empties.map((session) => session.id) } },
      });
    }

    const session = await db.aiChatSession.create({
      data: { userId: user.id },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error("[api/ai/chat/sessions] POST failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
