"use client";

import { useState } from "react";
import CameraCapture from "@/components/CameraCapture";

interface InspectionModalProps {
  tripId: string;
  type: "start" | "return";
  onClose: () => void;
  onSuccess: () => void;
}

const sides = [
  { key: "front", label: "Depan", icon: "🔼" },
  { key: "rear", label: "Belakang", icon: "🔽" },
  { key: "left", label: "Kiri", icon: "◀️" },
  { key: "right", label: "Kanan", icon: "▶️" },
];

export default function InspectionModal({
  tripId,
  type,
  onClose,
  onSuccess,
}: InspectionModalProps) {
  const [photos, setPhotos] = useState<Record<string, File | null>>({
    front: null,
    rear: null,
    left: null,
    right: null,
  });
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [mileage, setMileage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const isStart = type === "start";
  const title = isStart ? "Inspeksi Awal Trip" : "Inspeksi Akhir Trip";
  const description = isStart
    ? "Foto kendaraan dari 4 sisi sebelum berangkat"
    : "Foto kendaraan dari 4 sisi setelah kembali";
  const mileageLabel = isStart ? "Odometer Awal (km)" : "Odometer Akhir (km)";
  const submitLabel = isStart ? "Mulai Trip" : "Kembalikan Trip";

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
    // Validate all photos
    const missingPhotos = sides.filter(({ key }) => !photos[key]);
    if (missingPhotos.length > 0) {
      setError(
        `Foto ${missingPhotos.map((s) => s.label).join(", ")} harus diisi`
      );
      return;
    }

    if (!mileage) {
      setError("Odometer harus diisi");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("tripId", tripId);
      formData.append("type", type);
      formData.append("mileage", mileage);

      for (const [side, file] of Object.entries(photos)) {
        if (file) {
          formData.append(`photo_${side}`, file);
        }
      }

      const res = await fetch("/api/trips/inspection", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengupload");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {title}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Photo Grid */}
          <div className="grid grid-cols-2 gap-3">
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
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {mileageLabel}
            </label>
            <input
              type="number"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors font-mono"
              placeholder="Contoh: 15000"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200/80 dark:border-zinc-800/80 flex gap-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 py-2.5 px-4 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="flex-1 py-2.5 px-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium text-sm rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
          >
            {uploading ? "Mengupload..." : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
