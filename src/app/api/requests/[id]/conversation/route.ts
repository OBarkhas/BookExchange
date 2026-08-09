import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const request = await db.exchangeRequest.findUnique({
      where: { id },
      select: { senderId: true, receiverId: true },
    });

    if (!request) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const isSender = request.senderId === user.id;
    const isReceiver = request.receiverId === user.id;
    if (!isSender && !isReceiver) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.exchangeRequest.update({
      where: { id },
      data: isSender
        ? { hiddenBySender: true }
        : { hiddenByReceiver: true },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/requests/:id/conversation] DELETE failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
