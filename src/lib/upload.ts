import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export async function uploadFile(
  file: File,
  category: "vehicles" | "inspections",
  prefix?: string
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() || "webp";
  const filename = prefix
    ? `${prefix}-${Date.now()}-${randomUUID()}.${ext}`
    : `${Date.now()}-${randomUUID()}.${ext}`;

  const dir = join(UPLOAD_DIR, category);
  await mkdir(dir, { recursive: true });

  const filepath = join(dir, filename);
  await writeFile(filepath, buffer);

  return `/uploads/${category}/${filename}`;
}

export async function uploadMultipleFiles(
  files: File[],
  category: "vehicles" | "inspections",
  prefix?: string
): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const url = await uploadFile(file, category, prefix);
    urls.push(url);
  }
  return urls;
}
