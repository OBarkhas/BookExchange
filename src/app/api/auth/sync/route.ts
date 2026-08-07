import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

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

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;
    if (!email) {
      return NextResponse.json(
        { error: "Clerk account has no email address" },
        { status: 400 },
      );
    }

    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      null;
    const imageUrl = clerkUser.imageUrl || null;

    // Cheap indexed read: only used to report whether the row was created
    // (so the frontend can greet brand-new users). The upsert below is atomic.
    const existing = await db.user.findUnique({
      where: { id: clerkUser.id },
      select: { id: true },
    });

    const user = await db.user.upsert({
      where: { id: clerkUser.id },
      create: { id: clerkUser.id, email, name, imageUrl },
      update: { email, name, imageUrl },
    });

    return NextResponse.json({ user, created: !existing });
  } catch (error) {
    console.error("[api/auth/sync] Failed to sync user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
