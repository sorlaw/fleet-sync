import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "./schema";
import { hashPassword } from "../auth/password";
import { eq } from "drizzle-orm";

async function seed() {
  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString);
  const db = drizzle(client);

  const adminEmail = "admin@fleetsync.com";
  const adminPassword = "admin123";

  // Check if admin already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail));

  if (existing.length > 0) {
    console.log("Admin user already exists");
    process.exit(0);
  }

  const passwordHash = await hashPassword(adminPassword);

  await db.insert(users).values({
    email: adminEmail,
    passwordHash,
    fullName: "Admin FleetSync",
    role: "admin",
    phoneNumber: "628123456789",
    status: "available",
    isActive: true,
  });

  console.log("Admin user created:");
  console.log(`  Email: ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);
  console.log("  Role: admin");

  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
