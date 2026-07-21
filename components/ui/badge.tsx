import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeTone = "default" | "danger" | "warning" | "success" | "muted";

const toneClasses: Record<BadgeTone, string> = {
  default: "bg-primary/10 text-primary border border-primary/15",
  danger: "bg-danger/10 text-danger border border-danger/15",
  warning: "bg-warning/10 text-warning border border-warning/15",
  success: "bg-success/10 text-success border border-success/15",
  muted: "bg-muted text-muted-foreground border border-border/50",
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
