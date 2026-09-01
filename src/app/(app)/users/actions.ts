"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

export async function createUserAction(
  prevState: unknown,
  formData: FormData
) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const licenseNumber = formData.get("licenseNumber") as string;
  const address = formData.get("address") as string;

  if (!email || !password || !fullName) {
    return { error: "Email, password, dan nama lengkap harus diisi" };
  }

  // Check if email already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existing.length > 0) {
    return { error: "Email sudah terdaftar" };
  }

  try {
    const passwordHash = await hashPassword(password);

    await db.insert(users).values({
      email,
      passwordHash,
      fullName,
      role: "driver",
      phoneNumber: phoneNumber || null,
      licenseNumber: licenseNumber || null,
      address: address || null,
      status: "available",
      isActive: true,
    });

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal membuat akun driver" };
  }
}

export async function toggleUserStatusAction(userId: string, isActive: boolean) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  try {
    await db
      .update(users)
      .set({ isActive: !isActive, updatedAt: new Date() })
      .where(eq(users.id, userId));

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal mengupdate status user" };
  }
}

export async function deleteUserAction(userId: string) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  try {
    await db.delete(users).where(eq(users.id, userId));
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal menghapus user" };
  }
}

export async function updateUserAction(
  prevState: unknown,
  formData: FormData
) {
  const session = await getSession();
  if (session?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const userId = formData.get("userId") as string;
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const licenseNumber = formData.get("licenseNumber") as string;
  const address = formData.get("address") as string;
  const newPassword = formData.get("newPassword") as string;

  if (!userId || !fullName || !email) {
    return { error: "Nama dan email harus diisi" };
  }

  try {
    // Check if email already exists for other users
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existing.length > 0 && existing[0].id !== userId) {
      return { error: "Email sudah digunakan user lain" };
    }

    const updateData: {
      fullName: string;
      email: string;
      phoneNumber: string | null;
      licenseNumber: string | null;
      address: string | null;
      updatedAt: Date;
      passwordHash?: string;
    } = {
      fullName,
      email,
      phoneNumber: phoneNumber || null,
      licenseNumber: licenseNumber || null,
      address: address || null,
      updatedAt: new Date(),
    };

    // Update password only if provided
    if (newPassword && newPassword.length > 0) {
      if (newPassword.length < 6) {
        return { error: "Password minimal 6 karakter" };
      }
      updateData.passwordHash = await hashPassword(newPassword);
    }

    await db.update(users).set(updateData).where(eq(users.id, userId));

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal mengupdate user" };
  }
}
