"use client";

import { useActionState } from "react";
import { changePasswordAction } from "../actions";

const inputClass =
  "w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors";

export default function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changePasswordAction,
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Password Lama
        </label>
        <input
          name="currentPassword"
          type="password"
          required
          className={inputClass}
          placeholder="Password saat ini"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Password Baru
        </label>
        <input
          name="newPassword"
          type="password"
          required
          minLength={6}
          className={inputClass}
          placeholder="Minimal 6 karakter"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Konfirmasi Password Baru
        </label>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={6}
          className={inputClass}
          placeholder="Ulangi password baru"
        />
      </div>

      {state?.error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 rounded-lg flex items-center gap-2">
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
            {state.error}
          </p>
        </div>
      )}

      {state?.success && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/50 rounded-lg flex items-center gap-2">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Password berhasil diganti!
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full mt-2 py-2.5 px-4 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-medium rounded-lg transition-all focus:outline-none active:scale-[0.98] disabled:opacity-50 shadow-xs cursor-pointer"
      >
        {isPending ? "Menyimpan..." : "Ganti Password"}
      </button>
    </form>
  );
}
