"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface FilterProps {
  drivers: { id: string; fullName: string }[];
  vehicles: { id: string; licensePlate: string }[];
  current: {
    from: string;
    to: string;
    driverId: string;
    vehicleId: string;
    status: string;
  };
  hasFilter: boolean;
}

const statuses = [
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "in_progress", label: "Berlangsung" },
  { value: "returned", label: "Dikembalikan" },
  { value: "completed", label: "Selesai" },
  { value: "rejected", label: "Ditolak" },
];

const inputClass =
  "w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors";

export default function ReportFilters({
  drivers,
  vehicles,
  current,
  hasFilter,
}: FilterProps) {
  const router = useRouter();
  const [filters, setFilters] = useState(current);

  const apply = (next: typeof filters) => {
    const query = new URLSearchParams();
    if (next.from) query.set("from", next.from);
    if (next.to) query.set("to", next.to);
    if (next.driverId) query.set("driverId", next.driverId);
    if (next.vehicleId) query.set("vehicleId", next.vehicleId);
    if (next.status) query.set("status", next.status);
    const qs = query.toString();
    router.replace(qs ? `/reports?${qs}` : "/reports");
  };

  const update = (key: keyof typeof filters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    apply(next);
  };

  const reset = () => {
    const empty = { from: "", to: "", driverId: "", vehicleId: "", status: "" };
    setFilters(empty);
    apply(empty);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="space-y-1">
          <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Dari Tanggal
          </label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => update("from", e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Sampai Tanggal
          </label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => update("to", e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Driver
          </label>
          <select
            value={filters.driverId}
            onChange={(e) => update("driverId", e.target.value)}
            className={inputClass}
          >
            <option value="">Semua driver</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Kendaraan
          </label>
          <select
            value={filters.vehicleId}
            onChange={(e) => update("vehicleId", e.target.value)}
            className={inputClass}
          >
            <option value="">Semua kendaraan</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.licensePlate}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            Status
          </label>
          <div className="flex gap-2">
            <select
              value={filters.status}
              onChange={(e) => update("status", e.target.value)}
              className={inputClass}
            >
              <option value="">Semua status</option>
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {hasFilter && (
              <button
                onClick={reset}
                className="px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 whitespace-nowrap transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
