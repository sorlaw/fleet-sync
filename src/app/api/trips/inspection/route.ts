import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trips, inspections, vehicles, tripExpenses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { uploadFile } from "@/lib/upload";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const tripId = formData.get("tripId") as string;
    const type = formData.get("type") as "start" | "return";
    const mileage = formData.get("mileage") as string;

    if (!tripId || !type || !mileage) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    // Get trip data
    const trip = await db
      .select()
      .from(trips)
      .where(eq(trips.id, tripId))
      .limit(1);

    if (trip.length === 0) {
      return NextResponse.json(
        { error: "Trip tidak ditemukan" },
        { status: 404 }
      );
    }

    const tripData = trip[0];

    // Validate status based on type
    if (type === "start" && tripData.status !== "approved") {
      return NextResponse.json(
        { error: "Trip tidak dalam status approved" },
        { status: 400 }
      );
    }

    if (type === "return" && tripData.status !== "in_progress") {
      return NextResponse.json(
        { error: "Trip tidak dalam status in_progress" },
        { status: 400 }
      );
    }

    // Validate driver ownership (driver can only do their own trips)
    if (
      session.role === "driver" &&
      tripData.driverId !== session.userId
    ) {
      return NextResponse.json(
        { error: "Bukan trip milik Anda" },
        { status: 403 }
      );
    }

    // Upload photos
    const imageUrls: Record<string, string> = {};
    const prefix = type === "start" ? "before" : "after";

    for (const side of ["front", "rear", "left", "right"]) {
      const file = formData.get(`photo_${side}`) as File | null;
      if (file) {
        const url = await uploadFile(
          file,
          "inspections",
          `trip-${tripId}-${prefix}-${side}`
        );
        imageUrls[side] = url;
      }
    }

    const mileageNum = parseInt(mileage) || 0;

    // Update trip based on type
    if (type === "start") {
      await db
        .update(trips)
        .set({
          status: "in_progress",
          startMileage: mileageNum,
          imageUrl: imageUrls as { front: string; rear: string; left: string; right: string },
          updatedAt: new Date(),
        })
        .where(eq(trips.id, tripId));

      // Update vehicle status
      if (tripData.vehicleId) {
        await db
          .update(vehicles)
          .set({ status: "in_use", updatedAt: new Date() })
          .where(eq(vehicles.id, tripData.vehicleId));
      }
    } else {
      // Return trip
      await db
        .update(trips)
        .set({
          status: "returned",
          endMileage: mileageNum,
          returnImageUrl: imageUrls as { front: string; rear: string; left: string; right: string },
          updatedAt: new Date(),
        })
        .where(eq(trips.id, tripId));

      // Update vehicle status and odometer
      if (tripData.vehicleId) {
        await db
          .update(vehicles)
          .set({
            status: "available",
            currentOdometer: mileageNum,
            updatedAt: new Date(),
          })
          .where(eq(vehicles.id, tripData.vehicleId));
      }
    }

    // Create inspection record
    await db.insert(inspections).values({
      tripId,
      inspectionType: type === "start" ? "pickup" : "return",
      frontPhotoUrl: imageUrls.front || null,
      rearPhotoUrl: imageUrls.rear || null,
      leftPhotoUrl: imageUrls.left || null,
      rightPhotoUrl: imageUrls.right || null,
    });

    // Catat biaya BBM saat return (opsional)
    if (type === "return") {
      const fuelLiters = formData.get("fuelLiters") as string | null;
      const fuelPrice = formData.get("fuelPrice") as string | null;
      const fuelNote = formData.get("fuelNote") as string | null;

      if (fuelLiters && fuelPrice) {
        const liters = parseFloat(fuelLiters);
        const pricePerLiter = parseInt(fuelPrice);
        if (!isNaN(liters) && liters > 0 && !isNaN(pricePerLiter) && pricePerLiter > 0) {
          await db.insert(tripExpenses).values({
            tripId,
            expenseType: "fuel",
            liters: liters.toFixed(2),
            pricePerLiter,
            amount: Math.round(liters * pricePerLiter),
            note: fuelNote || null,
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Inspection error:", error);
    return NextResponse.json(
      { error: "Gagal memproses inspeksi" },
      { status: 500 }
    );
  }
}
