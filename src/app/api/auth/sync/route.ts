import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { syncUserFromClerk } from "@/lib/auth";

export async function POST() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await db.user.findUnique({
      where: { id: clerkUser.id },
      select: { id: true },
    });

    const user = await syncUserFromClerk();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ user, created: !existing });
  } catch (error) {
    console.error("[api/auth/sync] Failed to sync user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
