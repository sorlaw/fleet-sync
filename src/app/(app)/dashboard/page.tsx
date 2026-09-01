import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { vehicles, trips, users } from "@/lib/db/schema";
import { eq, count, and } from "drizzle-orm";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getSession();
  const isAdmin = session?.role === "admin";

  // Get stats for admin
  const totalVehicles = isAdmin
    ? (await db.select({ count: count() }).from(vehicles))[0]?.count || 0
    : 0;

  const activeVehicles = isAdmin
    ? (await db
        .select({ count: count() })
        .from(vehicles)
        .where(eq(vehicles.status, "in_use")))[0]?.count || 0
    : 0;

  const maintenanceVehicles = isAdmin
    ? (await db
        .select({ count: count() })
        .from(vehicles)
        .where(eq(vehicles.status, "maintenance")))[0]?.count || 0
    : 0;

  const activeTrips = isAdmin
    ? (await db
        .select({ count: count() })
        .from(trips)
        .where(
          and(
            eq(trips.status, "in_progress")
          )
        ))[0]?.count || 0
    : 0;

  // Get recent trips
  const recentTrips = await db
    .select({
      id: trips.id,
      purpose: trips.purpose,
      status: trips.status,
      createdAt: trips.createdAt,
      driverName: users.fullName,
      vehiclePlate: vehicles.licensePlate,
    })
    .from(trips)
    .leftJoin(users, eq(trips.driverId, users.id))
    .leftJoin(vehicles, eq(trips.vehicleId, vehicles.id))
    .orderBy(trips.createdAt)
    .limit(isAdmin ? 10 : 5);

  // Driver-specific trips
  const driverTrips = !isAdmin
    ? await db
        .select()
        .from(trips)
        .where(eq(trips.driverId, session?.userId || ""))
        .orderBy(trips.createdAt)
        .limit(5)
    : [];

  const tripList = isAdmin ? recentTrips : driverTrips;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Dashboard
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {isAdmin
              ? "Ringkasan operasional dan status armada kendaraan"
              : "Ringkasan perjalanan dan jadwal trip Anda"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/trips"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Buat Trip</span>
          </Link>
        </div>
      </div>

      {/* Admin Stat Cards */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Kendaraan"
            value={totalVehicles}
            badge="Armada"
            icon={
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h.008v.008H16.5v-.008z" />
              </svg>
            }
          />
          <StatCard
            title="Kendaraan Aktif"
            value={activeVehicles}
            badge="Sedang Digunakan"
            icon={
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            }
          />
          <StatCard
            title="Maintenance"
            value={maintenanceVehicles}
            badge="Perbaikan"
            icon={
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l5.654-4.654m.566-.566l3.03-2.495c.384-.317.626-.74.766-1.208M9.664 9.664L3.836 3.836A2.652 2.652 0 017.586.086l5.877 5.877M9.664 9.664L12.7 12.7" />
              </svg>
            }
          />
          <StatCard
            title="Trip Aktif"
            value={activeTrips}
            badge="Berlangsung"
            icon={
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            }
          />
        </div>
      )}

      {/* Trips Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {isAdmin ? "Trip Terbaru" : "Trip Saya"}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {isAdmin ? "Daftar perjalanan terbaru dari seluruh pengemudi" : "Daftar perjalanan yang Anda jadwalkan"}
            </p>
          </div>
          <Link
            href="/trips"
            className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Lihat semua &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/70 dark:bg-zinc-800/40 border-b border-zinc-200/80 dark:border-zinc-800/80">
                <th className="px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  {isAdmin ? "Driver" : "Tujuan"}
                </th>
                <th className="px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Kendaraan
                </th>
                <th className="px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Tanggal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 text-sm">
              {tripList.map((trip) => (
                <tr 
                  key={trip.id}
                  className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100 font-medium">
                    {isAdmin
                      ? (trip as { driverName?: string }).driverName || "-"
                      : trip.purpose || "-"}
                  </td>
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                      {(trip as { vehiclePlate?: string }).vehiclePlate || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={trip.status || "pending"} />
                  </td>
                  <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 text-xs">
                    {trip.createdAt
                      ? new Date(trip.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </td>
                </tr>
              ))}

              {tripList.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm font-medium">Belum ada trip tercatat</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  badge,
  icon,
}: {
  title: string;
  value: number;
  badge: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{title}</span>
        <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {value}
        </p>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60">
          {badge}
        </span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: {
      label: "Menunggu",
      className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/50",
    },
    approved: {
      label: "Disetujui",
      className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/50",
    },
    in_progress: {
      label: "Berlangsung",
      className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/50",
    },
    returned: {
      label: "Dikembalikan",
      className: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/50",
    },
    completed: {
      label: "Selesai",
      className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
    },
    rejected: {
      label: "Ditolak",
      className: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/50",
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${config.className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {config.label}
    </span>
  );
}
