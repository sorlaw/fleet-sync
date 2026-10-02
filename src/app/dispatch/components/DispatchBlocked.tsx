import type { DispatchReason } from "@/lib/dispatch";

const CONTENT: Record<
  DispatchReason,
  { badge: string; title: string; description: string; tone: "emerald" | "amber" | "rose" | "zinc" }
> = {
  already_done: {
    badge: "Sudah Dilakukan",
    title: "Inspeksi Sudah Dilakukan",
    description:
      "Inspeksi pada link ini sudah pernah diisi dan datanya tersimpan. Link tidak dapat dipakai lagi untuk mengubah foto.",
    tone: "emerald",
  },
  not_started: {
    badge: "Belum Layak",
    title: "Belum Bisa Diisi",
    description:
      "Link ini belum bisa dipakai karena prasyaratnya belum terpenuhi. Ikuti alur trip sesuai statusnya, atau minta link baru ke admin.",
    tone: "amber",
  },
  expired: {
    badge: "Kedaluwarsa",
    title: "Link Kedaluwarsa",
    description:
      "Link inspeksi hanya berlaku 24 jam sejak dikirim. Minta link baru ke admin untuk melanjutkan.",
    tone: "rose",
  },
  invalid: {
    badge: "Tidak Valid",
    title: "Link Tidak Valid",
    description:
      "Link ini tidak valid atau rusak. Pastikan Anda membuka link persis seperti yang dikirim, atau minta link baru ke admin.",
    tone: "rose",
  },
  not_found: {
    badge: "Tidak Ditemukan",
    title: "Trip Tidak Ditemukan",
    description:
      "Trip terkait link ini sudah tidak ada. Hubungi admin untuk informasi lebih lanjut.",
    tone: "zinc",
  },
  rejected: {
    badge: "Ditolak",
    title: "Trip Ditolak",
    description:
      "Trip ini ditolak oleh admin, jadi inspeksi tidak dapat dilakukan. Hubungi admin jika Anda rasa ini keliru.",
    tone: "rose",
  },
};

const TONES = {
  emerald: {
    iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    iconBgPing: "bg-emerald-500/20",
    badge:
      "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
    icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  amber: {
    iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    iconBgPing: "bg-amber-500/20",
    badge:
      "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
    icon: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z",
  },
  rose: {
    iconBg: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    iconBgPing: "bg-rose-500/20",
    badge:
      "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    dot: "bg-rose-500",
    icon: "M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  zinc: {
    iconBg: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400",
    iconBgPing: "bg-zinc-500/20",
    badge:
      "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
    dot: "bg-zinc-500",
    icon: "M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 9.75h6M12 17.25h.008v.008H12v-.008z",
  },
} as const;

const START_PREREQ: Partial<Record<DispatchReason, string>> = {
  not_started:
    "Inspeksi awal hanya bisa diisi setelah admin menyetujui trip Anda.",
};

const RETURN_PREREQ: Partial<Record<DispatchReason, string>> = {
  not_started:
    "Inspeksi akhir hanya bisa diisi setelah Anda menyelesaikan inspeksi awal dan memulai trip.",
};

export default function DispatchBlocked({
  reason,
  type,
}: {
  reason: DispatchReason;
  type: "start" | "return";
}) {
  const content = CONTENT[reason];
  const tone = TONES[content.tone];
  const prereq =
    type === "start" ? START_PREREQ[reason] : RETURN_PREREQ[reason];
  const description = prereq ?? content.description;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6">
        {/* Header Branding */}
        <div className="flex items-center justify-center gap-2 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs tracking-tighter">
            FS
          </div>
          <div className="text-left">
            <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              FleetSync Dispatch
            </h2>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Verifikasi Kendaraan Digital
            </p>
          </div>
        </div>

        {/* Icon */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div
            className={`absolute inset-0 rounded-full opacity-75 animate-ping ${tone.iconBgPing}`}
          />
          <div
            className={`relative w-20 h-20 rounded-full flex items-center justify-center ${tone.iconBg}`}
          >
            <svg
              className="w-10 h-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={tone.icon} />
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${tone.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${tone.dot} animate-pulse`} />
            {content.badge}
          </span>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {content.title}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {description}
          </p>
        </div>

        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Halaman ini dapat Anda tutup sekarang.
        </p>
      </div>
    </div>
  );
}
