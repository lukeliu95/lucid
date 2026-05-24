import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-block rounded-full bg-bg-subtle px-2 py-0.5 font-sans text-xs text-ink-700",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
