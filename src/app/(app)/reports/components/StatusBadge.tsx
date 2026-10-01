const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Menunggu",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/50",
  },
  approved: {
    label: "Disetujui",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/50",
  },
  in_progress: {
    label: "Berlangsung",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/50",
  },
  returned: {
    label: "Dikembalikan",
    className: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/50",
  },
  completed: {
    label: "Selesai",
    className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
  },
  rejected: {
    label: "Ditolak",
    className: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/50",
  },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${config.className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {config.label}
    </span>
  );
}
