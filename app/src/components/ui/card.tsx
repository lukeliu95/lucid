import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded border border-border-default bg-bg-elev transition-colors duration-fast hover:border-border-strong",
        className,
      )}
      {...props}
    />
  );
}

export function CardCover({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "aspect-video w-full border-b border-border-default bg-gradient-to-br from-paper-300 to-paper-400",
        className,
      )}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-serif text-lg font-semibold leading-snug text-ink-900",
        className,
      )}
      {...props}
    />
  );
}
