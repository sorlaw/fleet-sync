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
    { key: "front", label: "Depan", icon: "🔼" },
    { key: "rear", label: "Belakang", icon: "🔽" },
    { key: "left", label: "Kiri", icon: "◀️" },
    { key: "right", label: "Kanan", icon: "▶️" },
  ];

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
    if (!photos.front || !photos.rear || !photos.left || !photos.right) {
      setError("Semua foto harus diisi");
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
        throw new Error(data.error || "Gagal mengupload");
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-600 mb-2">
            Berhasil!
          </h1>
          <p className="text-gray-600">
            Foto inspeksi akhir berhasil diupload. Trip sudah dikembalikan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h1 className="text-xl font-bold mb-2">Inspeksi Akhir Trip</h1>
          <p className="text-sm text-gray-600 mb-6">
            Foto kendaraan dari 4 sisi setelah kembali
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
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

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Odometer Akhir (km)
            </label>
            <input
              type="number"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Contoh: 15250"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 font-medium"
          >
            {uploading ? "Mengupload..." : "Kembalikan Trip"}
          </button>
        </div>
      </div>
    </div>
  );
}
