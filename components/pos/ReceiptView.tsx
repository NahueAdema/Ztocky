"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { moneyFormatter } from "@/lib/format";
import { downloadReceiptPDF, printReceipt } from "@/lib/receipt";
import { CheckCircle2, Receipt } from "lucide-react";
import { type SaleResult, type Customer } from "./types";
import { PAYMENT_METHODS } from "./constants";

interface ReceiptViewProps {
  sale: SaleResult;
  selectedCustomer: Customer | null;
  workspaceName: string;
  onClose: () => void;
}

export function ReceiptView({ sale, selectedCustomer, workspaceName, onClose }: ReceiptViewProps) {
  const receiptData = {
    receiptNumber: sale.receiptNumber,
    totalAmount: sale.totalAmount,
    discountAmount: sale.discountAmount,
    paymentMethod: sale.paymentMethod,
    saleDate: sale.saleDate,
    items: sale.items,
    customerName: selectedCustomer?.name,
    storeName: workspaceName,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6 text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
          <h2 className="text-xl font-bold">Venta completada</h2>
          <p className="text-muted-foreground">Ticket N° {sale.receiptNumber}</p>
          {selectedCustomer && (
            <p className="text-sm text-muted-foreground">Cliente: {selectedCustomer.name}</p>
          )}
          <div className="text-3xl font-bold text-primary">{moneyFormatter.format(sale.totalAmount)}</div>
          <div className="text-sm text-muted-foreground">
            {PAYMENT_METHODS.find((m) => m.value === sale.paymentMethod)?.label}
          </div>
          <div className="border-t pt-4 space-y-1 text-sm text-left">
            {sale.items.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span>{moneyFormatter.format(item.totalPrice)}</span>
              </div>
            ))}
          </div>
          {sale.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-success">
              <span>Descuento</span>
              <span>-{moneyFormatter.format(sale.discountAmount)}</span>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Cerrar
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => downloadReceiptPDF(receiptData)}>
              <Receipt className="h-4 w-4 mr-2" /> PDF
            </Button>
            <Button className="flex-1" onClick={() => printReceipt(receiptData)}>
              Imprimir
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
