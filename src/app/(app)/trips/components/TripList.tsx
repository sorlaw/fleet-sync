"use client";

import { useState } from "react";
import {
  approveTripAction,
  rejectTripAction,
  completeTripAction,
  generateDispatchLinkAction,
  deleteTripAction,
} from "../actions";
import InspectionModal from "./InspectionModal";
import InspectionComparisonModal from "./InspectionComparisonModal";

interface TripPhotoSet {
  front?: string;
  rear?: string;
  left?: string;
  right?: string;
}

interface Trip {
  id: string;
  purpose: string | null;
  status: string | null;
  startMileage: number | null;
  endMileage: number | null;
  imageUrl?: TripPhotoSet | null;
  returnImageUrl?: TripPhotoSet | null;
  createdAt: Date | null;
  driverId: string | null;
  vehicleId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  vehiclePlate: string | null;
  vehicleModel: string | null;
}

interface TripListProps {
  trips: Trip[];
  isAdmin: boolean;
}

export default function TripList({ trips, isAdmin }: TripListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [dispatchLinks, setDispatchLinks] = useState<
    Record<string, { startUrl: string; returnUrl: string }>
  >({});
  const [inspectionModal, setInspectionModal] = useState<{
    tripId: string;
    type: "start" | "return";
  } | null>(null);
  const [comparisonTrip, setComparisonTrip] = useState<Trip | null>(null);

  const handleAction = async (action: string, tripId: string) => {
    setLoadingId(tripId);
    switch (action) {
      case "approve":
        await approveTripAction(tripId);
        break;
      case "reject":
        await rejectTripAction(tripId);
        break;
      case "complete":
        await completeTripAction(tripId);
        break;
    }
    setLoadingId(null);
  };

  const handleDelete = async (tripId: string) => {
    if (!confirm("Yakin ingin menghapus data trip ini?")) return;
    setLoadingId(tripId);
    await deleteTripAction(tripId);
    setLoadingId(null);
  };

  const handleGenerateLink = async (tripId: string) => {
    const result = await generateDispatchLinkAction(tripId);
    if (result.startUrl && result.returnUrl) {
      setDispatchLinks((prev) => ({
        ...prev,
        [tripId]: result as { startUrl: string; returnUrl: string },
      }));
    }
  };

  const handleInspectionSuccess = () => {
    setInspectionModal(null);
    window.location.reload();
  };

  const statusConfig: Record<
    string,
    { label: string; className: string }
  > = {
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

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/70 dark:bg-zinc-800/40 border-b border-zinc-200/80 dark:border-zinc-800/80">
                <th className="px-6 py-3.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Kendaraan
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Tujuan / Keperluan
                </th>
                <th className="px-6 py-3.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 text-sm">
              {trips.map((trip) => {
                const status = statusConfig[trip.status || "pending"] || statusConfig.pending;
                const isLoading = loadingId === trip.id;
                const links = dispatchLinks[trip.id];

                return (
                  <tr 
                    key={trip.id}
                    className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {trip.driverName || "-"}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                          {trip.driverPhone || "-"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        {trip.vehiclePlate ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 mb-0.5">
                            {trip.vehiclePlate}
                          </span>
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {trip.vehicleModel || ""}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                      {trip.purpose || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${status.className}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end flex-wrap gap-2">
                        {/* Admin: Approve/Reject pending trips */}
                        {isAdmin && trip.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleAction("approve", trip.id)}
                              disabled={isLoading}
                              className="px-2.5 py-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/50 disabled:opacity-50 transition-colors"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => handleAction("reject", trip.id)}
                              disabled={isLoading}
                              className="px-2.5 py-1 text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/50 rounded-md hover:bg-rose-100 dark:hover:bg-rose-900/50 disabled:opacity-50 transition-colors"
                            >
                              Tolak
                            </button>
                          </>
                        )}

                        {/* Driver/Admin: Start trip with inspection */}
                        {trip.status === "approved" && (
                          <>
                            <button
                              onClick={() =>
                                setInspectionModal({
                                  tripId: trip.id,
                                  type: "start",
                                })
                              }
                              disabled={isLoading}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/50 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                              </svg>
                              <span>Mulai Trip</span>
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleGenerateLink(trip.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/50 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                                </svg>
                                <span>Link</span>
                              </button>
                            )}
                          </>
                        )}

                        {/* Driver/Admin: Return trip with inspection */}
                        {trip.status === "in_progress" && (
                          <button
                            onClick={() =>
                              setInspectionModal({
                                tripId: trip.id,
                                type: "return",
                              })
                            }
                            disabled={isLoading}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/50 disabled:opacity-50 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                            </svg>
                            <span>Kembalikan Trip</span>
                          </button>
                        )}

                        {/* Admin: Complete returned trips with photo comparison */}
                        {isAdmin && trip.status === "returned" && (
                          <button
                            onClick={() => setComparisonTrip(trip)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-emerald-600 dark:bg-emerald-500 text-white rounded-md hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Periksa & Selesaikan</span>
                          </button>
                        )}

                        {/* View Inspection History for completed trips */}
                        {(trip.status === "completed" || (trip.imageUrl && Object.keys(trip.imageUrl).length > 0 && trip.status !== "returned")) && (
                          <button
                            onClick={() => setComparisonTrip(trip)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.573 16.49 16.638 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Lihat Inspeksi</span>
                          </button>
                        )}

                        {/* Admin: Delete trip action */}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(trip.id)}
                            disabled={isLoading}
                            className="px-2.5 py-1 text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/50 rounded-md hover:bg-rose-100 dark:hover:bg-rose-900/50 disabled:opacity-50 transition-colors cursor-pointer"
                          >
                            Hapus
                          </button>
                        )}
                      </div>

                      {/* Dispatch Links */}
                      {links && (
                        <div className="mt-3 p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 rounded-lg text-xs text-left space-y-1">
                          <p className="font-semibold text-zinc-800 dark:text-zinc-200">Dispatch Links:</p>
                          <p className="truncate text-zinc-600 dark:text-zinc-400">
                            <span className="font-mono text-zinc-400">Start:</span>{" "}
                            <a
                              href={links.startUrl}
                              className="text-blue-600 dark:text-blue-400 hover:underline font-mono"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {links.startUrl}
                            </a>
                          </p>
                          <p className="truncate text-zinc-600 dark:text-zinc-400">
                            <span className="font-mono text-zinc-400">Return:</span>{" "}
                            <a
                              href={links.returnUrl}
                              className="text-blue-600 dark:text-blue-400 hover:underline font-mono"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {links.returnUrl}
                            </a>
                          </p>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {trips.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm font-medium">Belum ada data trip</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspection Modal */}
      {inspectionModal && (
        <InspectionModal
          tripId={inspectionModal.tripId}
          type={inspectionModal.type}
          onClose={() => setInspectionModal(null)}
          onSuccess={handleInspectionSuccess}
        />
      )}

      {/* Inspection Comparison / History Modal */}
      {comparisonTrip && (
        <InspectionComparisonModal
          trip={comparisonTrip}
          readOnly={comparisonTrip.status === "completed"}
          onClose={() => setComparisonTrip(null)}
          onSuccess={() => {
            setComparisonTrip(null);
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
