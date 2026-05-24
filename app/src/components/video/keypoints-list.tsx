"use client";
import type { KeyPoint } from "@/lib/types";
import { formatTimestamp } from "@/lib/utils";

export function KeypointsList({
  items,
  onSeek,
}: {
  items: KeyPoint[];
  onSeek?: (sec: number) => void;
}) {
  return (
    <ol className="max-w-content list-none">
      {items.map((kp, i) => (
        <li
          key={i}
          className="flex items-baseline gap-3 border-b border-border-default py-3.5 text-md leading-relaxed last:border-b-0"
          title={kp.source_span}
        >
          <span aria-hidden className="flex-shrink-0 font-bold text-amber-600">•</span>
          <span className="flex-1 text-ink-900">{kp.text}</span>
          {kp.timestamp_sec !== undefined && (
            <button
              type="button"
              onClick={() => onSeek?.(kp.timestamp_sec!)}
              className="flex-shrink-0 font-sans text-sm text-link transition-colors hover:text-link-hover"
            >
              {formatTimestamp(kp.timestamp_sec)} ↗
            </button>
          )}
        </li>
      ))}
    </ol>
  );
}
