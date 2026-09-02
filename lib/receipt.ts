import { jsPDF } from "jspdf";
import { moneyFormatter } from "@/lib/format";

type ReceiptItem = {
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalPrice: number;
};

type ReceiptData = {
  receiptNumber: number;
  totalAmount: number;
  discountAmount: number;
  paymentMethod: string;
  saleDate: string;
  items: ReceiptItem[];
  storeName?: string;
  storeAddress?: string;
  storeCuit?: string;
  seller?: string;
  cashReceived?: number;
  amountPaid?: number;
  customerName?: string;
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  ACCOUNT: "Cta Cte",
};

const PAYMENT_WIDTH = 72;
const MARGIN = 4;

function centerText(doc: jsPDF, text: string, y: number, fontSize: number) {
  doc.setFontSize(fontSize);
  const textWidth = doc.getTextWidth(text);
  doc.text(text, (PAYMENT_WIDTH - textWidth) / 2, y);
}

function drawLine(doc: jsPDF, y: number) {
  doc.setDrawColor(0);
  doc.setLineWidth(0.1);
  doc.line(MARGIN, y, PAYMENT_WIDTH - MARGIN, y);
}

function drawDashedLine(doc: jsPDF, y: number) {
  doc.setDrawColor(150);
  doc.setLineWidth(0.1);
  for (let x = MARGIN; x < PAYMENT_WIDTH - MARGIN; x += 1.5) {
    doc.line(x, y, x + 0.8, y);
  }
}

export function generateReceiptPDF(data: ReceiptData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [PAYMENT_WIDTH, 200],
  });

  doc.setFont("courier", "normal");
  let y = 8;

  // Store header
  centerText(doc, data.storeName ?? "Ztocky", y, 12);
  y += 5;
  if (data.storeAddress) {
    centerText(doc, data.storeAddress, y, 7);
    y += 4;
  }
  if (data.storeCuit) {
    centerText(doc, `CUIT: ${data.storeCuit}`, y, 7);
    y += 4;
  }

  drawDashedLine(doc, y);
  y += 5;

  // Receipt info
  doc.setFontSize(7);
  doc.text(`Ticket N°: ${String(data.receiptNumber).padStart(8, "0")}`, MARGIN, y);
  y += 3.5;
  doc.text(`Fecha: ${new Date(data.saleDate).toLocaleDateString("es-AR")} ${new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`, MARGIN, y);
  y += 3.5;
  if (data.seller) {
    doc.text(`Vendedor: ${data.seller}`, MARGIN, y);
    y += 3.5;
  }
  if (data.customerName) {
    doc.text(`Cliente: ${data.customerName}`, MARGIN, y);
    y += 3.5;
  }

  drawDashedLine(doc, y);
  y += 5;

  // Items header
  doc.setFont("courier", "bold");
  doc.text("CANT  PRODUCTO              TOTAL", MARGIN, y);
  doc.setFont("courier", "normal");
  y += 4;

  drawLine(doc, y);
  y += 4;

  // Items
  for (const item of data.items) {
    const qty = String(item.quantity).padStart(3, " ");
    const name = item.name.length > 16 ? item.name.slice(0, 15) + "." : item.name.padEnd(16, " ");
    const total = moneyFormatter.format(item.totalPrice).padStart(10, " ");
    doc.text(`${qty}  ${name} ${total}`, MARGIN, y);
    y += 3.5;

    const unitLine = `    x ${moneyFormatter.format(item.unitPrice)}`;
    doc.setTextColor(120);
    doc.text(unitLine, MARGIN, y);
    doc.setTextColor(0);
    y += 4;
  }

  drawLine(doc, y);
  y += 5;

  // Totals
  doc.setFont("courier", "normal");
  doc.text(`Subtotal:`, MARGIN, y);
  doc.text(moneyFormatter.format(data.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)).padStart(12), PAYMENT_WIDTH - MARGIN - 30, y);
  y += 4;

  if (data.discountAmount > 0) {
    doc.setTextColor(0, 128, 0);
    doc.text(`Descuento:`, MARGIN, y);
    doc.text(`-${moneyFormatter.format(data.discountAmount)}`.padStart(12), PAYMENT_WIDTH - MARGIN - 30, y);
    doc.setTextColor(0);
    y += 4;
  }

  drawLine(doc, y);
  y += 5;

  doc.setFont("courier", "bold");
  doc.setFontSize(10);
  doc.text(`TOTAL:`, MARGIN, y);
  doc.text(moneyFormatter.format(data.totalAmount).padStart(12), PAYMENT_WIDTH - MARGIN - 30, y);
  y += 6;

  drawDashedLine(doc, y);
  y += 5;

  // Payment
  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  doc.text(`Pago: ${PAYMENT_LABELS[data.paymentMethod] ?? data.paymentMethod}`, MARGIN, y);
  y += 3.5;

  if (data.paymentMethod === "CASH" && data.cashReceived) {
    doc.text(`Recibido: ${moneyFormatter.format(data.cashReceived)}`, MARGIN, y);
    y += 3.5;
    const change = data.cashReceived - data.totalAmount;
    if (change > 0) {
      doc.text(`Vuelto: ${moneyFormatter.format(change)}`, MARGIN, y);
      y += 3.5;
    }
  }

  if (data.paymentMethod === "ACCOUNT" && data.amountPaid != null && data.amountPaid > 0) {
    doc.text(`Seña: ${moneyFormatter.format(data.amountPaid)}`, MARGIN, y);
    y += 3.5;
    const saldo = data.totalAmount - data.amountPaid;
    if (saldo > 0) {
      doc.text(`Saldo a cuenta: ${moneyFormatter.format(saldo)}`, MARGIN, y);
      y += 3.5;
    }
  }

  y += 4;
  drawDashedLine(doc, y);
  y += 6;

  // Footer
  centerText(doc, "¡Gracias por su compra!", y, 8);
  y += 5;
  centerText(doc, "www.ztocky.com", y, 6);

  return doc;
}

export function downloadReceiptPDF(data: ReceiptData) {
  const doc = generateReceiptPDF(data);
  doc.save(`ticket_${String(data.receiptNumber).padStart(8, "0")}.pdf`);
}

export function printReceipt(data: ReceiptData) {
  const doc = generateReceiptPDF(data);
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank");
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
