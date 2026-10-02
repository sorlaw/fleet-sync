import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/upload";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Bad request: invalid form data" },
      { status: 400 }
    );
  }

  try {
    const file = formData.get("file") as File;
    const category = formData.get("category") as "vehicles" | "inspections";
    const prefix = formData.get("prefix") as string | undefined;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!category || !["vehicles", "inspections"].includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const url = await uploadFile(file, category, prefix);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
