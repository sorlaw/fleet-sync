import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, desc, and, count } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [items, unread] = await Promise.all([
      db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, session.userId))
        .orderBy(desc(notifications.createdAt))
        .limit(20),
      db
        .select({ value: count() })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, session.userId),
            eq(notifications.isRead, false)
          )
        ),
    ]);

    return NextResponse.json({
      items,
      unreadCount: unread[0]?.value || 0,
    });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json(
      { error: "Gagal memuat notifikasi" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const notificationId = body.id as string | undefined;

    if (notificationId) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, session.userId)
          )
        );
    } else {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.userId, session.userId),
            eq(notifications.isRead, false)
          )
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notifications POST error:", error);
    return NextResponse.json(
      { error: "Gagal update notifikasi" },
      { status: 500 }
    );
  }
}
