"use client";
import * as React from "react";
import type { TimelineItem } from "@/lib/types";
import { formatTimestamp } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function TimelineNav({
  items,
  onSeek,
  ariaLabel,
}: {
  items: TimelineItem[];
  onSeek?: (sec: number) => void;
  ariaLabel: string;
}) {
  const [activeIdx, setActiveIdx] = React.useState(0);
  return (
    <ul className="list-none" aria-label={ariaLabel}>
      {items.map((it, i) => {
        const active = i === activeIdx;
        return (
          <li
            key={i}
            className={cn(
              "grid cursor-pointer grid-cols-[56px_1fr] gap-2 border-l-2 py-2 pl-3 transition-colors duration-fast",
              active ? "border-amber-600 bg-bg-elev" : "border-transparent hover:bg-bg-elev",
            )}
            onClick={() => {
              setActiveIdx(i);
              onSeek?.(it.timestamp_sec);
            }}
          >
            <span className="font-mono text-sm text-text-muted">{formatTimestamp(it.timestamp_sec)}</span>
            <span
              className={cn(
                "font-serif text-sm",
                active ? "font-semibold text-ink-950" : "text-ink-700",
              )}
            >
              {it.title}
            </span>
            {active && (
              <span className="col-start-2 mt-1 text-sm leading-relaxed text-text-muted">
                {it.one_liner}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
