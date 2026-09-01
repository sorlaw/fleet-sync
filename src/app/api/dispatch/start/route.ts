import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trips, inspections } from "@/lib/db/schema";
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
    if (!valid || type !== "start") {
      return NextResponse.json(
        { error: "Token tidak valid atau expired" },
        { status: 400 }
      );
    }

    // Check trip exists and is in approved status
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

    if (trip[0].status !== "approved") {
      return NextResponse.json(
        { error: "Trip tidak dalam status approved" },
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
          `trip-${tripId}-before-${side}`
        );
        imageUrls[side] = url;
      }
    }

    // Update trip
    await db
      .update(trips)
      .set({
        status: "in_progress",
        startMileage: parseInt(mileage) || 0,
        imageUrl: imageUrls as { front: string; rear: string; left: string; right: string },
        updatedAt: new Date(),
      })
      .where(eq(trips.id, tripId));

    // Create inspection record
    await db.insert(inspections).values({
      tripId,
      inspectionType: "pickup",
      frontPhotoUrl: imageUrls.front || null,
      rearPhotoUrl: imageUrls.rear || null,
      leftPhotoUrl: imageUrls.left || null,
      rightPhotoUrl: imageUrls.right || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Dispatch start error:", error);
    return NextResponse.json(
      { error: "Gagal memproses" },
      { status: 500 }
    );
  }
}
