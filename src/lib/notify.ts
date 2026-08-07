import { db } from "@/lib/db";

/** Creates an in-app notification. Never throws — callers treat it as fire-and-forget. */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  link?: string,
) {
  try {
    return await db.notification.create({
      data: { userId, title, message, link },
    });
  } catch (error) {
    console.error("[notify] Failed to create notification:", error);
    return null;
  }
}
