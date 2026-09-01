"use client";

import { useState, useRef, useEffect } from "react";
import { compressImage } from "@/lib/image-compressor";

interface CameraCaptureProps {
  label: string;
  icon?: string | React.ReactNode;
  onCapture: (file: File) => void;
  preview?: string | null;
  onRemove?: () => void;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const ua = navigator.userAgent.toLowerCase();
      const mobile =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          ua
        );
      setIsMobile(mobile);
    };
    check();
  }, []);

  return isMobile;
}

export default function CameraCapture({
  label,
  icon = "📷",
  onCapture,
  preview,
  onRemove,
}: CameraCaptureProps) {
  const isMobile = useIsMobile();
  const cameraRef = useRef<HTMLInputElement>(null);
  const [showDesktopWarning, setShowDesktopWarning] = useState(false);

  const handleClick = () => {
    if (!isMobile) {
      setShowDesktopWarning(true);
      return;
    }
    cameraRef.current?.click();
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (rawFile) {
      const compressed = await compressImage(rawFile);
      onCapture(compressed);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
          {icon && typeof icon === "string" ? <span className="text-xs">{icon}</span> : icon}
          <span>{label}</span>
        </label>
        {preview && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Tersimpan
          </span>
        )}
      </div>

      <div
        onClick={handleClick}
        className={`relative aspect-square border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-200 group ${
          preview
            ? "border-emerald-500/80 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs"
            : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/60"
        }`}
      >
        {preview ? (
          <div className="relative w-full h-full group">
            <img
              src={preview}
              alt={label}
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
              <span className="text-[10px] text-white font-medium px-2 py-1 rounded bg-black/50 backdrop-blur-xs self-start">
                {label}
              </span>
              {onRemove && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="w-8 h-8 bg-rose-600/90 hover:bg-rose-600 text-white rounded-full flex items-center justify-center text-sm shadow-md transition-transform active:scale-95 self-end cursor-pointer"
                  title="Hapus foto"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
            {/* Mobile top-right remove icon */}
            {onRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="md:hidden absolute top-2 right-2 w-7 h-7 bg-black/60 backdrop-blur-xs text-white rounded-full flex items-center justify-center text-xs shadow-md border border-white/20 active:scale-90 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        ) : (
          <div className="text-center px-2 py-4 flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-zinc-200/70 dark:group-hover:bg-zinc-700/80 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008v-.008z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                {isMobile ? "Ambil Foto" : "Gunakan HP"}
              </p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                {isMobile ? "Tap untuk kamera" : "Buka via smartphone"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden camera input */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />

      {/* Desktop warning */}
      {showDesktopWarning && (
        <div className="mt-1 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded-lg flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
          <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Fitur kamera hanya bisa diakses dari HP. Silakan buka link ini pada smartphone Anda.</span>
        </div>
      )}
    </div>
  );
}
