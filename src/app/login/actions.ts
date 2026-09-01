"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { comparePassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function loginAction(prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan password harus diisi" };
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user.length === 0) {
    return { error: "Email atau password salah" };
  }

  const foundUser = user[0];

  if (!foundUser.isActive) {
    return { error: "Akun tidak aktif" };
  }

  const isValid = await comparePassword(password, foundUser.passwordHash);

  if (!isValid) {
    return { error: "Email atau password salah" };
  }

  await createSession({
    userId: foundUser.id,
    email: foundUser.email,
    role: foundUser.role,
  });

  redirect("/dashboard");
}
