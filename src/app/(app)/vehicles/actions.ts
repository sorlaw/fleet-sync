"use server";

import { db } from "@/lib/db";
import { vehicles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";

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
    await db.delete(vehicles).where(eq(vehicles.id, id));
    revalidatePath("/vehicles");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal menghapus kendaraan" };
  }
}
