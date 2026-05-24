// Highlight all case-insensitive occurrences of `q` inside `text` with <mark>
import * as React from "react";

export function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(re);
  return (
    <>
      {parts.map((p, i) =>
        re.test(p) && p.toLowerCase() === q.toLowerCase() ? (
          <mark key={i}>{p}</mark>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
    </>
  );
}
