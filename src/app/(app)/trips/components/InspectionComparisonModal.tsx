"use client";

import { useState } from "react";
import { completeTripAction } from "../actions";

interface TripPhotoSet {
  front?: string;
  rear?: string;
  left?: string;
  right?: string;
}

interface TripData {
  id: string;
  driverName: string | null;
  driverPhone: string | null;
  vehiclePlate: string | null;
  vehicleModel: string | null;
  purpose: string | null;
  startMileage: number | null;
  endMileage: number | null;
  imageUrl: TripPhotoSet | null;
  returnImageUrl: TripPhotoSet | null;
}

interface InspectionComparisonModalProps {
  trip: TripData;
  readOnly?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function InspectionComparisonModal({
  trip,
  readOnly = false,
  onClose,
  onSuccess,
}: InspectionComparisonModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "front" | "rear" | "left" | "right">("all");
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  const startMileage = trip.startMileage || 0;
  const endMileage = trip.endMileage || 0;
  const distanceTraveled = Math.max(0, endMileage - startMileage);

  const sides = [
    { key: "front" as const, label: "Tampak Depan", icon: "🚘" },
    { key: "rear" as const, label: "Tampak Belakang", icon: "🚗" },
    { key: "left" as const, label: "Sisi Kiri", icon: "🚙" },
    { key: "right" as const, label: "Sisi Kanan", icon: "🚙" },
  ];

  const handleComplete = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await completeTripAction(trip.id);
      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        onSuccess();
      }
    } catch {
      setError("Gagal menyelesaikan trip");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-4xl w-full border border-zinc-200/80 dark:border-zinc-800 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50/50 dark:bg-zinc-800/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-mono font-medium bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-md border border-purple-200 dark:border-purple-800">
                {trip.vehiclePlate || "N/A"}
              </span>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {readOnly ? "Riwayat Inspeksi Trip" : "Perbandingan Inspeksi Trip"}
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Driver: <span className="font-medium text-zinc-700 dark:text-zinc-300">{trip.driverName || "-"}</span> • Kendaraan: <span className="font-medium text-zinc-700 dark:text-zinc-300">{trip.vehicleModel || "-"}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
            <div className="text-center sm:text-left">
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Odometer Awal</p>
              <p className="text-base sm:text-lg font-mono font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                {startMileage.toLocaleString()} <span className="text-xs font-sans text-zinc-500">KM</span>
              </p>
            </div>
            <div className="text-center sm:text-left border-x border-zinc-200/80 dark:border-zinc-700/60 px-2 sm:px-4">
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Odometer Akhir</p>
              <p className="text-base sm:text-lg font-mono font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                {endMileage.toLocaleString()} <span className="text-xs font-sans text-zinc-500">KM</span>
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Jarak</p>
              <p className="text-base sm:text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                +{distanceTraveled.toLocaleString()} <span className="text-xs font-sans">KM</span>
              </p>
            </div>
          </div>

          {/* Navigation Filter Tabs */}
          <div className="flex items-center gap-1.5 border-b border-zinc-200/80 dark:border-zinc-800 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeTab === "all"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              Semua Sisi (4)
            </button>
            {sides.map((side) => (
              <button
                key={side.key}
                onClick={() => setActiveTab(side.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
                  activeTab === side.key
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                <span>{side.icon}</span>
                <span>{side.label}</span>
              </button>
            ))}
          </div>

          {/* Photo Comparison Section */}
          <div className="space-y-6">
            {sides
              .filter((s) => activeTab === "all" || activeTab === s.key)
              .map((side) => {
                const beforeUrl = trip.imageUrl?.[side.key];
                const afterUrl = trip.returnImageUrl?.[side.key];

                return (
                  <div
                    key={side.key}
                    className="p-4 bg-zinc-50/50 dark:bg-zinc-800/20 border border-zinc-200/80 dark:border-zinc-800 rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider">
                        <span>{side.icon}</span>
                        <span>{side.label}</span>
                      </h4>
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
                        {beforeUrl && afterUrl ? "✓ Lengkap" : "⚠️ Foto Parsial"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Before Photo */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Sebelum Berangkat
                          </span>
                        </div>
                        <div
                          onClick={() => beforeUrl && setLightboxImage({ url: beforeUrl, title: `${side.label} - Sebelum` })}
                          className={`aspect-4/3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 overflow-hidden bg-zinc-100 dark:bg-zinc-800 relative group transition-all ${
                            beforeUrl ? "cursor-pointer hover:opacity-95 shadow-xs" : "flex items-center justify-center"
                          }`}
                        >
                          {beforeUrl ? (
                            <>
                              <img
                                src={beforeUrl}
                                alt={`${side.label} - Sebelum`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-[11px] px-2.5 py-1 rounded-full backdrop-blur-xs font-medium">
                                  Perbesar 🔍
                                </span>
                              </div>
                            </>
                          ) : (
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">Tidak ada foto</p>
                          )}
                        </div>
                      </div>

                      {/* After Photo */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-purple-700 dark:text-purple-400 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                            Setelah Kembali
                          </span>
                        </div>
                        <div
                          onClick={() => afterUrl && setLightboxImage({ url: afterUrl, title: `${side.label} - Sesudah` })}
                          className={`aspect-4/3 rounded-xl border border-purple-200 dark:border-purple-900/50 overflow-hidden bg-zinc-100 dark:bg-zinc-800 relative group transition-all ${
                            afterUrl ? "cursor-pointer hover:opacity-95 shadow-xs" : "flex items-center justify-center"
                          }`}
                        >
                          {afterUrl ? (
                            <>
                              <img
                                src={afterUrl}
                                alt={`${side.label} - Sesudah`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-[11px] px-2.5 py-1 rounded-full backdrop-blur-xs font-medium">
                                  Perbesar 🔍
                                </span>
                              </div>
                            </>
                          ) : (
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">Tidak ada foto</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center sm:text-left">
            {readOnly
              ? "ℹ️ Menampilkan arsip foto & bukti inspeksi trip yang telah selesai."
              : "⚠️ Periksa kondisi bodi & odometer sebelum mengonfirmasi penyelesaian trip."}
          </p>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {readOnly ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 sm:flex-none px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Konfirmasi & Selesaikan Trip</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Lightbox for large preview */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.title}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            <p className="mt-3 text-xs text-zinc-300 font-medium font-mono bg-black/50 px-3 py-1 rounded-full backdrop-blur-xs">
              {lightboxImage.title}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
