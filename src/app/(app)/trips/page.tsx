import { db } from "@/lib/db";
import { trips, vehicles, users } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";
import TripList from "./components/TripList";
import AddTripModal from "./components/AddTripModal";

export default async function TripsPage() {
  const session = await getSession();
  const isAdmin = session?.role === "admin";

  // Get all vehicles for the form
  const allVehicles = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.status, "available"));

  // Get all drivers for admin
  const allDrivers = isAdmin
    ? await db
        .select()
        .from(users)
        .where(and(eq(users.role, "driver"), eq(users.isActive, true)))
    : [];

  // Get trips based on role
  const allTrips = await db
    .select({
      id: trips.id,
      purpose: trips.purpose,
      status: trips.status,
      startMileage: trips.startMileage,
      endMileage: trips.endMileage,
      imageUrl: trips.imageUrl,
      returnImageUrl: trips.returnImageUrl,
      createdAt: trips.createdAt,
      driverId: trips.driverId,
      vehicleId: trips.vehicleId,
      driverName: users.fullName,
      driverPhone: users.phoneNumber,
      vehiclePlate: vehicles.licensePlate,
      vehicleModel: vehicles.makeModel,
    })
    .from(trips)
    .leftJoin(users, eq(trips.driverId, users.id))
    .leftJoin(vehicles, eq(trips.vehicleId, vehicles.id))
    .orderBy(trips.createdAt);

  // Filter for driver
  const filteredTrips = isAdmin
    ? allTrips
    : allTrips.filter((t) => t.driverId === session?.userId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Manajemen Trip
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Pantau status operasional trip, inspeksi kendaraan, dan penugasan driver
          </p>
        </div>
        <div>
          <AddTripModal
            vehicles={allVehicles}
            drivers={allDrivers}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      {/* Trip List Full Width */}
      <TripList trips={filteredTrips} isAdmin={isAdmin} />
    </div>
  );
}
