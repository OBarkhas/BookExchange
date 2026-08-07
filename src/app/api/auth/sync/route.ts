import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { syncUserFromClerk } from "@/lib/auth";

/**
 * POST /api/auth/sync
 *
 * Reads the authenticated Clerk user via currentUser() and guarantees the
 * matching row exists in the Neon database (upsert). Returns the synced row
 * plus a `created` flag so the frontend can greet brand-new users.
 *
 * This removes the need for Clerk webhooks / ngrok during local development.
 */
export async function POST() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Cheap indexed read before the upsert so we can report `created`.
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
