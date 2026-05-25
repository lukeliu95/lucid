import { cn } from "@/lib/utils";

/**
 * Brand lockup for 明读 / Lucid — a seal-style wordmark.
 *
 * e-ink magazine aesthetic → monochrome: an ink-black 印章 (square seal) with
 * the two characters 明读 knocked out in paper colour (阳文), paired with a
 * serif "Lucid" wordmark. No vermillion — the whole palette is warm monochrome.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)} aria-hidden>
      <span className="inline-flex h-9 w-9 flex-col items-center justify-center rounded-[5px] bg-ink-950 font-serif text-[14px] font-semibold leading-[1.02] text-paper-50">
        <span>明</span>
        <span>读</span>
      </span>
      <span className="font-serif text-xl font-semibold tracking-tight text-ink-950">Lucid</span>
    </span>
  );
}
