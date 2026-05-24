import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded font-sans text-sm font-medium transition-colors duration-fast disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none",
  {
    variants: {
      variant: {
        primary: "bg-ink-900 text-paper-100 hover:bg-ink-950",
        ghost: "border border-border-default text-ink-700 hover:bg-bg-subtle",
        amber: "border border-amber-600 text-amber-600 hover:bg-amber-50",
        link: "text-link hover:text-link-hover underline-offset-4 hover:underline",
      },
      size: {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
