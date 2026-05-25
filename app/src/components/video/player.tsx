"use client";
import * as React from "react";
import { useSeekRegister } from "./seek-context";

export function Player({
  platform,
  platformId,
  ariaLabel,
}: {
  platform: "youtube" | "bilibili";
  platformId: string;
  ariaLabel: string;
}) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const register = useSeekRegister();

  const src =
    platform === "youtube"
      ? `https://www.youtube.com/embed/${platformId}?enablejsapi=1`
      : `https://player.bilibili.com/player.html?bvid=${platformId}&high_quality=1`;

  React.useEffect(() => {
    // Only YouTube exposes a postMessage seek command (enablejsapi=1).
    if (platform !== "youtube") {
      register(null);
      return;
    }
    const seek = (sec: number) => {
      const win = iframeRef.current?.contentWindow;
      if (!win) return;
      const target = Math.max(0, Math.floor(sec));
      win.postMessage(
        JSON.stringify({ event: "command", func: "seekTo", args: [target, true] }),
        "*",
      );
      win.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*");
      // Only scroll when the player is actually off-screen (e.g. narrow layouts where
      // the timeline sits below it). If it's already visible, do NOT move the page —
      // a jump there just obscures the video the user is watching.
      const el = containerRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const visible = rect.bottom > 0 && rect.top < window.innerHeight;
        if (!visible) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    register(seek);
    return () => register(null);
  }, [platform, platformId, register]);

  return (
    <div
      ref={containerRef}
      className="aspect-video w-full overflow-hidden rounded-lg border border-border-default bg-ink-950"
    >
      <iframe
        ref={iframeRef}
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
