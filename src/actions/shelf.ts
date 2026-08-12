"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import { checkAndAwardBadges } from "@/lib/badges";
import type { ShelfStatus } from "@/generated/prisma/client";

export async function addToShelf(input: {
  title: string;
  author: string;
  status: ShelfStatus;
  rating: number | null;
}) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  const title = input.title.trim();
  const author = input.author.trim();
  if (!title || !author) throw new Error("Title and author are required");

  const status = ["READING", "COMPLETED", "WANT_TO_READ"].includes(input.status)
    ? input.status
    : "COMPLETED";
  const rating =
    typeof input.rating === "number" &&
    input.rating >= 1 &&
    input.rating <= 5
      ? Math.round(input.rating)
      : null;

  const item = await db.userBookShelf.create({
    data: { title, author, status, rating, userId: user.id },
  });

  await checkAndAwardBadges(user.id);
  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath(`/profile/${user.id}`);
  return { item };
}

export async function updateShelfItem(
  id: string,
  patch: { status?: ShelfStatus; rating?: number | null },
) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  const item = await db.userBookShelf.findUnique({ where: { id } });
  if (!item || item.userId !== user.id) throw new Error("Forbidden");

  const data: { status?: ShelfStatus; rating?: number | null } = {};
  if (patch.status && ["READING", "COMPLETED", "WANT_TO_READ"].includes(patch.status)) {
    data.status = patch.status;
  }
  if (typeof patch.rating === "number") {
    data.rating =
      patch.rating >= 1 && patch.rating <= 5 ? Math.round(patch.rating) : null;
  }

  const updated = await db.userBookShelf.update({ where: { id }, data });
  revalidatePath("/shelf");
  revalidatePath(`/profile/${user.id}`);
  return { item: updated };
}

export async function removeShelfItem(id: string) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  const item = await db.userBookShelf.findUnique({ where: { id } });
  if (!item || item.userId !== user.id) throw new Error("Forbidden");

  await db.userBookShelf.delete({ where: { id } });
  revalidatePath("/shelf");
  revalidatePath(`/profile/${user.id}`);
}

export async function addWishlist(title: string, author: string) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  const trimmedTitle = title.trim();
  if (!trimmedTitle) throw new Error("Title is required");

  const item = await db.wishlist.create({
    data: {
      title: trimmedTitle.slice(0, 200),
      author: author.trim() ? author.trim().slice(0, 100) : null,
      userId: user.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath(`/profile/${user.id}`);
  return { item };
}

export async function removeWishlist(id: string) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  const item = await db.wishlist.findUnique({ where: { id } });
  if (!item || item.userId !== user.id) throw new Error("Forbidden");

  await db.wishlist.delete({ where: { id } });
  revalidatePath("/shelf");
  revalidatePath(`/profile/${user.id}`);
}
