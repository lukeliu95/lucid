import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { LangSwitcher } from "./lang-switcher";
import { Logo } from "./logo";
import { SearchBarLauncher } from "@/components/search/search-bar";

export async function Header() {
  const t = await getTranslations();
  return (
    <header className="sticky top-0 z-header h-16 border-b border-border-default bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-full max-w-container items-center gap-6 px-16">
        <Link href="/" aria-label={t("common.brand_name")} className="shrink-0">
          <Logo />
        </Link>
        <SearchBarLauncher />
        <Link href="/" className="font-sans text-sm text-ink-700 hover:text-link">
          {t("nav.topics")} ▾
        </Link>
        <LangSwitcher />
        <Link
          href="/favorites"
          aria-label={t("nav.my_favorites")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-default bg-bg-subtle text-sm"
        >
          👤
        </Link>
      </div>
    </header>
  );
}
