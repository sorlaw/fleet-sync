"use client";

import { useState, useRef } from "react";
import { compressImage } from "@/lib/image-compressor";

interface PhotoUploadProps {
  label: string;
  icon?: string;
  onUpload: (file: File) => void;
  preview?: string | null;
  onRemove?: () => void;
}

export default function PhotoUpload({
  label,
  icon,
  onUpload,
  preview,
  onRemove,
}: PhotoUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (rawFile) {
      const compressed = await compressImage(rawFile);
      onUpload(compressed);
    }
    e.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const rawFile = e.dataTransfer.files?.[0];
    if (rawFile && rawFile.type.startsWith("image/")) {
      const compressed = await compressImage(rawFile);
      onUpload(compressed);
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
          {icon && <span className="mr-1">{icon}</span>}
          {label}
        </label>
      )}

      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer overflow-hidden transition-all ${
          preview
            ? "border-emerald-500/80 bg-emerald-50/20 dark:bg-emerald-950/20"
            : dragOver
            ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800"
            : "border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/40 hover:border-zinc-400 dark:hover:border-zinc-500"
        }`}
      >
        {preview ? (
          <div className="relative w-full h-full">
            <img
              src={preview}
              alt={label}
              className="w-full h-full object-cover"
            />
            {onRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center text-xs shadow-xs transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        ) : (
          <div className="text-center px-2 py-3 flex flex-col items-center justify-center">
            <svg className="w-6 h-6 text-zinc-400 dark:text-zinc-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008v-.008z" />
            </svg>
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Upload Foto</p>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
