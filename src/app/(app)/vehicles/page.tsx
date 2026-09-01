import { db } from "@/lib/db";
import { vehicles } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import VehicleList from "./components/VehicleList";
import AddVehicleModal from "./components/AddVehicleModal";

export default async function VehiclesPage() {
  const session = await getSession();
  if (session?.role !== "admin") {
    redirect("/dashboard");
  }

  const allVehicles = await db
    .select()
    .from(vehicles)
    .orderBy(vehicles.createdAt);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Manajemen Kendaraan
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Kelola armada kendaraan, status ketersediaan, dan riwayat odometer
          </p>
        </div>
        <div>
          <AddVehicleModal />
        </div>
      </div>

      {/* Vehicle List Full Width */}
      <VehicleList vehicles={allVehicles} />
    </div>
  );
}
