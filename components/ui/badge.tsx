import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeTone = "default" | "danger" | "warning" | "success" | "muted";

const toneClasses: Record<BadgeTone, string> = {
  default: "bg-accent-soft text-accent-foreground border border-accent/20",
  danger: "bg-danger-light text-danger border border-danger/20",
  warning: "bg-warning-light text-warning border border-warning/20",
  success: "bg-success-light text-success border border-success/20",
  muted: "bg-muted text-muted-foreground border border-border",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
