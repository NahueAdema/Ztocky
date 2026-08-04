"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseCameraScannerProps {
  onScan: (code: string) => void;
}

export function useCameraScanner({ onScan }: UseCameraScannerProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const scanningRef = useRef(false);
  const lastCodeRef = useRef("");
  const videoRef = useRef<HTMLVideoElement>(null);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    setCameraActive(false);
    setCameraError("");
  }, []);

  const startCamera = useCallback(() => {
    setCameraError("");
    if (!("BarcodeDetector" in window)) {
      setCameraError("Tu navegador no soporta detección por cámara.");
      return;
    }
    scanningRef.current = true;
    lastCodeRef.current = "";
    setCameraActive(true);
  }, []);

  const handleBarcodeSubmit = useCallback(
    async (code: string) => {
      if (!code.trim()) return;
      onScan(code.trim());
    },
    [onScan]
  );

  useEffect(() => {
    if (!cameraActive) {
      scanningRef.current = false;
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }
    let cancelled = false;
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (cancelled || !videoRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        if (!scanningRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const detector = new BarcodeDetector({
          formats: ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e", "qr_code", "codabar"],
        });
        const scan = async () => {
          if (!videoRef.current || !scanningRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const code = barcodes[0].rawValue;
              if (code !== lastCodeRef.current) {
                lastCodeRef.current = code;
                scanningRef.current = false;
                setCameraActive(false);
                if (videoRef.current?.srcObject) {
                  (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
                  videoRef.current.srcObject = null;
                }
                onScan(code);
                return;
              }
            }
          } catch { /* keep going */ }
          if (scanningRef.current) setTimeout(scan, 400);
        };
        scan();
      } catch {
        if (!cancelled) {
          setCameraError("No se pudo acceder a la cámara. Verificá los permisos.");
          setCameraActive(false);
        }
      }
    };
    initCamera();
    return () => { cancelled = true; };
  }, [cameraActive, onScan]);

  return {
    cameraActive,
    setCameraActive,
    cameraError,
    startCamera,
    stopCamera,
    videoRef,
  };
}
