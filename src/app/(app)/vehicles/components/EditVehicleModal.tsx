"use client";

import { useState } from "react";
import PhotoUpload from "@/components/PhotoUpload";

const MAX_PHOTOS = 4;

interface Vehicle {
  id: string;
  licensePlate: string;
  makeModel: string;
  status: string | null;
  currentOdometer: number | null;
  imageUrl: string[] | null;
}

interface EditVehicleModalProps {
  vehicle: Vehicle;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditVehicleModal({
  vehicle,
  onClose,
  onSuccess,
}: EditVehicleModalProps) {
  const [existingPhotos, setExistingPhotos] = useState<string[]>(
    vehicle.imageUrl || []
  );
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const totalPhotos = existingPhotos.length + newPhotos.length;

  const handleUpload = (file: File) => {
    if (totalPhotos >= MAX_PHOTOS) {
      setError(`Maksimal ${MAX_PHOTOS} foto`);
      return;
    }

    setNewPhotos((prev) => [...prev, file]);

    const reader = new FileReader();
    reader.onload = (e) => {
      setNewPreviews((prev) => [...prev, e.target?.result as string]);
    };
    reader.readAsDataURL(file);
    setError("");
  };

  const handleRemoveExisting = (index: number) => {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNew = (index: number) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      // Upload new photos
      const newImageUrls: string[] = [];
      for (const photo of newPhotos) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", photo);
        uploadFormData.append("category", "vehicles");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!res.ok) {
          throw new Error("Gagal upload foto");
        }

        const data = await res.json();
        newImageUrls.push(data.url);
      }

      // Combine existing and new photo URLs
      const allImageUrls = [...existingPhotos, ...newImageUrls];

      // Add to form data
      formData.append("id", vehicle.id);
      for (const url of allImageUrls) {
        formData.append("imageUrls", url);
      }

      // Submit to API
      const res = await fetch("/api/vehicles/update", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengupdate kendaraan");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Edit Kendaraan
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
              {vehicle.licensePlate} &bull; {vehicle.makeModel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Plat Nomor
            </label>
            <input
              name="licensePlate"
              type="text"
              required
              defaultValue={vehicle.licensePlate}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors uppercase font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Model Kendaraan
            </label>
            <input
              name="makeModel"
              type="text"
              required
              defaultValue={vehicle.makeModel}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Status Ketersediaan
            </label>
            <select
              name="status"
              defaultValue={vehicle.status || "available"}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
            >
              <option value="available">Tersedia</option>
              <option value="in_use">Sedang Dipakai</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Odometer Terakhir (km)
            </label>
            <input
              name="currentOdometer"
              type="number"
              defaultValue={vehicle.currentOdometer || 0}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors font-mono"
            />
          </div>

          {/* Photo Section */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Foto Kendaraan (maks {MAX_PHOTOS}, tersimpan: {totalPhotos})
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Existing photos */}
              {existingPhotos.map((url, index) => (
                <div key={`existing-${index}`} className="relative">
                  <div className="aspect-square border-2 border-emerald-500/80 bg-emerald-50/20 dark:bg-emerald-950/20 rounded-lg overflow-hidden">
                    <img
                      src={url}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExisting(index)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center text-xs shadow-xs transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              {/* New photos */}
              {newPreviews.map((preview, index) => (
                <PhotoUpload
                  key={`new-${index}`}
                  label={`Foto Baru ${index + 1}`}
                  preview={preview}
                  onUpload={() => {}}
                  onRemove={() => handleRemoveNew(index)}
                />
              ))}

              {/* Add photo button */}
              {totalPhotos < MAX_PHOTOS && (
                <PhotoUpload
                  label={totalPhotos === 0 ? "Tambah Foto" : "Tambah Lagi"}
                  icon="➕"
                  onUpload={handleUpload}
                />
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/50 rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Berhasil diperbarui!
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-2.5 px-4 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || success}
              className="flex-1 py-2.5 px-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium text-sm rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-all shadow-xs"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
