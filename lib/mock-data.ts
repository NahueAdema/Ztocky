export const products = [
  {
    sku: "CAF-001",
    name: "Cafe Brasil 1kg",
    category: "Almacen",
    currentStock: 18,
    minStock: 24,
    costPrice: 7400,
    sellingPrice: 11800,
    burnRate: 5.6,
    daysRemaining: 3,
    margin: 37,
    lastSale: "2026-05-18",
  },
  {
    sku: "YER-014",
    name: "Yerba organica 500g",
    category: "Almacen",
    currentStock: 42,
    minStock: 20,
    costPrice: 2100,
    sellingPrice: 3900,
    burnRate: 2.1,
    daysRemaining: 20,
    margin: 46,
    lastSale: "2026-05-17",
  },
  {
    sku: "ACE-090",
    name: "Aceite oliva extra virgen",
    category: "Gourmet",
    currentStock: 7,
    minStock: 14,
    costPrice: 5600,
    sellingPrice: 8300,
    burnRate: 1.8,
    daysRemaining: 4,
    margin: 33,
    lastSale: "2026-05-16",
  },
  {
    sku: "CON-032",
    name: "Conserva tomates perita",
    category: "Almacen",
    currentStock: 120,
    minStock: 40,
    costPrice: 920,
    sellingPrice: 1550,
    burnRate: 0.2,
    daysRemaining: 600,
    margin: 41,
    lastSale: "2026-04-08",
  },
];

export const suppliers = [
  {
    name: "Norte Distribuciones",
    contactEmail: "compras@nortedist.com",
    leadTime: 3,
    shippingCost: 18000,
    reliability: 4.8,
    focus: "Entrega rapida",
  },
  {
    name: "Mercado Mayorista Sur",
    contactEmail: "ventas@mayoristasur.com",
    leadTime: 7,
    shippingCost: 9000,
    reliability: 4.4,
    focus: "Mejor precio",
  },
  {
    name: "Importadora Central",
    contactEmail: "stock@centralimp.com",
    leadTime: 12,
    shippingCost: 24000,
    reliability: 4.1,
    focus: "Productos premium",
  },
];

export const reorderRisks = [
  {
    product: "Cafe Brasil 1kg",
    sku: "CAF-001",
    stock: 18,
    burnRate: 5.6,
    daysRemaining: 3,
    supplier: "Norte Distribuciones",
    leadTime: 3,
    suggestedQty: 180,
    urgency: "Crítica",
  },
  {
    product: "Aceite oliva extra virgen",
    sku: "ACE-090",
    stock: 7,
    burnRate: 1.8,
    daysRemaining: 4,
    supplier: "Norte Distribuciones",
    leadTime: 3,
    suggestedQty: 60,
    urgency: "Alta",
  },
  {
    product: "Yerba organica 500g",
    sku: "YER-014",
    stock: 42,
    burnRate: 2.1,
    daysRemaining: 20,
    supplier: "Mercado Mayorista Sur",
    leadTime: 7,
    suggestedQty: 90,
    urgency: "Media",
  },
];

export const purchaseOrders = [
  {
    id: "PO-1024",
    supplier: "Norte Distribuciones",
    status: "Borrador",
    items: 2,
    totalAmount: 1120000,
    createdAt: "2026-05-19",
  },
  {
    id: "PO-1023",
    supplier: "Mercado Mayorista Sur",
    status: "Enviada",
    items: 5,
    totalAmount: 845000,
    createdAt: "2026-05-17",
  },
  {
    id: "PO-1022",
    supplier: "Importadora Central",
    status: "Recibida",
    items: 3,
    totalAmount: 1360000,
    createdAt: "2026-05-12",
  },
];

export const stagnantProducts = products.filter(
  (product) => new Date(product.lastSale) < new Date("2026-04-20"),
);

export const moneyFormatter = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  maximumFractionDigits: 0,
  style: "currency",
});
