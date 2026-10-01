"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { hashPassword, comparePassword } from "@/lib/auth/password";

export async function updateProfileAction(
  prevState: unknown,
  formData: FormData
) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const fullName = formData.get("fullName") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const licenseNumber = formData.get("licenseNumber") as string;
  const address = formData.get("address") as string;

  if (!fullName) return { error: "Nama lengkap harus diisi" };

  try {
    await db
      .update(users)
      .set({
        fullName,
        phoneNumber: phoneNumber || null,
        licenseNumber: licenseNumber || null,
        address: address || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.userId));

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal mengupdate profil" };
  }
}

export async function changePasswordAction(
  prevState: unknown,
  formData: FormData
) {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Semua field password harus diisi" };
  }

  if (newPassword.length < 6) {
    return { error: "Password baru minimal 6 karakter" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Konfirmasi password tidak sama" };
  }

  try {
    const userRows = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (userRows.length === 0) return { error: "User tidak ditemukan" };

    const valid = await comparePassword(
      currentPassword,
      userRows[0].passwordHash
    );
    if (!valid) return { error: "Password lama salah" };

    const passwordHash = await hashPassword(newPassword);
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, session.userId));

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal mengganti password" };
  }
}
