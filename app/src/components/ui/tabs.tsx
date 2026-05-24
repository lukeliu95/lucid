"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type TabsCtx = { value: string; setValue: (v: string) => void };
const Ctx = React.createContext<TabsCtx | null>(null);

export function Tabs({
  defaultValue,
  value: valueProp,
  onValueChange,
  children,
  className,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const value = valueProp ?? internal;
  const setValue = React.useCallback(
    (v: string) => {
      if (valueProp === undefined) setInternal(v);
      onValueChange?.(v);
    },
    [valueProp, onValueChange],
  );
  return (
    <Ctx.Provider value={{ value, setValue }}>
      <div className={cn(className)}>{children}</div>
    </Ctx.Provider>
  );
}

export function TabsList({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn("flex gap-2 border-b border-border-default", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(Ctx);
  if (!ctx) return null;
  const active = ctx.value === value;
  return (
    <button
      role="tab"
      type="button"
      aria-selected={active}
      onClick={() => ctx.setValue(value)}
      className={cn(
        "-mb-px border-b-2 px-6 py-3 font-serif text-lg transition-colors duration-fast",
        active
          ? "border-amber-600 font-semibold text-amber-600"
          : "border-transparent text-ink-500 hover:text-ink-900",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(Ctx);
  if (!ctx || ctx.value !== value) return null;
  return (
    <div
      role="tabpanel"
      className={cn("min-h-[600px] text-md leading-relaxed text-ink-900", className)}
    >
      {children}
    </div>
  );
}
