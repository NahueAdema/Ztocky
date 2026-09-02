export type Product = {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  currentStock: number;
  category: string | null;
  isActive: boolean;
};

export type CartItem = {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  discountAmount: number;
};

export type CashRegister = {
  id: string;
  openingAmount: number;
  status: string;
  openedAt: string;
  totalSales: number;
  cashSales: number;
  transactionCount: number;
};

export type SaleResult = {
  id: string;
  receiptNumber: number;
  totalAmount: number;
  discountAmount: number;
  paymentMethod: string;
  amountPaid: number;
  saleDate: string;
  items: { name: string; sku: string; quantity: number; unitPrice: number; discountAmount: number; totalPrice: number }[];
};

export type Customer = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
};

export type TodaySale = {
  id: string;
  receiptNumber: number;
  totalAmount: number;
  paymentMethod: string;
  itemCount: number;
  seller: string;
  customer?: string;
  createdAt: string;
};
