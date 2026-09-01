import pool from "../db";
import { templates } from "../templates";
import { parseBookingCommand } from "../utils";

export async function handleBooking(
  text: string,
  senderPhone: string | null
): Promise<string> {
  const parsed = parseBookingCommand(text);

  if (!parsed) {
    return templates.bookingFailed(
      "Format salah.\n\nGunakan: *booking [plat] ke [tujuan]*\nContoh: *booking XXXX ke Jakarta*"
    );
  }

  const { vehiclePlate, purpose } = parsed;

  if (!senderPhone) {
    return templates.bookingFailed(
      "Nomor Anda tidak dapat diverifikasi.\n\nHubungi admin untuk mendaftar."
    );
  }

  try {
    // Find driver by phone number
    const driverResult = await pool.query(
      "SELECT id, full_name FROM users WHERE phone_number = $1 AND role = 'driver' AND is_active = true",
      [senderPhone]
    );

    if (driverResult.rows.length === 0) {
      return templates.bookingFailed(
        "Nomor Anda belum terdaftar sebagai driver.\n\nHubungi admin untuk mendaftar."
      );
    }

    const driver = driverResult.rows[0];

    // Find vehicle by license plate
    const vehicleResult = await pool.query(
      "SELECT id, license_plate, make_model, status FROM vehicles WHERE license_plate = $1",
      [vehiclePlate]
    );

    if (vehicleResult.rows.length === 0) {
      return templates.bookingFailed(
        `Kendaraan dengan plat *${vehiclePlate}* tidak ditemukan.`
      );
    }

    const vehicle = vehicleResult.rows[0];

    if (vehicle.status !== "available") {
      return templates.bookingFailed(
        `Kendaraan *${vehicle.license_plate}* sedang tidak tersedia.\nStatus: ${vehicle.status}`
      );
    }

    // Create trip
    await pool.query(
      "INSERT INTO trips (driver_id, vehicle_id, purpose, status) VALUES ($1, $2, $3, 'pending')",
      [driver.id, vehicle.id, purpose]
    );

    // Notify admins
    const adminResult = await pool.query(
      "SELECT phone_number FROM users WHERE role = 'admin' AND is_active = true AND phone_number IS NOT NULL"
    );

    const adminMessage = templates.newBookingAdmin(
      driver.full_name,
      `${vehicle.license_plate} - ${vehicle.make_model}`,
      purpose
    );

    // Return success message and admin notifications
    return JSON.stringify({
      type: "booking_success",
      reply: templates.bookingSuccess(
        `${vehicle.license_plate} - ${vehicle.make_model}`,
        purpose
      ),
      adminNotifications: adminResult.rows.map((admin) => ({
        phone: admin.phone_number,
        message: adminMessage,
      })),
    });
  } catch (error) {
    console.error("Booking error:", error);
    return templates.error();
  }
}
