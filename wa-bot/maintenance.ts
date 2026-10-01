import { Client } from "whatsapp-web.js";
import pool from "./db";
import { resolveJid } from "./utils-jid";

interface DueSchedule {
  schedule_id: string;
  maintenance_type: string;
  interval_km: number | null;
  interval_days: number | null;
  last_service_odometer: number | null;
  last_service_date: string | null;
  last_reminded_at: string | null;
  license_plate: string | null;
  make_model: string | null;
  current_odometer: number | null;
}

function computeDue(s: DueSchedule): { due: boolean; detail: string } {
  const now = Date.now();
  let due = false;
  let detail = "";

  if (s.interval_km) {
    const threshold = (s.last_service_odometer || 0) + s.interval_km;
    const current = s.current_odometer || 0;
    if (current >= threshold) {
      due = true;
      detail = `odometer ${current.toLocaleString("id-ID")} km (batas ${threshold.toLocaleString("id-ID")} km)`;
    } else if (current >= threshold - 1000) {
      detail = `odometer ${current.toLocaleString("id-ID")} km (batas ${threshold.toLocaleString("id-ID")} km)`;
    }
  }

  if (s.interval_days && s.last_service_date) {
    const dueTime =
      new Date(s.last_service_date).getTime() + s.interval_days * 86400000;
    if (now >= dueTime) {
      due = true;
      const dateStr = new Date(dueTime).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      detail = detail ? `${detail}, jatuh tempo ${dateStr}` : `jatuh tempo ${dateStr}`;
    } else if (dueTime - now <= 14 * 86400000) {
      const dateStr = new Date(dueTime).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      detail = detail ? `${detail}, jatuh tempo ${dateStr}` : `jatuh tempo ${dateStr}`;
    }
  }

  return { due, detail };
}

function shouldRemind(lastRemindedAt: string | null): boolean {
  if (!lastRemindedAt) return true;
  return Date.now() - new Date(lastRemindedAt).getTime() > 24 * 3600 * 1000;
}

/**
 * Cek jadwal maintenance yang jatuh tempo / mendekati,
 * kirim WA ke admin + insert notifikasi in-app, lalu tandai last_reminded_at.
 */
export async function checkMaintenanceReminders(waClient: Client): Promise<void> {
  try {
    const result = await pool.query(`
      SELECT
        ms.id AS schedule_id,
        ms.maintenance_type,
        ms.interval_km,
        ms.interval_days,
        ms.last_service_odometer,
        ms.last_service_date,
        ms.last_reminded_at,
        v.license_plate,
        v.make_model,
        v.current_odometer
      FROM maintenance_schedules ms
      LEFT JOIN vehicles v ON v.id = ms.vehicle_id
    `);

    const pending = (result.rows as DueSchedule[]).filter((s) => {
      if (!shouldRemind(s.last_reminded_at)) return false;
      const { due, detail } = computeDue(s);
      return due && !!detail;
    });

    if (pending.length === 0) return;

    const admins = await pool.query(
      "SELECT id, phone_number FROM users WHERE role = 'admin' AND is_active = true"
    );

    for (const s of pending) {
      const { detail } = computeDue(s);
      const vehicleLabel = `${s.license_plate || "?"} - ${s.make_model || "?"}`;

      const message =
        `*Pengingat Maintenance* 🔧\n\n` +
        `Kendaraan: ${vehicleLabel}\n` +
        `Servis: ${s.maintenance_type}\n` +
        `Status: ${detail}\n\n` +
        `Segera jadwalkan servis.`;

      // Insert notifikasi in-app untuk semua admin
      try {
        for (const admin of admins.rows) {
          await pool.query(
            `INSERT INTO notifications (user_id, type, title, body)
             VALUES ($1, 'maintenance_due', $2, $3)`,
            [
              admin.id,
              "Pengingat Maintenance 🔧",
              `${vehicleLabel} — ${s.maintenance_type}: ${detail}`,
            ]
          );
        }
      } catch (err) {
        console.error("[Maintenance] Gagal insert notifikasi:", err);
      }

      // Kirim WA ke admin
      for (const admin of admins.rows) {
        if (!admin.phone_number) continue;
        try {
          const jid = await resolveJid(waClient, admin.phone_number);
          if (jid && !jid.includes("@lid")) {
            await waClient.sendMessage(jid, message);
          }
        } catch (err) {
          console.error(
            `[Maintenance] Gagal kirim WA ke ${admin.phone_number}:`,
            err
          );
        }
      }

      // Tandai sudah diingatkan
      try {
        await pool.query(
          "UPDATE maintenance_schedules SET last_reminded_at = now(), updated_at = now() WHERE id = $1",
          [s.schedule_id]
        );
      } catch (err) {
        console.error("[Maintenance] Gagal update last_reminded_at:", err);
      }
    }

    console.log(`[Maintenance] ${pending.length} jadwal diingatkan`);
  } catch (error) {
    console.error("[Maintenance] Error check reminders:", error);
  }
}
