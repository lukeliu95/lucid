import { VideoCard } from "./video-card";
import type { VideoCard as VideoCardType, Locale } from "@/lib/types";

export function VideoGrid({ videos, locale }: { videos: VideoCardType[]; locale: Locale }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {videos.map((v) => (
        <VideoCard key={v.slug} video={v} locale={locale} />
      ))}
    </div>
  );
}
