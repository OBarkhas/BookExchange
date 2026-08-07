import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** GET /api/users/[id]/reviews — reviews a user has received, plus average. */
export async function GET(
  _req: Request,
  { params }: RouteContext<"/api/users/[id]/reviews">,
) {
  try {
    const { id } = await params;
    const user = await db.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [reviews, aggregate] = await Promise.all([
      db.review.findMany({
        where: { receiverId: id },
        orderBy: { createdAt: "desc" },
        include: {
          reviewer: {
            select: { id: true, name: true, imageUrl: true },
          },
        },
      }),
      db.review.aggregate({
        where: { receiverId: id },
        _count: true,
        _avg: { rating: true },
      }),
    ]);

    return NextResponse.json({
      reviews,
      average: aggregate._avg.rating,
      count: aggregate._count,
    });
  } catch (error) {
    console.error("[api/users/:id/reviews] GET failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
