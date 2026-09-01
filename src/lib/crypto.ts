import { createHmac, randomBytes } from "crypto";

const TOKEN_SECRET = process.env.TOKEN_SECRET!;

export function generateDispatchToken(
  tripId: string,
  type: "start" | "return"
): string {
  const nonce = randomBytes(16).toString("hex");
  const payload = `${tripId}:${type}:${nonce}:${Date.now()}`;
  const hmac = createHmac("sha256", TOKEN_SECRET)
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}:${hmac}`).toString("base64url");
}

export function verifyDispatchToken(token: string): {
  tripId: string;
  type: "start" | "return";
  valid: boolean;
} {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(":");
    if (parts.length !== 5)
      return { tripId: "", type: "start", valid: false };

    const [tripId, type, nonce, timestamp, hmac] = parts;
    const payload = `${tripId}:${type}:${nonce}:${timestamp}`;
    const expectedHmac = createHmac("sha256", TOKEN_SECRET)
      .update(payload)
      .digest("hex");

    if (hmac !== expectedHmac)
      return { tripId: "", type: "start", valid: false };

    // Check expiry (24 hours)
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 24 * 60 * 60 * 1000)
      return { tripId: "", type: "start", valid: false };

    return {
      tripId,
      type: type as "start" | "return",
      valid: true,
    };
  } catch {
    return { tripId: "", type: "start", valid: false };
  }
}
