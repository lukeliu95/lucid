import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export async function Footer() {
  const t = await getTranslations();
  return (
    <footer className="mt-24 border-t border-border-default bg-bg-subtle py-16">
      <div className="mx-auto flex max-w-container flex-col gap-4 px-16">
        <p className="font-serif italic text-ink-700">{t("footer.tagline")}</p>
        <div className="flex flex-wrap gap-4 font-sans text-sm">
          <Link href="/topics/ai" className="text-link hover:text-link-hover">AI</Link>
          <Link href="/topics/ai-agent" className="text-link hover:text-link-hover">AI Agent</Link>
          <Link href="/topics/startup" className="text-link hover:text-link-hover">{t("topic.slug.startup")}</Link>
          <Link href="/topics/chip" className="text-link hover:text-link-hover">{t("topic.slug.chip")}</Link>
          <Link href="/topics/future-of-work" className="text-link hover:text-link-hover">{t("topic.slug.future-of-work")}</Link>
          <span className="text-text-muted">·</span>
          <Link href="/changelog" className="text-link hover:text-link-hover">{t("footer.changelog")}</Link>
          <Link href="/" className="text-link hover:text-link-hover">{t("footer.about")}</Link>
          <Link href="/" className="text-link hover:text-link-hover">{t("footer.privacy")}</Link>
          <Link href="/" className="text-link hover:text-link-hover">{t("footer.terms")}</Link>
        </div>
        <p className="font-sans text-sm text-text-muted">
          {t("footer.copyright")} ·{" "}
          <a
            href="https://x.com/simprr"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Simprr on X (opens in new tab)"
            className="text-link hover:text-link-hover"
          >
            {t("footer.author_link")}
          </a>
        </p>
      </div>
    </footer>
  );
}
