import { DollarSign, CreditCard, ArrowRightLeft, User } from "lucide-react";

export const PAYMENT_METHODS = [
  { value: "CASH", label: "Efectivo", icon: DollarSign, color: "text-success" },
  { value: "CARD", label: "Tarjeta", icon: CreditCard, color: "text-sky" },
  { value: "TRANSFER", label: "Transferencia", icon: ArrowRightLeft, color: "text-primary" },
  { value: "ACCOUNT", label: "Cta Cte", icon: User, color: "text-warning" },
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Bebidas: "bg-sky text-sky-foreground",
  Lácteos: "bg-primary text-primary-foreground",
  Panadería: "bg-warning text-warning-foreground",
  Carnes: "bg-danger text-danger-foreground",
  Verduras: "bg-success text-success-foreground",
  Snacks: "bg-accent text-accent-foreground",
  Limpieza: "bg-muted-foreground text-background",
};

export function getCategoryColor(category: string | null): string {
  if (!category) return "bg-muted text-muted-foreground";
  return CATEGORY_COLORS[category] ?? "bg-primary text-primary-foreground";
}
