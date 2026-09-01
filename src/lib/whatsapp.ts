const BOT_URL = process.env.BOT_URL || "http://localhost:3001";
const BOT_SECRET = process.env.BOT_SECRET!;

export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<boolean> {
  try {
    const res = await fetch(`${BOT_URL}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bot-secret": BOT_SECRET,
      },
      body: JSON.stringify({ to, message }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function notifyAdmins(
  adminPhones: string[],
  message: string
): Promise<void> {
  for (const phone of adminPhones) {
    await sendWhatsAppMessage(phone, message);
  }
}
