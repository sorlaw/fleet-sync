import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  numeric,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().$type<"admin" | "driver">(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  waJid: varchar("wa_jid", { length: 100 }),
  avatarUrl: text("avatar_url"),
  licenseNumber: varchar("license_number", { length: 50 }),
  address: text("address"),
  status: varchar("status", { length: 20 }).default("available").$type<"available" | "busy">(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const vehicles = pgTable("vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  licensePlate: varchar("license_plate", { length: 20 }).unique().notNull(),
  makeModel: varchar("make_model", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).default("available").$type<"available" | "in_use" | "maintenance">(),
  imageUrl: jsonb("image_url").$type<string[]>(),
  currentOdometer: integer("current_odometer").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const trips = pgTable("trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  driverId: uuid("driver_id").references(() => users.id),
  vehicleId: uuid("vehicle_id").references(() => vehicles.id),
  purpose: text("purpose"),
  status: varchar("status", { length: 20 }).default("pending").$type<
    "pending" | "approved" | "in_progress" | "returned" | "completed" | "rejected"
  >(),
  dispatchNotes: text("dispatch_notes"),
  imageUrl: jsonb("image_url").$type<{ front: string; rear: string; left: string; right: string }>(),
  startMileage: integer("start_mileage"),
  endMileage: integer("end_mileage"),
  returnImageUrl: jsonb("return_image_url").$type<{ front: string; rear: string; left: string; right: string }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const inspections = pgTable("inspections", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id").references(() => trips.id),
  inspectionType: varchar("inspection_type", { length: 20 }).notNull().$type<"pickup" | "return">(),
  frontPhotoUrl: text("front_photo_url"),
  rearPhotoUrl: text("rear_photo_url"),
  leftPhotoUrl: text("left_photo_url"),
  rightPhotoUrl: text("right_photo_url"),
  driverNotes: text("driver_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tripExpenses = pgTable("trip_expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "cascade" }),
  expenseType: varchar("expense_type", { length: 20 }).default("fuel").$type<"fuel" | "other">(),
  liters: numeric("liters", { precision: 8, scale: 2 }),
  pricePerLiter: integer("price_per_liter"),
  amount: integer("amount"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const maintenanceSchedules = pgTable("maintenance_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  vehicleId: uuid("vehicle_id").references(() => vehicles.id),
  maintenanceType: varchar("maintenance_type", { length: 100 }).notNull(),
  intervalKm: integer("interval_km"),
  intervalDays: integer("interval_days"),
  lastServiceOdometer: integer("last_service_odometer").default(0),
  lastServiceDate: timestamp("last_service_date").defaultNow(),
  lastRemindedAt: timestamp("last_reminded_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  type: varchar("type", { length: 30 }).notNull().$type<
    "trip_created" | "trip_approved" | "trip_rejected" | "trip_completed" | "maintenance_due"
  >(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "cascade" }),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
