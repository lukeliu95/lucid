"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";

export function SearchBarLauncher() {
  const t = useTranslations("common");
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [value, setValue] = React.useState("");

  React.useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") inputRef.current?.blur();
    }
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
      }}
      className="flex max-w-[480px] flex-1 items-center gap-2 rounded border border-border-default bg-bg-elev px-3 py-2 font-sans text-sm text-text-muted transition-colors duration-fast hover:border-border-strong"
    >
      <span aria-hidden>🔍</span>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("search_placeholder")}
        className="flex-1 bg-transparent text-ink-900 outline-none placeholder:text-text-muted"
        aria-label={t("search_placeholder")}
      />
      <kbd className="ml-auto rounded border border-border-default bg-bg-subtle px-1.5 py-px font-mono text-[11px] text-text-muted">
        ⌘K
      </kbd>
    </form>
  );
}
