"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import { POST_KINDS, type PostKind } from "@/lib/categories";

export async function createPost(input: {
  kind: PostKind;
  title: string;
  body?: string;
  category?: string;
}) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  const kind = POST_KINDS.includes(input.kind) ? input.kind : "REQUEST";
  const title = input.title.trim();
  if (!title) throw new Error("A title is required");
  if (title.length > 160) throw new Error("Title must be 160 characters or fewer");

  const body = input.body?.trim() ? input.body.trim().slice(0, 2000) : null;
  const category = input.category?.trim() ? input.category.trim().slice(0, 60) : null;

  const post = await db.communityPost.create({
    data: { kind, title, body, category, userId: user.id },
  });

  revalidatePath("/");
  revalidatePath("/browse");
  revalidatePath("/exchanges");
  return { post };
}
