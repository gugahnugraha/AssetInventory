"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, SwitchCamera, RotateCcw, Check, AlertCircle, Loader2, Smartphone } from "lucide-react";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void | Promise<void>;
}

/**
 * Cross-platform camera capture modal supporting laptop webcams (WebRTC)
 * and Android cameras (WebRTC rear/front + native capture fallback).
 */
export function CameraCaptureModal({ isOpen, onClose, onCapture }: CameraCaptureModalProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const nativeInputRef = React.useRef<HTMLInputElement | null>(null);

  const [facingMode, setFacingMode] = React.useState<"environment" | "user">("environment");
  const [videoDevices, setVideoDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = React.useState<string | null>(null);

  const [starting, setStarting] = React.useState(false);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [capturedFile, setCapturedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [confirming, setConfirming] = React.useState(false);

  const stopStream = React.useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const clearPreview = React.useCallback(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setCapturedFile(null);
  }, []);

  // Start / restart WebRTC stream when modal opens or camera selection changes
  React.useEffect(() => {
    if (!isOpen || previewUrl) {
      stopStream();
      return;
    }

    let cancelled = false;

    const startCamera = async () => {
      setStarting(true);
      setCameraError(null);
      stopStream();

      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setStarting(false);
        setCameraError(
          "Browser tidak mendukung akses kamera langsung (pastikan menggunakan HTTPS atau browser modern)."
        );
        return;
      }

      const constraints: MediaStreamConstraints = selectedDeviceId
        ? {
            video: {
              deviceId: { exact: selectedDeviceId },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
            audio: false,
          }
        : {
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
            audio: false,
          };

      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch {
          // Fallback for laptop webcams or drivers that reject ideal/facingMode constraints
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        if (navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          if (!cancelled) {
            setVideoDevices(devices.filter((d) => d.kind === "videoinput"));
          }
        }
      } catch (err: any) {
        if (cancelled) return;
        const name = err?.name || "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setCameraError(
            "Izin akses kamera ditolak. Izinkan akses kamera di pengaturan browser atau gunakan tombol kamera perangkat di bawah."
          );
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setCameraError("Tidak ada perangkat kamera yang terdeteksi pada perangkat ini.");
        } else if (name === "NotReadableError" || name === "TrackStartError") {
          setCameraError("Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.");
        } else {
          setCameraError("Gagal mengakses kamera. Anda tetap dapat menggunakan kamera perangkat di bawah.");
        }
      } finally {
        if (!cancelled) {
          setStarting(false);
        }
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [isOpen, facingMode, selectedDeviceId, previewUrl, stopStream]);

  // Reset state whenever modal closes
  React.useEffect(() => {
    if (!isOpen) {
      stopStream();
      clearPreview();
      setCameraError(null);
      setConfirming(false);
    }
  }, [isOpen, stopStream, clearPreview]);

  const handleSwitchCamera = () => {
    if (videoDevices.length > 1 && streamRef.current) {
      const currentTrack = streamRef.current.getVideoTracks()[0];
      const currentDeviceId = currentTrack?.getSettings()?.deviceId || selectedDeviceId;
      const currentIdx = videoDevices.findIndex((d) => d.deviceId === currentDeviceId);
      const nextIdx = (currentIdx + 1) % videoDevices.length;
      setSelectedDeviceId(videoDevices[nextIdx].deviceId);
    } else {
      setSelectedDeviceId(null);
      setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    }
  };

  const handleCaptureFrame = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const file = new File([blob], `kamera-${timestamp}.jpg`, { type: "image/jpeg" });
        const objectUrl = URL.createObjectURL(blob);
        setCapturedFile(file);
        setPreviewUrl(objectUrl);
        stopStream();
      },
      "image/jpeg",
      0.9
    );
  };

  const handleConfirmCapture = async () => {
    if (!capturedFile || confirming) return;
    setConfirming(true);
    try {
      await onCapture(capturedFile);
      onClose();
    } finally {
      setConfirming(false);
    }
  };

  const handleNativeCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || confirming) return;

    setConfirming(true);
    try {
      await onCapture(file);
      onClose();
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {
        if (!confirming) onClose();
      }}
      className="max-w-xl p-5 sm:p-6"
    >
      <DialogHeader className="pb-3 mb-3">
        <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Camera className="h-5 w-5 text-emerald-600" />
          Ambil Foto dari Kamera
        </DialogTitle>
        <DialogDescription className="text-xs">
          Mendukung webcam laptop maupun kamera depan/belakang Android.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="relative w-full aspect-4/3 bg-zinc-950 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
          {previewUrl ? (
            <img src={previewUrl} alt="Hasil foto kamera" className="w-full h-full object-contain" />
          ) : cameraError ? (
            <div className="p-6 text-center space-y-3 max-w-sm">
              <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">{cameraError}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {starting && (
                <div className="absolute inset-0 bg-zinc-950/80 flex flex-col items-center justify-center gap-2 text-zinc-200">
                  <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
                  <span className="text-xs font-medium">Menyiapkan kamera...</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Hidden native camera input fallback for Android/iOS */}
        <input
          ref={nativeInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          capture="environment"
          onChange={handleNativeCapture}
          className="hidden"
        />

        {previewUrl ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={clearPreview}
              disabled={confirming}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              Foto Ulang
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCapture}
              disabled={confirming}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {confirming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengunggah...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Gunakan Foto Ini
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {!cameraError && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSwitchCamera}
                  disabled={starting}
                  className="flex items-center gap-1.5 text-xs cursor-pointer"
                >
                  <SwitchCamera className="h-4 w-4" />
                  Ganti Kamera
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => nativeInputRef.current?.click()}
                disabled={confirming}
                className="flex items-center gap-1.5 text-xs cursor-pointer"
              >
                <Smartphone className="h-4 w-4" />
                Kamera Bawaan HP
              </Button>
            </div>

            {!cameraError && (
              <Button
                type="button"
                onClick={handleCaptureFrame}
                disabled={starting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="h-4 w-4" />
                Ambil Foto
              </Button>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
