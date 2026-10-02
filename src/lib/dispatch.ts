import { db } from "@/lib/db";
import { trips, vehicles, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyDispatchToken } from "@/lib/crypto";

export type DispatchReason =
  | "invalid"
  | "expired"
  | "not_found"
  | "already_done"
  | "not_started"
  | "rejected";

export type DispatchTripInfo = {
  tripId: string;
  purpose: string | null;
  status: string | null;
  vehiclePlate: string | null;
  vehicleModel: string | null;
  driverName: string | null;
};

export type DispatchState =
  | { ok: true; trip: DispatchTripInfo }
  | { ok: false; reason: DispatchReason };

/**
 * Validasi dispatch token + status trip saat halaman dibuka.
 * Dipakai oleh server component /dispatch/[token] dan /dispatch/return/[token]
 * supaya link yang sudah dipakai / belum layak tidak menampilkan form.
 */
export async function getDispatchState(
  token: string,
  type: "start" | "return"
): Promise<DispatchState> {
  const verified = verifyDispatchToken(token);

  if (!verified.valid) {
    return { ok: false, reason: verified.expired ? "expired" : "invalid" };
  }

  if (verified.type !== type) {
    return { ok: false, reason: "invalid" };
  }

  const rows = await db
    .select({
      tripId: trips.id,
      purpose: trips.purpose,
      status: trips.status,
      imageUrl: trips.imageUrl,
      vehiclePlate: vehicles.licensePlate,
      vehicleModel: vehicles.makeModel,
      driverName: users.fullName,
    })
    .from(trips)
    .leftJoin(vehicles, eq(trips.vehicleId, vehicles.id))
    .leftJoin(users, eq(trips.driverId, users.id))
    .where(eq(trips.id, verified.tripId))
    .limit(1);

  if (rows.length === 0) {
    return { ok: false, reason: "not_found" };
  }

  const trip = rows[0];
  const status = trip.status;
  const hasStartPhotos = Boolean(trip.imageUrl);

  if (status === "rejected") {
    return { ok: false, reason: "rejected" };
  }

  if (type === "start") {
    if (status === "pending") {
      return { ok: false, reason: "not_started" };
    }
    if (status !== "approved" || hasStartPhotos) {
      return { ok: false, reason: "already_done" };
    }
  } else {
    if (status === "pending" || status === "approved" || !hasStartPhotos) {
      return { ok: false, reason: "not_started" };
    }
    if (status !== "in_progress") {
      return { ok: false, reason: "already_done" };
    }
  }

  return {
    ok: true,
    trip: {
      tripId: trip.tripId,
      purpose: trip.purpose,
      status,
      vehiclePlate: trip.vehiclePlate,
      vehicleModel: trip.vehicleModel,
      driverName: trip.driverName,
    },
  };
}
