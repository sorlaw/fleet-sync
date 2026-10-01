"use client";

export default function ExportCsvButton({
  data,
  filename,
}: {
  data: Record<string, string | number>[];
  filename: string;
}) {
  const handleExport = () => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const escape = (value: string | number) => {
      const str = String(value ?? "");
      return /[",\n;]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };

    const csv = [
      headers.map((h) => escape(h)).join(";"),
      ...data.map((row) => headers.map((h) => escape(row[h])).join(";")),
    ].join("\n");

    // BOM agar Excel membaca UTF-8 ( karakter ⛽, dll)
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      disabled={data.length === 0}
      className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-xs cursor-pointer"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
      Export CSV
    </button>
  );
}
