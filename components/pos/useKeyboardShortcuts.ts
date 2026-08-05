"use client";

import { useCallback, useEffect, useRef } from "react";

interface UseKeyboardShortcutsProps {
  barcodeRef: React.RefObject<HTMLInputElement | null>;
  onBarcodeFocus: () => void;
  onSearchFocus: () => void;
  onCheckout: () => void;
  cartLength: number;
  registerExists: boolean;
  showOpenModal: boolean;
  showCloseModal: boolean;
  showReceipt: boolean;
  showMobileCart: boolean;
  onCloseOpenModal: () => void;
  onCloseCloseModal: () => void;
  onCloseReceipt: () => void;
  onCloseMobileCart: () => void;
  onClearInputs: () => void;
}

export function useKeyboardShortcuts({
  barcodeRef,
  onBarcodeFocus,
  onSearchFocus,
  onCheckout,
  cartLength,
  registerExists,
  showOpenModal,
  showCloseModal,
  showReceipt,
  showMobileCart,
  onCloseOpenModal,
  onCloseCloseModal,
  onCloseReceipt,
  onCloseMobileCart,
  onClearInputs,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      if (e.key === "F2") {
        e.preventDefault();
        barcodeRef.current?.focus();
      } else if (e.key === "F3") {
        e.preventDefault();
        onSearchFocus();
      } else if (e.key === "F4") {
        e.preventDefault();
        if (cartLength > 0 && registerExists) onCheckout();
      } else if (e.key === "Escape") {
        if (showOpenModal) onCloseOpenModal();
        else if (showCloseModal) onCloseCloseModal();
        else if (showReceipt) onCloseReceipt();
        else if (showMobileCart) onCloseMobileCart();
        else if (isInput) {
          onClearInputs();
          barcodeRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });
}
