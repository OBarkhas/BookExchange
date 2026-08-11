import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const type = req.nextUrl.searchParams.get("type");
    const isReceived = type === "received";
    const where = isReceived
      ? { receiverId: user.id, hiddenByReceiver: false }
      : { senderId: user.id, hiddenBySender: false };

    const requests = await db.exchangeRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            images: true,
            condition: true,
            listingType: true,
            price: true,
          },
        },
        sender: {
          select: { id: true, name: true, imageUrl: true, district: true },
        },
        receiver: {
          select: { id: true, name: true, imageUrl: true, district: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, createdAt: true, senderId: true },
        },
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("[api/requests] GET failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
