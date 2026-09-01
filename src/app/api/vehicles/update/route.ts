import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vehicles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (session?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const id = formData.get("id") as string;
    const licensePlate = formData.get("licensePlate") as string;
    const makeModel = formData.get("makeModel") as string;
    const status = formData.get("status") as string;
    const currentOdometer =
      parseInt(formData.get("currentOdometer") as string) || 0;
    const imageUrls = formData.getAll("imageUrls") as string[];

    if (!id || !licensePlate || !makeModel) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    await db
      .update(vehicles)
      .set({
        licensePlate,
        makeModel,
        status:
          (status as "available" | "in_use" | "maintenance") || "available",
        currentOdometer,
        imageUrl: imageUrls.length > 0 ? imageUrls : null,
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update vehicle error:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate kendaraan" },
      { status: 500 }
    );
  }
}
