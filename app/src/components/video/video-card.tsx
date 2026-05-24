import { Link } from "@/i18n/routing";
import { Card, CardBody, CardCover, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { VideoCard as VideoCardType, Locale } from "@/lib/types";
import { formatDuration, localized } from "@/lib/utils";

export function VideoCard({ video, locale }: { video: VideoCardType; locale: Locale }) {
  const title = localized(video, "title", locale);
  return (
    <Link href={`/videos/${video.slug}`} className="block">
      <Card>
        <CardCover />
        <CardBody>
          <CardTitle className="min-h-[50px]">{title}</CardTitle>
          <div className="mt-2 flex flex-wrap items-center gap-2 font-sans text-sm text-text-muted">
            <span>{localized(video.person, "name", locale)}</span>
            <span aria-hidden>·</span>
            <span>{formatDuration(video.duration_sec)}</span>
            {video.topics.slice(0, 1).map((t) => (
              <Badge key={t.slug}>{localized(t, "name", locale)}</Badge>
            ))}
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
