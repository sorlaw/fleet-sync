"use client";

import { useState, useRef, useEffect } from "react";

interface CameraCaptureProps {
  label: string;
  icon?: string;
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {icon} {label}
      </label>

      <div
        onClick={handleClick}
        className={`aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer overflow-hidden transition-colors ${
          preview
            ? "border-green-400 bg-green-50"
            : "border-gray-300 hover:border-blue-500"
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
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
              >
                ✕
              </button>
            )}
          </div>
        ) : (
          <div className="text-center">
            <div className="text-3xl mb-1">📸</div>
            <p className="text-xs text-gray-500">
              {isMobile ? "Tap untuk foto" : "Gunakan HP"}
            </p>
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
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          ⚠️ Fitur foto hanya bisa diakses dari HP. Buka halaman ini di
          smartphone Anda.
        </div>
      )}
    </div>
  );
}
