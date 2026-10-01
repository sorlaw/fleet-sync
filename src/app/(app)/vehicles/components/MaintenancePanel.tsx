"use client";

import { useActionState, useState } from "react";
import {
  addMaintenanceScheduleAction,
  markServicedAction,
  deleteMaintenanceScheduleAction,
} from "../actions";

interface ScheduleItem {
  id: string;
  vehicleId: string | null;
  maintenanceType: string;
  intervalKm: number | null;
  intervalDays: number | null;
  lastServiceOdometer: number | null;
  lastServiceDate: string | Date | null;
  vehiclePlate: string | null;
  vehicleModel: string | null;
  currentOdometer: number | null;
}

interface MaintenancePanelProps {
  schedules: ScheduleItem[];
  vehicles: { id: string; licensePlate: string; makeModel: string; currentOdometer: number | null }[];
}

type DueStatus = "overdue" | "soon" | "ok";

function computeStatus(s: ScheduleItem): { status: DueStatus; detail: string } {
  const now = Date.now();
  let worst: DueStatus = "ok";
  let detail = "-";

  const raise = (next: DueStatus) => {
    const rank = { ok: 0, soon: 1, overdue: 2 };
    if (rank[next] > rank[worst]) worst = next;
  };

  if (s.intervalKm) {
    const due = (s.lastServiceOdometer || 0) + s.intervalKm;
    const current = s.currentOdometer || 0;
    if (current >= due) {
      raise("overdue");
      detail = `${current.toLocaleString("id-ID")} / ${due.toLocaleString("id-ID")} km (LEWAT)`;
    } else if (current >= due - 1000) {
      raise("soon");
      detail = `${current.toLocaleString("id-ID")} / ${due.toLocaleString("id-ID")} km`;
    } else {
      detail = `${current.toLocaleString("id-ID")} / ${due.toLocaleString("id-ID")} km`;
    }
  }

  if (s.intervalDays && s.lastServiceDate) {
    const dueDate = new Date(s.lastServiceDate).getTime() + s.intervalDays * 86400000;
    const daysLeft = Math.ceil((dueDate - now) / 86400000);
    const dateStr = new Date(dueDate).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    if (daysLeft <= 0) {
      raise("overdue");
      detail = detail === "-" ? `${dateStr} (LEWAT)` : `${detail}, ${dateStr} (LEWAT)`;
    } else if (daysLeft <= 14) {
      raise("soon");
      detail = detail === "-" ? `${dateStr} (${daysLeft} hari)` : `${detail}, ${dateStr}`;
    } else if (detail === "-") {
      detail = dateStr;
    }
  }

  return { status: worst, detail };
}

const statusBadge: Record<DueStatus, { label: string; className: string }> = {
  overdue: {
    label: "Terlambat",
    className: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/50",
  },
  soon: {
    label: "Segera",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/50",
  },
  ok: {
    label: "Aman",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/50",
  },
};

const inputClass =
  "w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors";

export default function MaintenancePanel({
  schedules,
  vehicles,
}: MaintenancePanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [state, formAction, isPending] = useActionState(
    addMaintenanceScheduleAction,
    null
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleServiced = async (id: string) => {
    setBusyId(id);
    await markServicedAction(id);
    setBusyId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus jadwal servis ini?")) return;
    setBusyId(id);
    await deleteMaintenanceScheduleAction(id);
    setBusyId(null);
  };

  const sorted = [...schedules].sort((a, b) => {
    const rank = { overdue: 0, soon: 1, ok: 2 };
    return rank[computeStatus(a).status] - rank[computeStatus(b).status];
  });

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Jadwal Maintenance
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Pengingat servis berdasarkan odometer atau waktu
          </p>
        </div>
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-xs cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {showForm ? "Tutup" : "Tambah Jadwal"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-800/30">
          <form action={formAction} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Kendaraan</label>
              <select name="vehicleId" required className={inputClass}>
                <option value="">Pilih kendaraan</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.licensePlate} - {v.makeModel}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Jenis Servis</label>
              <input
                name="maintenanceType"
                required
                className={inputClass}
                placeholder="Ganti oli, cek rem, ..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Interval KM</label>
              <input name="intervalKm" type="number" className={inputClass} placeholder="10000" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Interval Hari</label>
              <input name="intervalDays" type="number" className={inputClass} placeholder="30" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Odometer Terakhir Servis</label>
              <input name="lastServiceOdometer" type="number" className={inputClass} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Tanggal Terakhir Servis</label>
              <input name="lastServiceDate" type="date" className={inputClass} />
            </div>

            {state?.error && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium sm:col-span-2 lg:col-span-3">
                {state.error}
              </p>
            )}
            {state?.success && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium sm:col-span-2 lg:col-span-3">
                Jadwal servis berhasil ditambahkan!
              </p>
            )}

            <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
              >
                {isPending ? "Menyimpan..." : "Simpan Jadwal"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50/70 dark:bg-zinc-800/40 border-b border-zinc-200/80 dark:border-zinc-800/80">
              <th className="px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Kendaraan</th>
              <th className="px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Servis</th>
              <th className="px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Interval</th>
              <th className="px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Servis Terakhir</th>
              <th className="px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 text-sm">
            {sorted.map((s) => {
              const { status, detail } = computeStatus(s);
              const badge = statusBadge[status];
              const intervals = [
                s.intervalKm ? `${s.intervalKm.toLocaleString("id-ID")} km` : null,
                s.intervalDays ? `${s.intervalDays} hari` : null,
              ]
                .filter(Boolean)
                .join(" / ");

              return (
                <tr key={s.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                      {s.vehiclePlate || "-"}
                    </span>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      {s.vehicleModel}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100 font-medium">
                    {s.maintenanceType}
                  </td>
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 text-xs font-mono whitespace-nowrap">
                    {intervals || "-"}
                  </td>
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 text-xs whitespace-nowrap">
                    {s.lastServiceDate
                      ? new Date(s.lastServiceDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                    <p className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">
                      {detail}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${badge.className}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleServiced(s.id)}
                        disabled={busyId === s.id}
                        className="px-2.5 py-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/50 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        Servis Selesai
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={busyId === s.id}
                        className="px-2.5 py-1 text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/50 rounded-md hover:bg-rose-100 dark:hover:bg-rose-900/50 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {schedules.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                  Belum ada jadwal maintenance. Klik &quot;Tambah Jadwal&quot; untuk membuat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
