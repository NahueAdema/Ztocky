import { type LucideIcon } from "lucide-react";
import Link from "next/link";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 text-center ${className}`}
    >
      <div className="relative mb-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/10">
          <Icon className="h-9 w-9 text-primary/70" />
        </div>
        <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background ring-2 ring-border">
          <span className="text-xs text-muted-foreground">0</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1.5 max-w-xs text-xs leading-5 text-muted-foreground">
        {description}
      </p>
      {action && (
        <Link
          href={action.href}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-dark hover:shadow-lg active:scale-[0.97]"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
