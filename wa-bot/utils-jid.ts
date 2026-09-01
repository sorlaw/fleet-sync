import { Client } from 'whatsapp-web.js';

/**
 * Menerjemahkan nomor telepon mentah menjadi JID WhatsApp resmi yang valid.
 * Menggunakan getNumberId untuk mengatasi pemetaan LID dan memverifikasi pendaftaran.
 */
export const resolveJid = async (client: Client, rawNumber: string): Promise<string | null> => {
  try {
    // 1. Bersihkan karakter non-digit
    let cleaned = rawNumber.trim().replace(/\D/g, '');
    
    // 2. Ubah awalan 08 menjadi 628
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    }

    if (!cleaned) return null;

    // 3. Cari ID resmi menggunakan whatsapp-web.js (ini membantu mendapatkan JID/LID yang tepat)
    const numberId = await client.getNumberId(cleaned);
    if (numberId && numberId._serialized) {
      console.log(`[JID Resolver] Berhasil resolusi ${rawNumber} -> ${numberId._serialized}`);
      return numberId._serialized;
    }

    // 4. Fallback jika getNumberId tidak mengembalikan hasil tapi formatnya valid
    const fallbackJid = cleaned.includes('@') ? cleaned : `${cleaned}@c.us`;
    console.log(`[JID Resolver] getNumberId nihil, menggunakan fallback: ${fallbackJid}`);
    return fallbackJid;
  } catch (error) {
    console.error(`[JID Resolver] Gagal resolusi nomor ${rawNumber}:`, error);
    // Fallback terakhir
    let cleaned = rawNumber.trim().replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    }
    return cleaned ? (cleaned.includes('@') ? cleaned : `${cleaned}@c.us`) : null;
  }
};
