export const templates = {
  welcome: (name: string) =>
    `Halo ${name}! 👋\nSelamat datang di FleetSync Bot.\n\nKetik *help* untuk melihat menu.`,

  help: () =>
    `*FleetSync Bot - Menu* 🚗\n\n` +
    `*booking [plat] [tujuan]*\n` +
    `Contoh: booking B 1234 ABC ke Jakarta\n\n` +
    `*available* atau *mobil*\n` +
    `Lihat kendaraan yang tersedia\n\n` +
    `*help* atau *menu*\n` +
    `Tampilkan bantuan ini`,

  bookingSuccess: (vehicle: string, purpose: string) =>
    `*Booking Berhasil* ✅\n\n` +
    `Kendaraan: ${vehicle}\n` +
    `Tujuan: ${purpose}\n` +
    `Status: Menunggu persetujuan admin\n\n` +
    `Admin akan menghubungi Anda segera.`,

  bookingFailed: (reason: string) =>
    `*Booking Gagal* ❌\n\n${reason}`,

  availableVehicles: (vehicles: { licensePlate: string; makeModel: string }[]) => {
    if (vehicles.length === 0) {
      return `*Kendaraan Tersedia* 🚗\n\nTidak ada kendaraan tersedia saat ini.`;
    }

    let msg = `*Kendaraan Tersedia* 🚗\n\n`;
    vehicles.forEach((v, i) => {
      msg += `${i + 1}. ${v.licensePlate} - ${v.makeModel}\n`;
    });
    msg += `\nTotal: ${vehicles.length} kendaraan`;
    return msg;
  },

  newBookingAdmin: (
    driverName: string,
    vehicle: string,
    purpose: string
  ) =>
    `*Booking Baru* 🔔\n\n` +
    `Driver: ${driverName}\n` +
    `Kendaraan: ${vehicle}\n` +
    `Tujuan: ${purpose}\n\n` +
    `Buka dashboard untuk menyetujui.`,

  tripApproved: (vehicle: string, purpose: string) =>
    `*Trip Disetujui* ✅\n\n` +
    `Kendaraan: ${vehicle}\n` +
    `Tujuan: ${purpose}\n\n` +
    `Silakan ambil kendaraan.`,

  tripRejected: (vehicle: string) =>
    `*Trip Ditolak* ❌\n\n` +
    `Kendaraan: ${vehicle}\n\n` +
    `Hubungi admin untuk info lebih lanjut.`,

  error: () =>
    `Terjadi kesalahan. Silakan coba lagi atau ketik *help* untuk bantuan.`,
};
