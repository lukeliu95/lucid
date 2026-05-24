import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded border border-border-default bg-bg-elev px-3 py-2 font-sans text-sm text-ink-900 placeholder:text-ink-300 transition-colors duration-fast hover:border-border-strong focus:border-amber-600",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
