import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { Client, LocalAuth, Message } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { createServer } from "./server";
import { handleBooking } from "./handlers/booking";
import { handleAvailable } from "./handlers/available";
import { handleHelp } from "./handlers/help";
import { isCommand, resolveSender, syncUserJids } from "./utils";
import { resolveJid } from "./utils-jid";

const BOT_PORT = parseInt(process.env.BOT_PORT || "3001");

// Initialize WhatsApp client
const waClient = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

// QR Code for authentication
waClient.on("qr", (qr) => {
  console.log("\n=== SCAN QR CODE DI BAWAH INI ===\n");
  qrcode.generate(qr, { small: true });
  console.log("\n==================================\n");
});

// Client ready
waClient.on("ready", async () => {
  console.log("✅ WhatsApp Bot terhubung!");
  console.log(`📱 Nomor: ${waClient.info?.wid.user}`);

  // Sync JID untuk semua user
  await syncUserJids(waClient);

  // Start Express server
  const app = createServer(waClient);
  app.listen(BOT_PORT, () => {
    console.log(`🚀 Bot server berjalan di port ${BOT_PORT}`);
    console.log(`📡 Health check: http://localhost:${BOT_PORT}/health`);
  });
});

// Authentication failure
waClient.on("auth_failure", (msg) => {
  console.error("❌ Auth failure:", msg);
});

// Disconnected
waClient.on("disconnected", (reason) => {
  console.log("⚠️ WhatsApp disconnected:", reason);
});

// Handle incoming messages
waClient.on("message", async (message: Message) => {
  const text = message.body.trim();
  const sender = message.from;

  // Skip group messages and status
  if (sender.includes("@g.us") || sender === "status@broadcast") {
    return;
  }

  // Resolve sender and validate registration
  const senderInfo = await resolveSender(message);
  if (!senderInfo.isRegistered) {
    console.log(
      `⚠️ Nomor tidak terdaftar: ${senderInfo.phone || sender} (${senderInfo.name})`,
    );
    return;
  }

  console.log(
    `📨 Pesan dari ${senderInfo.name} (${senderInfo.phone}): ${text}`,
  );

  let reply: string;

  try {
    // Route to handlers
    if (isCommand(text, "help") || isCommand(text, "menu")) {
      reply = await handleHelp();
    } else if (isCommand(text, "available") || isCommand(text, "mobil")) {
      reply = await handleAvailable();
    } else if (text.toLowerCase().startsWith("booking ")) {
      const result = await handleBooking(text, senderInfo.phone);

      // Check if result contains admin notifications
      try {
        const parsed = JSON.parse(result);
        if (parsed.type === "booking_success") {
          // Send reply to driver
          reply = parsed.reply;

          // Notify admins
          for (const admin of parsed.adminNotifications) {
            const adminJid = await resolveJid(waClient, admin.phone);
            if (adminJid) {
              await waClient.sendMessage(adminJid, admin.message);
            } else {
              console.error(`Gagal resolve JID untuk admin: ${admin.phone}`);
            }
          }
        } else {
          reply = result;
        }
      } catch {
        // Plain text response (error)
        reply = result;
      }
    } else {
      // Unknown command
      reply = `Perintah tidak dikenali. Ketik *help* untuk melihat menu.`;
    }

    // Send reply
    await message.reply(reply);
  } catch (error) {
    console.error("Error handling message:", error);
    await message.reply("Terjadi kesalahan. Silakan coba lagi.");
  }
});

// Initialize client
console.log("🔄 Memulai WhatsApp Bot...");
waClient.initialize();
