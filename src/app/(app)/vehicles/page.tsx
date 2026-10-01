import { db } from "@/lib/db";
import { vehicles, maintenanceSchedules } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import VehicleList from "./components/VehicleList";
import AddVehicleModal from "./components/AddVehicleModal";
import MaintenancePanel from "./components/MaintenancePanel";

export default async function VehiclesPage() {
  const session = await getSession();
  if (session?.role !== "admin") {
    redirect("/dashboard");
  }

  const allVehicles = await db
    .select()
    .from(vehicles)
    .orderBy(vehicles.createdAt);

  const scheduleRows = await db
    .select({
      id: maintenanceSchedules.id,
      vehicleId: maintenanceSchedules.vehicleId,
      maintenanceType: maintenanceSchedules.maintenanceType,
      intervalKm: maintenanceSchedules.intervalKm,
      intervalDays: maintenanceSchedules.intervalDays,
      lastServiceOdometer: maintenanceSchedules.lastServiceOdometer,
      lastServiceDate: maintenanceSchedules.lastServiceDate,
      vehiclePlate: vehicles.licensePlate,
      vehicleModel: vehicles.makeModel,
      currentOdometer: vehicles.currentOdometer,
    })
    .from(maintenanceSchedules)
    .leftJoin(vehicles, eq(maintenanceSchedules.vehicleId, vehicles.id));

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

      {/* Maintenance schedules */}
      <MaintenancePanel
        schedules={scheduleRows.map((s) => ({
          ...s,
          lastServiceDate: s.lastServiceDate?.toISOString() ?? null,
        }))}
        vehicles={allVehicles.map((v) => ({
          id: v.id,
          licensePlate: v.licensePlate,
          makeModel: v.makeModel,
          currentOdometer: v.currentOdometer,
        }))}
      />
    </div>
  );
}
