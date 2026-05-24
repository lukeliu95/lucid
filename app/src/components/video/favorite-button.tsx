"use client";
import * as React from "react";
import { useTranslations } from "next-intl";

export function FavoriteButton({ initial = false }: { initial?: boolean }) {
  const t = useTranslations("video.favorite");
  const [on, setOn] = React.useState(initial);
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setOn((v) => !v)}
      className="inline-flex items-center gap-1.5 rounded border border-border-default px-3 py-1.5 font-sans text-sm text-ink-700 transition-colors duration-fast hover:border-amber-600 hover:bg-amber-50 hover:text-amber-600"
    >
      <span aria-hidden>{on ? "♥" : "♡"}</span>
      <span>{on ? t("added") : t("add")}</span>
    </button>
  );
}
