import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

/**
 * Upserts the authenticated Clerk user into the local database.
 * Returns the local User row, or null when there is no authenticated
 * user (or the Clerk account has no email address).
 */
export async function syncUserFromClerk() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;
  if (!email) return null;

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    null;
  const imageUrl = clerkUser.imageUrl || null;

  return db.user.upsert({
    where: { id: clerkUser.id },
    create: { id: clerkUser.id, email, name, imageUrl },
    update: { email, name, imageUrl },
  });
}

/** Alias used by route handlers and pages that need the synced user. */
export const getDbUser = syncUserFromClerk;
