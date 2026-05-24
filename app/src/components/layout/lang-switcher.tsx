"use client";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

export function LangSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as "zh" | "en";
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const go = (next: "zh" | "en") => {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <div
      role="group"
      aria-label={t("locale_toggle_aria")}
      className={cn(
        "inline-flex w-20 items-center rounded bg-bg-subtle p-0.5 font-sans text-[13px]",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => go("zh")}
        className={cn(
          "flex-1 rounded-sm px-2 py-1 text-ink-500 transition-colors duration-fast",
          locale === "zh" && "bg-bg-elev font-semibold text-link shadow-sm",
        )}
      >
        中
      </button>
      <button
        type="button"
        onClick={() => go("en")}
        className={cn(
          "flex-1 rounded-sm px-2 py-1 text-ink-500 transition-colors duration-fast",
          locale === "en" && "bg-bg-elev font-semibold text-link shadow-sm",
        )}
      >
        EN
      </button>
    </div>
  );
}
