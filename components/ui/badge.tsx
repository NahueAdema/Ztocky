import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeTone = "default" | "danger" | "warning" | "success" | "muted" | "accent";

const toneClasses: Record<BadgeTone, string> = {
  default: "bg-primary/10 text-primary border border-primary/20",
  danger: "bg-danger/10 text-danger border border-danger/20",
  warning: "bg-warning/15 text-warning border border-warning/25",
  success: "bg-success/10 text-success border border-success/20",
  muted: "bg-muted text-muted-foreground border border-border/50",
  accent: "bg-accent-light text-accent border border-accent/20",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
