"use server";

import { db } from "@/lib/db";
import { vehicles, trips, inspections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { deleteFilesByUrls } from "@/lib/upload";

export async function createVehicleAction(
  prevState: unknown,
  formData: FormData
) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const licensePlate = formData.get("licensePlate") as string;
  const makeModel = formData.get("makeModel") as string;
  const status = formData.get("status") as string;
  const currentOdometer = parseInt(formData.get("currentOdometer") as string) || 0;
  const imageUrl = formData.get("imageUrl") as string | null;

  if (!licensePlate || !makeModel) {
    return { error: "Plat nomor dan model harus diisi" };
  }

  try {
    await db.insert(vehicles).values({
      licensePlate,
      makeModel,
      status: (status as "available" | "in_use" | "maintenance") || "available",
      currentOdometer,
      imageUrl: imageUrl || null,
    });

    revalidatePath("/vehicles");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal menambah kendaraan" };
  }
}

export async function updateVehicleAction(
  prevState: unknown,
  formData: FormData
) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const id = formData.get("id") as string;
  const licensePlate = formData.get("licensePlate") as string;
  const makeModel = formData.get("makeModel") as string;
  const status = formData.get("status") as string;
  const currentOdometer = parseInt(formData.get("currentOdometer") as string) || 0;
  const imageUrl = formData.get("imageUrl") as string | null;

  if (!id || !licensePlate || !makeModel) {
    return { error: "Data tidak lengkap" };
  }

  try {
    await db
      .update(vehicles)
      .set({
        licensePlate,
        makeModel,
        status: (status as "available" | "in_use" | "maintenance") || "available",
        currentOdometer,
        imageUrl: imageUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, id));

    revalidatePath("/vehicles");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal mengupdate kendaraan" };
  }
}

export async function deleteVehicleAction(id: string) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  try {
    const vehicle = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);

    const vehicleTrips = await db
      .select()
      .from(trips)
      .where(eq(trips.vehicleId, id));

    const filesToDelete: (string | null | undefined)[] = [];

    if (vehicle.length > 0 && vehicle[0].imageUrl) {
      if (Array.isArray(vehicle[0].imageUrl)) {
        filesToDelete.push(...vehicle[0].imageUrl);
      }
    }

    for (const trip of vehicleTrips) {
      if (trip.imageUrl && typeof trip.imageUrl === "object") {
        filesToDelete.push(...Object.values(trip.imageUrl));
      }
      if (trip.returnImageUrl && typeof trip.returnImageUrl === "object") {
        filesToDelete.push(...Object.values(trip.returnImageUrl));
      }

      const tripInspections = await db
        .select()
        .from(inspections)
        .where(eq(inspections.tripId, trip.id));

      for (const insp of tripInspections) {
        filesToDelete.push(
          insp.frontPhotoUrl,
          insp.rearPhotoUrl,
          insp.leftPhotoUrl,
          insp.rightPhotoUrl
        );
      }
      await db.delete(inspections).where(eq(inspections.tripId, trip.id));
    }

    await db.delete(trips).where(eq(trips.vehicleId, id));

    // Hapus file fisik gambar
    await deleteFilesByUrls(filesToDelete);

    // Hapus kendaraan dari DB
    await db.delete(vehicles).where(eq(vehicles.id, id));
    revalidatePath("/vehicles");
    return { success: true };
  } catch (error) {
    console.error("Delete vehicle error:", error);
    return { error: "Gagal menghapus kendaraan" };
  }
}

export async function updateVehicleStatusAction(
  id: string,
  status: "available" | "in_use" | "maintenance"
) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  try {
    await db
      .update(vehicles)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, id));

    revalidatePath("/vehicles");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal mengupdate status kendaraan" };
  }
}

