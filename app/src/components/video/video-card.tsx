import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Card, CardBody, CardCover, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { VideoCard as VideoCardType, Locale } from "@/lib/types";
import { formatDuration, localized } from "@/lib/utils";

export async function VideoCard({ video, locale }: { video: VideoCardType; locale: Locale }) {
  const title = localized(video, "title", locale);
  const tr = await getTranslations();
  return (
    <Link href={`/videos/${video.slug}`} className="block">
      <Card>
        <div className="relative">
          <CardCover src={video.cover_url || undefined} alt={title} />
          {video.is_draft && (
            <span className="absolute left-2 top-2 rounded bg-ink-900/85 px-2 py-0.5 font-sans text-xs font-medium text-paper-50">
              {tr("video.coming_soon")}
            </span>
          )}
        </div>
        <CardBody>
          <CardTitle className="min-h-[50px]">{title}</CardTitle>
          <div className="mt-2 flex flex-wrap items-center gap-2 font-sans text-sm text-text-muted">
            <span>{localized(video.person, "name", locale)}</span>
            <span aria-hidden>·</span>
            <span>{formatDuration(video.duration_sec)}</span>
            {video.topics.slice(0, 1).map((tp) => (
              <Badge key={tp.slug}>{localized(tp, "name", locale)}</Badge>
            ))}
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
