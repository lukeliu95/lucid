import * as React from "react";
import { cn } from "@/lib/utils";
import { CoverImage } from "./cover-image";

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

export function CardCover({
  className,
  src,
  alt,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { src?: string | null; alt?: string }) {
  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden border-b border-border-default bg-gradient-to-br from-paper-300 to-paper-400",
        className,
      )}
      {...props}
    >
      {src ? (
        <CoverImage
          src={src}
          alt={alt ?? ""}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
    </div>
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
