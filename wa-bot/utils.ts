import pool from "./db";
import { Client, Message } from "whatsapp-web.js";
import { resolveJid } from "./utils-jid";

export function parseBookingCommand(text: string): {
  vehiclePlate: string;
  purpose: string;
} | null {
  // Format: booking [plat] ke [tujuan]
  // Contoh: booking XXXX ke Jakarta
  // Contoh: booking B 1234 ABC ke Jakarta

  // Cek apakah diawali dengan "booking"
  const match = text.match(/^booking\s+(.+)$/i);
  if (!match) return null;

  const rest = match[1];

  // Split berdasarkan " ke " (case-insensitive)
  const keIndex = rest.toLowerCase().indexOf(" ke ");
  if (keIndex === -1) return null;

  const plate = rest.substring(0, keIndex).trim();
  const purpose = rest.substring(keIndex + 4).trim();

  if (!plate || !purpose) return null;

  return {
    vehiclePlate: plate.toUpperCase(),
    purpose: purpose,
  };
}

export function extractPhoneNumber(jid: string): string {
  // Remove @c.us or @lid suffix
  return jid.replace("@c.us", "").replace("@lid", "");
}

export function formatPhoneNumber(phone: string): string {
  // Ensure starts with 62
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  }
  return cleaned;
}

export function isCommand(text: string, command: string): boolean {
  return text.toLowerCase().trim() === command.toLowerCase();
}

/**
 * Sync JID untuk semua user di database
 * Gunakan resolveJid untuk mendapatkan JID yang valid (bisa @lid atau @c.us)
 */
export async function syncUserJids(client: Client): Promise<void> {
  console.log("[JID Sync] Memulai sinkronisasi JID...");

  const users = await pool.query(
    "SELECT id, phone_number, full_name FROM users WHERE phone_number IS NOT NULL AND is_active = true"
  );

  let synced = 0;
  let failed = 0;

  for (const user of users.rows) {
    try {
      const jid = await resolveJid(client, user.phone_number);
      if (jid) {
        await pool.query(
          "UPDATE users SET wa_jid = $1 WHERE id = $2",
          [jid, user.id]
        );
        console.log(`[JID Sync] ✅ ${user.full_name}: ${user.phone_number} -> ${jid}`);
        synced++;
      } else {
        console.log(`[JID Sync] ⚠️ ${user.full_name}: Gagal resolve JID`);
        failed++;
      }
    } catch (error) {
      console.error(`[JID Sync] ❌ ${user.full_name}: Error`, error);
      failed++;
    }
  }

  console.log(`[JID Sync] Selesai! Synced: ${synced}, Failed: ${failed}`);
}

/**
 * Resolve sender dari pesan masuk
 * Cek berdasarkan wa_jid (paling akurat untuk @lid), lalu fallback ke phone_number
 */
export async function resolveSender(message: Message): Promise<{
  phone: string | null;
  name: string;
  isRegistered: boolean;
}> {
  try {
    const contact = await message.getContact();
    const phone = contact.number || null;
    const name = contact.pushname || contact.name || "Unknown";
    const senderJid = message.from; // Bisa @lid atau @c.us

    // 1. Cek berdasarkan wa_jid (paling akurat untuk @lid)
    const jidResult = await pool.query(
      "SELECT id, phone_number FROM users WHERE wa_jid = $1 AND is_active = true",
      [senderJid]
    );

    if (jidResult.rows.length > 0) {
      return {
        phone: jidResult.rows[0].phone_number,
        name,
        isRegistered: true,
      };
    }

    // 2. Fallback: cek berdasarkan phone number
    if (phone) {
      const phoneResult = await pool.query(
        "SELECT id FROM users WHERE phone_number = $1 AND is_active = true",
        [phone]
      );
      if (phoneResult.rows.length > 0) {
        // Simpan wa_jid untuk下次
        await pool.query(
          "UPDATE users SET wa_jid = $1 WHERE phone_number = $2",
          [senderJid, phone]
        );
        return { phone, name, isRegistered: true };
      }
    }

    // 3. Tidak terdaftar
    return { phone, name, isRegistered: false };
  } catch (error) {
    console.error("Error resolving sender:", error);
    return { phone: null, name: "Unknown", isRegistered: false };
  }
}
