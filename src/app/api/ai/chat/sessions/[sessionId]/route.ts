import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";

const DISPLAY_HISTORY_LIMIT = 100;

export async function GET(
  _req: Request,
  { params }: RouteContext<"/api/ai/chat/sessions/[sessionId]">,
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;
    const session = await db.aiChatSession.findFirst({
      where: { id: sessionId, userId: user.id },
      select: { id: true, title: true },
    });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const messages = await db.aiChatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      take: DISPLAY_HISTORY_LIMIT,
      select: { id: true, role: true, content: true, createdAt: true },
    });
    messages.reverse();

    return NextResponse.json({ session, messages });
  } catch (error) {
    console.error("[api/ai/chat/sessions/:sessionId] GET failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: RouteContext<"/api/ai/chat/sessions/[sessionId]">,
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;
    const result = await db.aiChatSession.deleteMany({
      where: { id: sessionId, userId: user.id },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/ai/chat/sessions/:sessionId] DELETE failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
