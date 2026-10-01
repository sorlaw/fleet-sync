import { db } from "@/lib/db";
import { users, trips, vehicles } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import ProfileForm from "./components/ProfileForm";
import ChangePasswordForm from "./components/ChangePasswordForm";
import StatusBadge from "../reports/components/StatusBadge";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (userRows.length === 0) redirect("/login");
  const user = userRows[0];

  const myTrips = await db
    .select({
      id: trips.id,
      purpose: trips.purpose,
      status: trips.status,
      startMileage: trips.startMileage,
      endMileage: trips.endMileage,
      createdAt: trips.createdAt,
      vehiclePlate: vehicles.licensePlate,
      vehicleModel: vehicles.makeModel,
    })
    .from(trips)
    .leftJoin(vehicles, eq(trips.vehicleId, vehicles.id))
    .where(eq(trips.driverId, session.userId))
    .orderBy(desc(trips.createdAt));

  const stats = {
    total: myTrips.length,
    completed: myTrips.filter((t) => t.status === "completed").length,
    rejected: myTrips.filter((t) => t.status === "rejected").length,
    distance: myTrips.reduce(
      (acc, t) =>
        acc +
        (t.startMileage != null && t.endMileage != null
          ? t.endMileage - t.startMileage
          : 0),
      0
    ),
  };

  const recentTrips = myTrips.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Profil Saya
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Kelola data diri, password, dan lihat statistik perjalanan Anda
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Trip" value={stats.total} />
        <StatCard title="Trip Selesai" value={stats.completed} />
        <StatCard title="Trip Ditolak" value={stats.rejected} />
        <StatCard title="Total Jarak" value={`${stats.distance.toLocaleString("id-ID")} km`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Profile form */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Data Diri
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Email tidak dapat diubah dari halaman ini
            </p>
          </div>
          <div className="p-6">
            <ProfileForm
              user={{
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber || "",
                licenseNumber: user.licenseNumber || "",
                address: user.address || "",
              }}
            />
          </div>
        </div>

        {/* Change password */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Ganti Password
            </h2>
          </div>
          <div className="p-6">
            <ChangePasswordForm />
          </div>
        </div>
      </div>

      {/* Recent trips */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Trip Terakhir
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/70 dark:bg-zinc-800/40 border-b border-zinc-200/80 dark:border-zinc-800/80">
                <th className="px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Kendaraan</th>
                <th className="px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tujuan</th>
                <th className="px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 text-sm">
              {recentTrips.map((trip) => (
                <tr key={trip.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 text-xs whitespace-nowrap">
                    {trip.createdAt
                      ? new Date(trip.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                      {trip.vehiclePlate || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                    {trip.purpose || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={trip.status || "pending"} />
                  </td>
                </tr>
              ))}
              {recentTrips.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                    Belum ada trip
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

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}
