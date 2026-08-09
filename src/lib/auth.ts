import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

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

export const getDbUser = syncUserFromClerk;
