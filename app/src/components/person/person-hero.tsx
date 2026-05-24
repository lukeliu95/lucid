import type { PersonDetail, Locale } from "@/lib/types";
import { localized } from "@/lib/utils";

export function PersonHero({ person, locale }: { person: PersonDetail; locale: Locale }) {
  return (
    <section className="grid grid-cols-1 gap-12 py-16 md:grid-cols-[240px_1fr]">
      <div className="h-[200px] w-[200px] rounded-lg border border-border-default bg-gradient-to-br from-paper-300 to-paper-400" />
      <div>
        <h1 className="text-7xl font-bold tracking-tight text-ink-950">
          {localized(person, "name", locale)}
        </h1>
        <p className="mt-2 font-sans text-sm text-text-muted">
          {localized(person, "title", locale)}
        </p>
        <p className="mt-6 max-w-content text-md leading-relaxed text-ink-900">
          {localized(person, "bio", locale)}
        </p>
      </div>
    </section>
  );
}
