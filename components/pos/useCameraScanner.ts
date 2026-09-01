"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { DecodeHintType } from "@zxing/library";

interface UseCameraScannerProps {
  onScan: (code: string) => void;
}

export function useCameraScanner({ onScan }: UseCameraScannerProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const scanningRef = useRef(false);
  const controlsRef = useRef<IScannerControls | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastCodeRef = useRef("");
  const onScanRef = useRef(onScan);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    controlsRef.current?.stop();
    controlsRef.current = null;
    codeReaderRef.current = null;
    setCameraActive(false);
    setCameraError("");
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError("");
    scanningRef.current = true;
    lastCodeRef.current = "";
    setCameraActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      if (!scanningRef.current || !videoRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      if (!codeReaderRef.current) {
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          "EAN_13",
          "EAN_8",
          "CODE_128",
          "CODE_39",
          "UPC_A",
          "UPC_E",
          "QR_CODE",
          "CODABAR",
        ]);
        codeReaderRef.current = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 200 });
      }
      controlsRef.current = await codeReaderRef.current.decodeFromStream(
        stream,
        videoRef.current,
        (result) => {
          if (!scanningRef.current || !result) return;
          const code = result.getText().trim();
          if (code === lastCodeRef.current) return;
          lastCodeRef.current = code;
          scanningRef.current = false;
          const detected = code;
          requestAnimationFrame(() => {
            stopCamera();
            onScanRef.current(detected);
          });
        }
      );
    } catch (err) {
      const e = err as Error;
      const denied =
        e?.name === "NotAllowedError" ||
        e?.name === "PermissionDeniedError" ||
        e?.name === "SecurityError";
      setCameraActive(false);
      setCameraError(
        denied
          ? "Permiso de cámara denegado. Activá la cámara en la configuración del navegador e intentá de nuevo."
          : `No se pudo acceder a la cámara: ${e?.message || "error desconocido"}`
      );
    }
  }, [stopCamera]);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    return () => {
      scanningRef.current = false;
      controlsRef.current?.stop();
      controlsRef.current = null;
      codeReaderRef.current = null;
    };
  }, []);

  return {
    cameraActive,
    setCameraActive,
    cameraError,
    startCamera,
    stopCamera,
    videoRef,
  };
}
