import { getTranslations } from "next-intl/server";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
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

        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="inline-flex h-8 items-center rounded-full border border-border-default bg-bg-subtle px-4 font-sans text-sm text-ink-700 transition-colors hover:text-link">
              {t("nav.login")}
            </button>
          </SignInButton>
        </Show>

        <Show when="signed-in">
          <Link
            href="/me"
            className="font-sans text-sm text-ink-700 hover:text-link"
          >
            {t("nav.my_favorites")}
          </Link>
          <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
        </Show>
      </div>
    </header>
  );
}
