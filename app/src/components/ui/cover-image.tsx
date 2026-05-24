"use client";

import * as React from "react";

/**
 * CoverImage — client-side <img> with YouTube thumbnail fallback chain.
 *
 * YouTube's maxresdefault.jpg is absent for ~30% of videos (older / low-res
 * uploads). When it 404s, YouTube serves a 120x90 grey placeholder rather than
 * a real error, so we can't rely on onError alone for that case — but for true
 * 404s onError fires and we step down: maxresdefault → hqdefault → mqdefault.
 */
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

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={chain[idx]}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => {
        if (idx < chain.length - 1) setIdx((i) => i + 1);
      }}
    />
  );
}
