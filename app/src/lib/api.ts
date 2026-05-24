// API wrapper · defaults to mock data (Phase B.1). Phase B.2 大刘 接入真 API 后切到 fetch.
import {
  videoCards,
  videoDetails,
  people,
  topicDetails,
  topics,
  searchMock,
  heroVideo,
} from "./mock-data";
import type {
  VideoCard,
  VideoDetail,
  PersonDetail,
  TopicDetail,
  SearchResults,
  Topic,
} from "./types";

export async function getLatestVideos(): Promise<VideoCard[]> {
  return videoCards;
}

export async function getHero(): Promise<VideoDetail> {
  return heroVideo;
}

export async function getTopics(): Promise<Topic[]> {
  return topics;
}

export async function getVideo(slug: string): Promise<VideoDetail | null> {
  return videoDetails.find((v) => v.slug === slug) ?? null;
}

export async function getPerson(slug: string): Promise<PersonDetail | null> {
  return people.find((p) => p.slug === slug) ?? null;
}

export async function getAllPeople(): Promise<PersonDetail[]> {
  return people;
}

export async function getTopic(slug: string): Promise<TopicDetail | null> {
  return topicDetails.find((t) => t.slug === slug) ?? null;
}

export async function search(q: string, mode: "keyword" | "semantic" = "keyword"): Promise<SearchResults> {
  return searchMock(q, mode);
}
