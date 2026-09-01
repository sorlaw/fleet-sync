import pool from "../db";
import { templates } from "../templates";

export async function handleAvailable(): Promise<string> {
  try {
    const result = await pool.query(
      "SELECT license_plate, make_model FROM vehicles WHERE status = 'available' ORDER BY license_plate"
    );

    const vehicles = result.rows.map((row) => ({
      licensePlate: row.license_plate,
      makeModel: row.make_model,
    }));

    return templates.availableVehicles(vehicles);
  } catch (error) {
    console.error("Available error:", error);
    return templates.error();
  }
}
