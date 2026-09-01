"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import CameraCapture from "@/components/CameraCapture";

export default function DispatchReturnPage() {
  const params = useParams();
  const token = params.token as string;
  const [photos, setPhotos] = useState<Record<string, File | null>>({
    front: null,
    rear: null,
    left: null,
    right: null,
  });
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [mileage, setMileage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const sides = [
    { key: "front", label: "Tampak Depan", icon: "⬆️" },
    { key: "rear", label: "Tampak Belakang", icon: "⬇️" },
    { key: "left", label: "Samping Kiri", icon: "⬅️" },
    { key: "right", label: "Samping Kanan", icon: "➡️" },
  ];

  const completedPhotosCount = Object.values(photos).filter(Boolean).length;
  const progressPercent = (completedPhotosCount / 4) * 100;

  const handleCapture = (side: string, file: File) => {
    setPhotos((prev) => ({ ...prev, [side]: file }));

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviews((prev) => ({
        ...prev,
        [side]: e.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = (side: string) => {
    setPhotos((prev) => ({ ...prev, [side]: null }));
    setPreviews((prev) => {
      const newPreviews = { ...prev };
      delete newPreviews[side];
      return newPreviews;
    });
  };

  const handleSubmit = async () => {
    const missingPhotos = sides.filter(({ key }) => !photos[key]);
    if (missingPhotos.length > 0) {
      setError(
        `Foto ${missingPhotos.map((s) => s.label).join(", ")} belum diambil`
      );
      return;
    }

    if (!mileage) {
      setError("Angka odometer akhir harus diisi");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("mileage", mileage);
      formData.append("type", "return");

      for (const [side, file] of Object.entries(photos)) {
        if (file) {
          formData.append(`photo_${side}`, file);
        }
      }

      const res = await fetch("/api/dispatch/return", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengupload data inspeksi");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 dark:bg-indigo-500/10 animate-ping opacity-75" />
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Trip Selesai
            </span>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Inspeksi Akhir Berhasil!
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Foto kondisi akhir kendaraan dan odometer pengembalian telah berhasil terverifikasi.
            </p>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 text-left space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-300">
              <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>4/4 Foto Akhir Sisi Terupload</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-300">
              <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Odometer Akhir: <strong className="font-mono text-zinc-900 dark:text-zinc-100">{mileage} km</strong></span>
            </div>
          </div>

          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Terima kasih! Kendaraan telah dikembalikan secara resmi ke dalam sistem.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-6 flex flex-col justify-between">
      <div className="max-w-md mx-auto w-full space-y-5">
        {/* Header Branding */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs tracking-tighter shadow-xs">
              FS
            </div>
            <div>
              <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                FleetSync Dispatch
              </h2>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Verifikasi Pengembalian Armada</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Pengembalian
          </span>
        </div>

        {/* Main Form Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-lg p-5 sm:p-6 space-y-6">
          {/* Card Title & Instructions */}
          <div>
            <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Inspeksi Akhir Trip
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Ambil foto kondisi kendaraan dari 4 sisi dan catat odometer akhir saat mengembalikan armada.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-3.5 border border-zinc-200/60 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Kelengkapan Foto Sisi
              </span>
              <span className={`font-semibold font-mono ${completedPhotosCount === 4 ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-500"}`}>
                {completedPhotosCount} / 4 Foto
              </span>
            </div>
            <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Camera Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            {sides.map(({ key, label, icon }) => (
              <CameraCapture
                key={key}
                label={label}
                icon={icon}
                onCapture={(file) => handleCapture(key, file)}
                preview={previews[key] || null}
                onRemove={() => handleRemove(key)}
              />
            ))}
          </div>

          {/* Mileage Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Odometer Akhir (km) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <input
                type="number"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                className="w-full pl-9 pr-12 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-900 dark:focus:border-zinc-100 transition-all font-mono"
                placeholder="Contoh: 15250"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-semibold text-zinc-400 font-mono">
                KM
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              Pastikan sesuai dengan angka speedometer terkini.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-2.5 animate-in fade-in duration-200">
              <svg className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium leading-tight">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="w-full py-3 px-4 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold text-sm rounded-xl shadow-md disabled:opacity-50 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            {uploading ? (
              <>
                <svg className="w-4 h-4 animate-spin text-current" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Mengupload Data Inspeksi...</span>
              </>
            ) : (
              <>
                <span>Kembalikan Trip</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500">
          Powered by FleetSync Management &copy; 2026
        </p>
      </div>
    </div>
  );
}

