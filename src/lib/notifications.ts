import { db } from "@/lib/db";
import { notifications, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export type NotificationType =
  | "trip_created"
  | "trip_approved"
  | "trip_rejected"
  | "trip_completed"
  | "maintenance_due";

/**
 * Insert notifikasi in-app untuk beberapa user.
 * Selalu swallow error — notif gagal tidak boleh merusak aksi utama.
 */
export async function notifyUsersInApp(
  userIds: string[],
  type: NotificationType,
  title: string,
  body: string | null,
  tripId?: string
): Promise<void> {
  const targets = userIds.filter((id) => !!id);
  if (targets.length === 0) return;

  try {
    await db.insert(notifications).values(
      targets.map((userId) => ({
        userId,
        type,
        title,
        body,
        tripId: tripId ?? null,
      }))
    );
  } catch (error) {
    console.error("[Notify] Insert gagal:", error);
  }
}

/** Notifikasi in-app untuk semua admin aktif. */
export async function notifyAdminsInApp(
  type: NotificationType,
  title: string,
  body: string | null,
  tripId?: string
): Promise<void> {
  try {
    const admins = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(eq(users.role, "admin"), eq(users.isActive, true))
      );

    await notifyUsersInApp(
      admins.map((a) => a.id),
      type,
      title,
      body,
      tripId
    );
  } catch (error) {
    console.error("[Notify] Gagal query admin:", error);
  }
}
