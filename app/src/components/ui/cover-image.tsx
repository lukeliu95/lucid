"use client";

import * as React from "react";

/**
 * CoverImage — client-side <img> with YouTube thumbnail fallback chain.
 *
 * YouTube's maxresdefault.jpg is absent for ~30% of videos (older / low-res
 * uploads). When it's missing, YouTube serves a 120x90 grey placeholder with a
 * 200 status rather than a 404 — so onError never fires for that case. We catch
 * it in onLoad by detecting the placeholder's tell-tale 120px width and step
 * down the chain: maxresdefault → hqdefault → mqdefault. onError still handles
 * true 404s. hqdefault/mqdefault always exist for every YouTube video.
 */
// 灰占位图固定 120x90;真实缩略图 mq=320 / hq=480 / maxres=1280,均 > 120。
const PLACEHOLDER_MAX_W = 120;

export function CoverImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const buildChain = React.useCallback((initial: string): string[] => {
    const m = initial.match(/\/vi\/([^/]+)\/maxresdefault\.jpg$/);
    if (!m) return [initial];
    const id = m[1];
    return [
      initial,
      `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
    ];
  }, []);

  const chain = React.useMemo(() => buildChain(src), [src, buildChain]);
  const [idx, setIdx] = React.useState(0);

  const stepDown = React.useCallback(() => {
    setIdx((i) => (i < chain.length - 1 ? i + 1 : i));
  }, [chain.length]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={chain[idx]}
      alt={alt}
      loading="lazy"
      className={className}
      // 真 404 → 降级
      onError={stepDown}
      // 200 但是灰占位(120x90)→ 也降级
      onLoad={(e) => {
        if (e.currentTarget.naturalWidth <= PLACEHOLDER_MAX_W) stepDown();
      }}
    />
  );
}
