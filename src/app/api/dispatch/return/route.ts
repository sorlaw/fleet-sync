import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trips, inspections, vehicles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyDispatchToken } from "@/lib/crypto";
import { uploadFile } from "@/lib/upload";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = formData.get("token") as string;
    const mileage = formData.get("mileage") as string;

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const { tripId, type, valid } = verifyDispatchToken(token);
    if (!valid || type !== "return") {
      return NextResponse.json(
        { error: "Token tidak valid atau expired" },
        { status: 400 }
      );
    }

    // Check trip exists and is in in_progress status
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

    if (trip[0].status !== "in_progress") {
      return NextResponse.json(
        { error: "Trip belum dimulai" },
        { status: 400 }
      );
    }

    // Validasi: harus sudah ada foto start
    if (!trip[0].imageUrl) {
      return NextResponse.json(
        { error: "Anda harus foto inspeksi awal terlebih dahulu" },
        { status: 400 }
      );
    }

    // Upload photos
    const imageUrls: Record<string, string> = {};
    for (const side of ["front", "rear", "left", "right"]) {
      const file = formData.get(`photo_${side}`) as File | null;
      if (file) {
        const url = await uploadFile(
          file,
          "inspections",
          `trip-${tripId}-after-${side}`
        );
        imageUrls[side] = url;
      }
    }

    // Update trip
    await db
      .update(trips)
      .set({
        status: "returned",
        endMileage: parseInt(mileage) || 0,
        returnImageUrl: imageUrls as {
          front: string;
          rear: string;
          left: string;
          right: string;
        },
        updatedAt: new Date(),
      })
      .where(eq(trips.id, tripId));

    // Update vehicle odometer and status
    if (trip[0].vehicleId) {
      await db
        .update(vehicles)
        .set({
          currentOdometer: parseInt(mileage) || 0,
          status: "available",
          updatedAt: new Date(),
        })
        .where(eq(vehicles.id, trip[0].vehicleId));
    }

    // Create inspection record
    await db.insert(inspections).values({
      tripId,
      inspectionType: "return",
      frontPhotoUrl: imageUrls.front || null,
      rearPhotoUrl: imageUrls.rear || null,
      leftPhotoUrl: imageUrls.left || null,
      rightPhotoUrl: imageUrls.right || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Dispatch return error:", error);
    return NextResponse.json(
      { error: "Gagal memproses" },
      { status: 500 }
    );
  }
}
