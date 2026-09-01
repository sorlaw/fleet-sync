"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PhotoUpload from "@/components/PhotoUpload";

const MAX_PHOTOS = 4;

interface VehicleFormProps {
  onSuccess?: () => void;
}

export default function VehicleForm({ onSuccess }: VehicleFormProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleUpload = (file: File) => {
    if (photos.length >= MAX_PHOTOS) {
      setError(`Maksimal ${MAX_PHOTOS} foto`);
      return;
    }

    setPhotos((prev) => [...prev, file]);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviews((prev) => [...prev, e.target?.result as string]);
    };
    reader.readAsDataURL(file);
    setError("");
  };

  const handleRemove = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      // Upload photos first
      const imageUrls: string[] = [];
      for (const photo of photos) {
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
        imageUrls.push(data.url);
      }

      // Add image URLs to form data
      for (const url of imageUrls) {
        formData.append("imageUrls", url);
      }

      // Submit to server action
      const res = await fetch("/api/vehicles/create", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menambah kendaraan");
      }

      setSuccess(true);
      setPhotos([]);
      setPreviews([]);
      form.reset();
      router.refresh();

      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Plat Nomor
        </label>
        <input
          name="licensePlate"
          type="text"
          required
          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors uppercase font-mono"
          placeholder="B 1234 ABC"
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
          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
          placeholder="Toyota Avanza 2024"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Status Ketersediaan
        </label>
        <select
          name="status"
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
          defaultValue={0}
          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors font-mono"
        />
      </div>

      {/* Photo Section */}
      <div className="space-y-1.5 pt-1">
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Foto Kendaraan (maks {MAX_PHOTOS})
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          {previews.map((preview, index) => (
            <PhotoUpload
              key={index}
              label={`Foto ${index + 1}`}
              preview={preview}
              onUpload={() => {}}
              onRemove={() => handleRemove(index)}
            />
          ))}
          {photos.length < MAX_PHOTOS && (
            <PhotoUpload
              label={photos.length === 0 ? "Tambah Foto" : "Tambah Lagi"}
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
            Kendaraan berhasil ditambahkan!
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={uploading}
        className="w-full mt-2 py-2.5 px-4 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-sm font-medium rounded-lg transition-all focus:outline-none active:scale-[0.98] disabled:opacity-50 shadow-xs"
      >
        {uploading ? "Menyimpan..." : "Tambah Kendaraan"}
      </button>
    </form>
  );
}
