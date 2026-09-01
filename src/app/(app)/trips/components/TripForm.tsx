"use client";

import { useActionState, useEffect } from "react";
import { createTripAction } from "../actions";

interface Vehicle {
  id: string;
  licensePlate: string;
  makeModel: string;
}

interface Driver {
  id: string;
  fullName: string;
}

interface TripFormProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  isAdmin: boolean;
  onSuccess?: () => void;
}

export default function TripForm({
  vehicles,
  drivers,
  isAdmin,
  onSuccess,
}: TripFormProps) {
  const [state, formAction, isPending] = useActionState(createTripAction, null);

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        onSuccess?.();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state?.success, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Pilih Kendaraan
        </label>
        <select
          name="vehicleId"
          required
          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
        >
          <option value="">-- Pilih Kendaraan Tersedia --</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.licensePlate} - {v.makeModel}
            </option>
          ))}
        </select>
      </div>

      {isAdmin && drivers.length > 0 && (
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Penugasan Driver
          </label>
          <select
            name="driverId"
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
          >
            <option value="">-- Pilih Driver --</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Tujuan / Keperluan
        </label>
        <textarea
          name="purpose"
          required
          rows={3}
          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
          placeholder="Contoh: Pengantaran dokumen ke klien di Jakarta Selatan"
        />
      </div>

      {state?.error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 rounded-lg flex items-center gap-2">
          <svg className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{state.error}</p>
        </div>
      )}

      {state?.success && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/50 rounded-lg flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            Trip berhasil dibuat!
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full mt-2 py-2.5 px-4 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-medium rounded-lg transition-all focus:outline-none active:scale-[0.98] disabled:opacity-50 shadow-xs cursor-pointer"
      >
        {isPending ? "Membuat Trip..." : "Buat Trip"}
      </button>
    </form>
  );
}
