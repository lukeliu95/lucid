"use client";
import * as React from "react";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";

const cls =
  "inline-flex items-center gap-1.5 rounded border border-border-default px-3 py-1.5 font-sans text-sm text-ink-700 transition-colors duration-fast hover:border-amber-600 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-60";

export function FavoriteButton({ slug }: { slug: string }) {
  const t = useTranslations("video.favorite");
  const { isSignedIn } = useAuth();
  const [on, setOn] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!isSignedIn) return;
    let alive = true;
    fetch(`/api/favorites?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : { favorited: false }))
      .then((d) => {
        if (alive) setOn(!!d.favorited);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [isSignedIn, slug]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const next = !on;
    setOn(next); // optimistic
    try {
      const res = await fetch("/api/favorites", {
        method: next ? "POST" : "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) setOn(!next);
    } catch {
      setOn(!next);
    } finally {
      setBusy(false);
    }
  }

  // 未登录:点击触发 Clerk 登录弹窗。
  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button type="button" className={cls}>
          <span aria-hidden>♡</span>
          <span>{t("add")}</span>
        </button>
      </SignInButton>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={toggle}
      disabled={busy}
      className={cls}
    >
      <span aria-hidden>{on ? "♥" : "♡"}</span>
      <span>{on ? t("added") : t("add")}</span>
    </button>
  );
}
