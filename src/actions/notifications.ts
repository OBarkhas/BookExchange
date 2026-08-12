"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";

export async function markNotificationRead(id: string) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  const notification = await db.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== user.id) throw new Error("Forbidden");

  await db.notification.update({ where: { id }, data: { isRead: true } });
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  await db.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
  revalidatePath("/notifications");
}

export async function deleteNotification(id: string) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  const notification = await db.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== user.id) throw new Error("Forbidden");

  await db.notification.delete({ where: { id } });
  revalidatePath("/notifications");
}
