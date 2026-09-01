"use client";

import { useState } from "react";
import { deleteVehicleAction } from "../actions";
import EditVehicleModal from "./EditVehicleModal";

interface Vehicle {
  id: string;
  licensePlate: string;
  makeModel: string;
  status: string | null;
  currentOdometer: number | null;
  imageUrl: string[] | null;
}

export default function VehicleList({ vehicles }: { vehicles: Vehicle[] }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [lightboxImages, setLightboxImages] = useState<string[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus kendaraan ini?")) return;
    setDeletingId(id);
    await deleteVehicleAction(id);
    setDeletingId(null);
  };

  const handleEditSuccess = () => {
    setEditVehicle(null);
    window.location.reload();
  };

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
  };

  const statusLabels: Record<string, { label: string; className: string }> = {
    available: {
      label: "Tersedia",
      className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/50",
    },
    in_use: {
      label: "Sedang Dipakai",
      className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/50",
    },
    maintenance: {
      label: "Maintenance",
      className: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/50",
    },
  };

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/70 dark:bg-zinc-800/40 border-b border-zinc-200/80 dark:border-zinc-800/80">
                <th className="px-6 py-3.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Kendaraan
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Plat
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Odometer
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 text-sm">
              {vehicles.map((vehicle) => {
                const status = statusLabels[vehicle.status || "available"] || statusLabels.available;
                return (
                  <tr 
                    key={vehicle.id}
                    className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {vehicle.imageUrl &&
                        Array.isArray(vehicle.imageUrl) &&
                        vehicle.imageUrl.length > 0 ? (
                          <div className="flex -space-x-2 shrink-0">
                            {vehicle.imageUrl.slice(0, 3).map((url, i) => (
                              <img
                                key={i}
                                src={url}
                                alt={`${vehicle.makeModel} ${i + 1}`}
                                className="w-10 h-10 rounded-lg object-cover border-2 border-white dark:border-zinc-900 cursor-pointer hover:opacity-80 transition-opacity shadow-xs"
                                onClick={() =>
                                  openLightbox(vehicle.imageUrl!, i)
                                }
                              />
                            ))}
                            {vehicle.imageUrl.length > 3 && (
                              <div
                                className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-medium border-2 border-white dark:border-zinc-900 cursor-pointer text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                onClick={() =>
                                  openLightbox(vehicle.imageUrl!, 3)
                                }
                              >
                                +{vehicle.imageUrl.length - 3}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center shrink-0 border border-zinc-200/60 dark:border-zinc-700/60">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h.008v.008H16.5v-.008z" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">{vehicle.makeModel}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                        {vehicle.licensePlate}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${status.className}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                      {(vehicle.currentOdometer || 0).toLocaleString()} km
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditVehicle(vehicle)}
                          className="px-2.5 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle.id)}
                          disabled={deletingId === vehicle.id}
                          className="px-2.5 py-1 text-xs font-medium bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40 rounded-md hover:bg-rose-100 dark:hover:bg-rose-900/50 disabled:opacity-50 transition-colors"
                        >
                          {deletingId === vehicle.id ? "Menghapus..." : "Hapus"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {vehicles.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h.008v.008H16.5v-.008z" />
                      </svg>
                      <p className="text-sm font-medium">Belum ada armada kendaraan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Vehicle Modal */}
      {editVehicle && (
        <EditVehicleModal
          vehicle={editVehicle}
          onClose={() => setEditVehicle(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Lightbox */}
      {lightboxImages && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImages(null)}
        >
          <button
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={() => setLightboxImages(null)}
          >
            ✕
          </button>

          {/* Previous button */}
          {lightboxImages.length > 1 && (
            <button
              className="absolute left-4 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center text-xl transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) =>
                  prev === 0 ? lightboxImages.length - 1 : prev - 1
                );
              }}
            >
              ‹
            </button>
          )}

          {/* Image */}
          <img
            src={lightboxImages[lightboxIndex]}
            alt={`Foto ${lightboxIndex + 1}`}
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next button */}
          {lightboxImages.length > 1 && (
            <button
              className="absolute right-4 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center text-xl transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) =>
                  prev === lightboxImages.length - 1 ? 0 : prev + 1
                );
              }}
            >
              ›
            </button>
          )}

          {/* Counter */}
          {lightboxImages.length > 1 && (
            <div className="absolute bottom-4 px-3 py-1 bg-white/10 rounded-full text-white text-xs backdrop-blur-xs font-mono">
              {lightboxIndex + 1} / {lightboxImages.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
