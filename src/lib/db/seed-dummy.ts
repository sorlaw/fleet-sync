import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, vehicles } from "./schema";
import { hashPassword } from "../auth/password";
import { inArray } from "drizzle-orm";

const DRIVERS = [
  {
    fullName: "Agus Prasetyo",
    email: "agus@fleetsync.com",
    phoneNumber: "6281110001001",
    licenseNumber: "B1234567890",
    address: "Jl. Merdeka No. 12, Jakarta Pusat",
  },
  {
    fullName: "Bambang Sutrisno",
    email: "bambang@fleetsync.com",
    phoneNumber: "6281110001002",
    licenseNumber: "B2345678901",
    address: "Jl. Gatot Subroto No. 45, Jakarta Selatan",
  },
  {
    fullName: "Citra Dewi",
    email: "citra@fleetsync.com",
    phoneNumber: "6281110001003",
    licenseNumber: "B3456789012",
    address: "Jl. Ahmad Yani No. 78, Bekasi",
  },
  {
    fullName: "Dedi Kurniawan",
    email: "dedi@fleetsync.com",
    phoneNumber: "6281110001004",
    licenseNumber: "B4567890123",
    address: "Jl. Sudirman No. 23, Tangerang",
  },
  {
    fullName: "Eko Handayani",
    email: "eko@fleetsync.com",
    phoneNumber: "6281110001005",
    licenseNumber: "B5678901234",
    address: "Jl. Diponegoro No. 56, Depok",
  },
  {
    fullName: "Fajar Nugroho",
    email: "fajar@fleetsync.com",
    phoneNumber: "6281110001006",
    licenseNumber: "B6789012345",
    address: "Jl. Pemuda No. 90, Bogor",
  },
  {
    fullName: "Gita Permata",
    email: "gita@fleetsync.com",
    phoneNumber: "6281110001007",
    licenseNumber: "B7890123456",
    address: "Jl. K.H. Hasyim Ashari No. 11, Jakarta Barat",
  },
  {
    fullName: "Hendra Wijaya",
    email: "hendra@fleetsync.com",
    phoneNumber: "6281110001008",
    licenseNumber: "B8901234567",
    address: "Jl. Raya Bogor No. 34, Jakarta Timur",
  },
  {
    fullName: "Indah Lestari",
    email: "indah@fleetsync.com",
    phoneNumber: "6281110001009",
    licenseNumber: "B9012345678",
    address: "Jl. Cendana No. 67, Karawang",
  },
  {
    fullName: "Joko Susilo",
    email: "joko@fleetsync.com",
    phoneNumber: "6281110001010",
    licenseNumber: "B0123456789",
    address: "Jl. Industri No. 98, Cikarang",
  },
];

const VEHICLES = [
  {
    licensePlate: "B1234ABC",
    makeModel: "Toyota Avanza 1.3 G",
    currentOdometer: 45000,
    status: "available" as const,
  },
  {
    licensePlate: "B5678DEF",
    makeModel: "Daihatsu Xenia 1.3 X",
    currentOdometer: 62500,
    status: "available" as const,
  },
  {
    licensePlate: "B9012GHI",
    makeModel: "Honda Brio Satya E",
    currentOdometer: 28300,
    status: "available" as const,
  },
  {
    licensePlate: "B3456JKL",
    makeModel: "Suzuki Ertiga GX",
    currentOdometer: 51200,
    status: "in_use" as const,
  },
  {
    licensePlate: "B7890MNO",
    makeModel: "Mitsubishi Xpander Ultimate",
    currentOdometer: 39800,
    status: "available" as const,
  },
  {
    licensePlate: "B2345PQR",
    makeModel: "Toyota Innova Zenix Q",
    currentOdometer: 21450,
    status: "available" as const,
  },
  {
    licensePlate: "B6789STU",
    makeModel: "Daihatsu Gran Max Blind Van",
    currentOdometer: 88700,
    status: "maintenance" as const,
  },
  {
    licensePlate: "B1357VWX",
    makeModel: "Honda Civic Turbo RS",
    currentOdometer: 17600,
    status: "available" as const,
  },
  {
    licensePlate: "B2468YZA",
    makeModel: "Toyota Hilux Double Cabin",
    currentOdometer: 102300,
    status: "available" as const,
  },
  {
    licensePlate: "B1122BCD",
    makeModel: "Suzuki Carry Pick Up",
    currentOdometer: 76400,
    status: "in_use" as const,
  },
];

async function seedDummy() {
  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString);
  const db = drizzle(client);

  const driverPassword = process.env.SEED_DRIVER_PASSWORD || "driver123";

  // Drivers
  const existingDriverEmails = await db
    .select({ email: users.email })
    .from(users)
    .where(inArray(users.email, DRIVERS.map((d) => d.email)));

  const existingSet = new Set(existingDriverEmails.map((r) => r.email));
  const newDrivers = DRIVERS.filter((d) => !existingSet.has(d.email));

  if (newDrivers.length === 0) {
    console.log("All 10 dummy drivers already exist, skipping drivers.");
  } else {
    const passwordHash = await hashPassword(driverPassword);
    await db.insert(users).values(
      newDrivers.map((d) => ({
        ...d,
        passwordHash,
        role: "driver" as const,
        status: "available" as const,
        isActive: true,
      }))
    );
    console.log(`Inserted ${newDrivers.length} drivers.`);
  }

  // Vehicles
  const existingPlates = await db
    .select({ plate: vehicles.licensePlate })
    .from(vehicles)
    .where(inArray(vehicles.licensePlate, VEHICLES.map((v) => v.licensePlate)));

  const plateSet = new Set(existingPlates.map((r) => r.plate));
  const newVehicles = VEHICLES.filter((v) => !plateSet.has(v.licensePlate));

  if (newVehicles.length === 0) {
    console.log("All 10 dummy vehicles already exist, skipping vehicles.");
  } else {
    await db.insert(vehicles).values(
      newVehicles.map((v) => ({
        ...v,
        imageUrl: [],
      }))
    );
    console.log(`Inserted ${newVehicles.length} vehicles.`);
  }

  console.log("Done.");
  await client.end();
  process.exit(0);
}

seedDummy().catch((err) => {
  console.error("Seed dummy failed:", err);
  process.exit(1);
});
