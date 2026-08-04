"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { moneyFormatter } from "@/lib/format";
import { type CashRegister } from "./types";

interface CashRegisterModalsProps {
  showOpenModal: boolean;
  setShowOpenModal: (v: boolean) => void;
  showCloseModal: boolean;
  setShowCloseModal: (v: boolean) => void;
  openingAmount: string;
  setOpeningAmount: (v: string) => void;
  closingAmount: string;
  setClosingAmount: (v: string) => void;
  register: CashRegister | null;
  onOpenRegister: () => void;
  onCloseRegister: () => void;
}

export function CashRegisterModals({
  showOpenModal,
  setShowOpenModal,
  showCloseModal,
  setShowCloseModal,
  openingAmount,
  setOpeningAmount,
  closingAmount,
  setClosingAmount,
  register,
  onOpenRegister,
  onCloseRegister,
}: CashRegisterModalsProps) {
  return (
    <>
      {/* Open register modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-md animate-overlay">
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-card p-6 shadow-2xl animate-modal">
            <h2 className="text-lg font-bold mb-4">Abrir caja</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Efectivo inicial</label>
                <Input
                  type="number"
                  value={openingAmount}
                  onChange={(e) => setOpeningAmount(e.target.value)}
                  placeholder="0"
                  className="mt-1"
                  min={0}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setShowOpenModal(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={onOpenRegister}>
                  Abrir
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close register modal */}
      {showCloseModal && register && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-md animate-overlay">
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-card p-6 shadow-2xl animate-modal">
            <h2 className="text-lg font-bold mb-4">Cerrar caja</h2>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Apertura</span>
                  <span>{moneyFormatter.format(register.openingAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ventas efectivo</span>
                  <span>{moneyFormatter.format(register.cashSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Esperado en caja</span>
                  <span className="font-bold">
                    {moneyFormatter.format(register.openingAmount + register.cashSales)}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Efectivo contado</label>
                <Input
                  type="number"
                  value={closingAmount}
                  onChange={(e) => setClosingAmount(e.target.value)}
                  placeholder="0"
                  className="mt-1"
                  min={0}
                  autoFocus
                />
              </div>
              {closingAmount && (
                <div
                  className={`p-2 rounded-lg text-sm font-medium text-center ${
                    Number(closingAmount) === register.openingAmount + register.cashSales
                      ? "bg-success-light text-success"
                      : "bg-warning-light text-warning"
                  }`}
                >
                  Diferencia:{" "}
                  {moneyFormatter.format(
                    Number(closingAmount) - register.openingAmount - register.cashSales
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowCloseModal(false)}
                >
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={onCloseRegister}>
                  Cerrar caja
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
