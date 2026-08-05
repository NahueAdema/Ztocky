"use client";

import { X, Ban } from "lucide-react";
import { moneyFormatter } from "@/lib/format";
import { type TodaySale } from "./types";

interface SalesHistoryProps {
  todaySales: TodaySale[];
  onClose: () => void;
  onVoidSale: (saleId: string) => void;
}

export function SalesHistory({ todaySales, onClose, onVoidSale }: SalesHistoryProps) {
  return (
    <div className="border-t border-border p-4 space-y-2 max-h-64 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase">Ventas de hoy</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      {todaySales.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">Sin ventas hoy</p>
      ) : (
        todaySales.map((sale) => (
          <div key={sale.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-xs">
            <div>
              <div className="font-medium">
                #{String(sale.receiptNumber).padStart(4, "0")} · {sale.itemCount} items
              </div>
              <div className="text-muted-foreground">
                {new Date(sale.createdAt).toLocaleTimeString("es-AR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · {sale.seller}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{moneyFormatter.format(sale.totalAmount)}</span>
              <button
                onClick={() => onVoidSale(sale.id)}
                className="text-muted-foreground hover:text-danger"
                title="Anular venta"
              >
                <Ban className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
