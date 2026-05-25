"use client";
import type { KeyPoint } from "@/lib/types";
import { formatTimestamp } from "@/lib/utils";
import { useSeek } from "./seek-context";

export function KeypointsList({
  items,
  onSeek,
}: {
  items: KeyPoint[];
  onSeek?: (sec: number) => void;
}) {
  const contextSeek = useSeek();
  const seek = onSeek ?? contextSeek;
  return (
    <ol className="max-w-content list-none">
      {items.map((kp, i) => {
        const hasTs = kp.timestamp_sec !== undefined;
        const body = (
          <>
            <span aria-hidden className="flex-shrink-0 font-bold text-amber-600">
              •
            </span>
            <span className="flex-1 text-ink-900">{kp.text}</span>
            {hasTs && (
              <span className="flex-shrink-0 self-start font-sans text-sm text-link">
                {formatTimestamp(kp.timestamp_sec!)} ↗
              </span>
            )}
          </>
        );
        return (
          <li
            key={i}
            className="border-b border-border-default last:border-b-0"
            title={kp.source_span}
          >
            {hasTs ? (
              <button
                type="button"
                aria-label={`${kp.text} · ${formatTimestamp(kp.timestamp_sec!)}`}
                onClick={() => seek(kp.timestamp_sec!)}
                className="flex w-full items-baseline gap-3 py-3.5 text-left text-md leading-relaxed transition-colors hover:bg-bg-elev"
              >
                {body}
              </button>
            ) : (
              <div className="flex items-baseline gap-3 py-3.5 text-md leading-relaxed">{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
