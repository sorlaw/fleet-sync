"use client";

import { useActionState } from "react";
import { updateProfileAction } from "../actions";

interface ProfileFormProps {
  user: {
    fullName: string;
    email: string;
    phoneNumber: string;
    licenseNumber: string;
    address: string;
  };
}

const inputClass =
  "w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors";

export default function ProfileForm({ user }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Email
        </label>
        <input
          type="email"
          value={user.email}
          disabled
          className={`${inputClass} opacity-60 cursor-not-allowed font-mono`}
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Nama Lengkap
        </label>
        <input
          name="fullName"
          type="text"
          required
          defaultValue={user.fullName}
          className={inputClass}
          placeholder="Nama lengkap"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Nomor WhatsApp
          </label>
          <input
            name="phoneNumber"
            type="text"
            defaultValue={user.phoneNumber}
            className={`${inputClass} font-mono`}
            placeholder="628123456789"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Nomor SIM
          </label>
          <input
            name="licenseNumber"
            type="text"
            defaultValue={user.licenseNumber}
            className={`${inputClass} font-mono`}
            placeholder="1234567890"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Alamat
        </label>
        <textarea
          name="address"
          rows={2}
          defaultValue={user.address}
          className={inputClass}
          placeholder="Alamat tinggal"
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
            Profil berhasil diupdate!
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full mt-2 py-2.5 px-4 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-medium rounded-lg transition-all focus:outline-none active:scale-[0.98] disabled:opacity-50 shadow-xs cursor-pointer"
      >
        {isPending ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </form>
  );
}
