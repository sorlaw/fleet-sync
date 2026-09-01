import { Router, Request, Response } from "express";
import { Client } from "whatsapp-web.js";
import { resolveJid } from "./utils-jid";

export function createRouter(waClient: Client): Router {
  const router = Router();

  // Health check
  router.get("/health", (req: Request, res: Response) => {
    res.json({
      status: "ok",
      whatsapp: waClient.info ? "connected" : "disconnected",
    });
  });

  // Send message endpoint
  router.post("/send", async (req: Request, res: Response) => {
    const botSecret = req.headers["x-bot-secret"];
    const expectedSecret = process.env.BOT_SECRET;

    if (botSecret !== expectedSecret) {
      return res.status(401).json({ error: "Invalid secret" });
    }

    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: "to and message required" });
    }

    // Respond immediately to avoid timeout
    res.json({ success: true, queued: true });

    // Send in background with error handling
    (async () => {
      try {
        let formattedTo = await resolveJid(waClient, to);

        // Fallback ke @c.us jika @lid atau gagal
        if (!formattedTo || formattedTo.includes("@lid")) {
          formattedTo = `${to}@c.us`;
          console.log(`[API] Using fallback JID: ${formattedTo}`);
        }

        await waClient.sendMessage(formattedTo, message);
        console.log(`[API] ✅ Sent message to ${formattedTo}`);
      } catch (error) {
        console.error(`[API] ❌ Failed to send to ${to}:`, error);
      }
    })();
  });

  return router;
}
