import { VideoCard } from "./video-card";
import type { VideoCard as VideoCardType, Locale } from "@/lib/types";

export function VideoGrid({ videos, locale }: { videos: VideoCardType[]; locale: Locale }) {
  return (
    <ul
      role="list"
      className="grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2 lg:grid-cols-4"
    >
      {videos.map((v) => (
        <li key={v.slug}>
          <VideoCard video={v} locale={locale} />
        </li>
      ))}
    </ul>
  );
}
