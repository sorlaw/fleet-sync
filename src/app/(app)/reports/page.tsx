import { db } from "@/lib/db";
import { trips, vehicles, users, tripExpenses } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { eq, and, gte, lte, sum } from "drizzle-orm";
import ReportFilters from "./components/ReportFilters";
import ExportCsvButton from "./components/ExportCsvButton";
import StatusBadge from "./components/StatusBadge";

interface SearchParams {
  from?: string;
  to?: string;
  driverId?: string;
  vehicleId?: string;
  status?: string;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (session?.role !== "admin") redirect("/dashboard");

  const params = await searchParams;

  const conditions = [];
  const validStatuses = [
    "pending",
    "approved",
    "in_progress",
    "returned",
    "completed",
    "rejected",
  ] as const;
  if (params.from) conditions.push(gte(trips.createdAt, new Date(params.from)));
  if (params.to) {
    const to = new Date(params.to);
    to.setHours(23, 59, 59, 999);
    conditions.push(lte(trips.createdAt, to));
  }
  if (params.driverId) conditions.push(eq(trips.driverId, params.driverId));
  if (params.vehicleId) conditions.push(eq(trips.vehicleId, params.vehicleId));
  if (params.status && (validStatuses as readonly string[]).includes(params.status)) {
    conditions.push(eq(trips.status, params.status as (typeof validStatuses)[number]));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, drivers, vehicleList, expenseTotals] = await Promise.all([
    db
      .select({
        id: trips.id,
        purpose: trips.purpose,
        status: trips.status,
        startMileage: trips.startMileage,
        endMileage: trips.endMileage,
        createdAt: trips.createdAt,
        driverName: users.fullName,
        vehiclePlate: vehicles.licensePlate,
        vehicleModel: vehicles.makeModel,
      })
      .from(trips)
      .leftJoin(users, eq(trips.driverId, users.id))
      .leftJoin(vehicles, eq(trips.vehicleId, vehicles.id))
      .where(where)
      .orderBy(trips.createdAt),
    db
      .select({ id: users.id, fullName: users.fullName })
      .from(users)
      .where(eq(users.role, "driver")),
    db
      .select({ id: vehicles.id, licensePlate: vehicles.licensePlate })
      .from(vehicles),
    db
      .select({ tripId: tripExpenses.tripId, total: sum(tripExpenses.amount) })
      .from(tripExpenses)
      .groupBy(tripExpenses.tripId),
  ]);

  const fuelByTrip = new Map(
    expenseTotals.map((e) => [e.tripId, Number(e.total) || 0])
  );

  const reportRows = rows.map((r) => {
    const distance =
      r.startMileage != null && r.endMileage != null
        ? r.endMileage - r.startMileage
        : null;
    return {
      id: r.id,
      date: r.createdAt
        ? new Date(r.createdAt).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "-",
      driverName: r.driverName || "-",
      vehicle: r.vehiclePlate
        ? `${r.vehiclePlate} - ${r.vehicleModel}`
        : "-",
      purpose: r.purpose || "-",
      status: r.status || "pending",
      distance,
      fuelCost: fuelByTrip.get(r.id) || 0,
    };
  });

  const totalTrips = reportRows.length;
  const completedTrips = reportRows.filter((r) => r.status === "completed").length;
  const totalDistance = reportRows.reduce((acc, r) => acc + (r.distance || 0), 0);
  const totalFuelCost = reportRows.reduce((acc, r) => acc + r.fuelCost, 0);

  const hasFilter =
    params.from || params.to || params.driverId || params.vehicleId || params.status;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Laporan Trip
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Riwayat perjalanan, jarak tempuh, dan biaya BBM armada
          </p>
        </div>
        <ExportCsvButton
          data={reportRows.map((r) => ({
            Tanggal: r.date,
            Driver: r.driverName,
            Kendaraan: r.vehicle,
            Tujuan: r.purpose,
            Status: r.status,
            "Jarak (km)": r.distance ?? "",
            "Biaya BBM (Rp)": r.fuelCost || "",
          }))}
          filename="laporan-trip.csv"
        />
      </div>

      {/* Filters */}
      <ReportFilters
        drivers={drivers}
        vehicles={vehicleList}
        current={{
          from: params.from || "",
          to: params.to || "",
          driverId: params.driverId || "",
          vehicleId: params.vehicleId || "",
          status: params.status || "",
        }}
        hasFilter={!!hasFilter}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Total Trip" value={totalTrips.toLocaleString("id-ID")} />
        <SummaryCard title="Trip Selesai" value={completedTrips.toLocaleString("id-ID")} />
        <SummaryCard title="Total Jarak" value={`${totalDistance.toLocaleString("id-ID")} km`} />
        <SummaryCard title="Total Biaya BBM" value={`Rp ${totalFuelCost.toLocaleString("id-ID")}`} />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/70 dark:bg-zinc-800/40 border-b border-zinc-200/80 dark:border-zinc-800/80">
                <th className="px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Driver</th>
                <th className="px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Kendaraan</th>
                <th className="px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tujuan</th>
                <th className="px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Jarak</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Biaya BBM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 text-sm">
              {reportRows.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 text-xs whitespace-nowrap">
                    {r.date}
                  </td>
                  <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100 font-medium">
                    {r.driverName}
                  </td>
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                      {r.vehicle}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                    {r.purpose}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-6 py-4 text-right text-zinc-600 dark:text-zinc-400 font-mono text-xs whitespace-nowrap">
                    {r.distance != null ? `${r.distance.toLocaleString("id-ID")} km` : "-"}
                  </td>
                  <td className="px-6 py-4 text-right text-zinc-600 dark:text-zinc-400 font-mono text-xs whitespace-nowrap">
                    {r.fuelCost ? `Rp ${r.fuelCost.toLocaleString("id-ID")}` : "-"}
                  </td>
                </tr>
              ))}
              {reportRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                    Tidak ada data trip untuk filter ini
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

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}
