"use server";

import { db } from "@/lib/db";
import { trips, vehicles, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { generateDispatchToken } from "@/lib/crypto";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function createTripAction(
  prevState: unknown,
  formData: FormData
) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const vehicleId = formData.get("vehicleId") as string;
  const purpose = formData.get("purpose") as string;
  const driverId = formData.get("driverId") as string;

  if (!vehicleId || !purpose) {
    return { error: "Kendaraan dan tujuan harus diisi" };
  }

  try {
    const targetDriverId =
      session.role === "admin" ? driverId || session.userId : session.userId;

    await db.insert(trips).values({
      vehicleId,
      driverId: targetDriverId,
      purpose,
      status: session.role === "admin" ? "approved" : "pending",
    });

    revalidatePath("/trips");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal membuat trip" };
  }
}

export async function approveTripAction(tripId: string) {
  const session = await getSession();
  if (session?.role !== "admin") return { error: "Unauthorized" };

  try {
    // Ambil data trip dengan join ke users dan vehicles
    const tripData = await db
      .select({
        id: trips.id,
        driverId: trips.driverId,
        vehicleId: trips.vehicleId,
        purpose: trips.purpose,
        status: trips.status,
        driverName: users.fullName,
        driverPhone: users.phoneNumber,
        vehiclePlate: vehicles.licensePlate,
        vehicleModel: vehicles.makeModel,
      })
      .from(trips)
      .leftJoin(users, eq(trips.driverId, users.id))
      .leftJoin(vehicles, eq(trips.vehicleId, vehicles.id))
      .where(eq(trips.id, tripId))
      .limit(1);

    if (tripData.length === 0) return { error: "Trip tidak ditemukan" };

    const trip = tripData[0];

    // Update status ke approved
    await db
      .update(trips)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(trips.id, tripId));

    // Generate 2 token (start dan return)
    const startToken = generateDispatchToken(tripId, "start");
    const returnToken = generateDispatchToken(tripId, "return");

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const startUrl = `${baseUrl}/dispatch/${startToken}`;
    const returnUrl = `${baseUrl}/dispatch/return/${returnToken}`;

    // Kirim WA ke driver jika ada nomor telepon
    if (trip.driverPhone) {
      const message =
        `*Trip Anda telah disetujui!* ✅\n\n` +
        `Kendaraan: ${trip.vehiclePlate} - ${trip.vehicleModel}\n` +
        `Tujuan: ${trip.purpose}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📷 *FOTO SEBELUM BERANGKAT:*\n${startUrl}\n\n` +
        `📷 *FOTO SETELAH KEMBALI:*\n${returnUrl}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `⚠️ *Simpan link di atas!*\n` +
        `• Link 1: Buka saat akan berangkat\n` +
        `• Link 2: Buka saat sudah kembali\n\n` +
        `Link berlaku 24 jam.`;

      try {
        const sent = await sendWhatsAppMessage(trip.driverPhone, message);
        if (sent) {
          console.log(`[Approve] ✅ WA sent to driver: ${trip.driverPhone}`);
        } else {
          console.error(`[Approve] ❌ Failed to send WA to driver: ${trip.driverPhone}`);
        }
      } catch (waError) {
        console.error(`[Approve] ❌ WA send error:`, waError);
        // Jangan throw error, trip sudah di-approve
      }
    }

    revalidatePath("/trips");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal approve trip" };
  }
}

export async function rejectTripAction(tripId: string) {
  const session = await getSession();
  if (session?.role !== "admin") return { error: "Unauthorized" };

  try {
    await db
      .update(trips)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(trips.id, tripId));

    revalidatePath("/trips");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal reject trip" };
  }
}

export async function completeTripAction(tripId: string) {
  const session = await getSession();
  if (session?.role !== "admin") return { error: "Unauthorized" };

  try {
    const trip = await db
      .select()
      .from(trips)
      .where(eq(trips.id, tripId))
      .limit(1);

    if (trip.length === 0) return { error: "Trip tidak ditemukan" };

    await db
      .update(trips)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(trips.id, tripId));

    revalidatePath("/trips");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal menyelesaikan trip" };
  }
}

export async function generateDispatchLinkAction(tripId: string) {
  const session = await getSession();
  if (session?.role !== "admin") return { error: "Unauthorized" };

  const startToken = generateDispatchToken(tripId, "start");
  const returnToken = generateDispatchToken(tripId, "return");

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    startUrl: `${baseUrl}/dispatch/${startToken}`,
    returnUrl: `${baseUrl}/dispatch/return/${returnToken}`,
  };
}

export async function deleteTripAction(tripId: string) {
  const session = await getSession();
  if (session?.role !== "admin") return { error: "Unauthorized" };

  try {
    await db.delete(trips).where(eq(trips.id, tripId));
    revalidatePath("/trips");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal menghapus trip" };
  }
}

