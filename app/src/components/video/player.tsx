"use client";
import * as React from "react";

export function Player({
  platform,
  platformId,
  ariaLabel,
}: {
  platform: "youtube" | "bilibili";
  platformId: string;
  ariaLabel: string;
}) {
  const src =
    platform === "youtube"
      ? `https://www.youtube.com/embed/${platformId}?enablejsapi=1`
      : `https://player.bilibili.com/player.html?bvid=${platformId}&high_quality=1`;
  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg border border-border-default bg-ink-950">
      <iframe
        src={src}
        title={ariaLabel}
        aria-label={ariaLabel}
        loading="eager"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}
