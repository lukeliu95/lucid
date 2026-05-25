/**
 * fetch-avatars.ts — 给 mock-data.ts 里的 person.avatar_url 找真实 YouTube channel 头像。
 *
 *   npx tsx src/scripts/fetch-avatars.ts --dry-run
 *   npx tsx src/scripts/fetch-avatars.ts --apply
 *
 * 流程:对每个 person,searchVideos(person.name_en, type=channel, maxResults=1) → 拿到 channelId →
 * fetchChannelMetadata(channelId) → thumbnails.high.url 作为 avatar_url。
 *
 * 注意:search.list 每次消耗 100 quota,channels.list 每次 1 quota。10 人 × (100+1) ≈ 1010 units。
 */
import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { parseArgs } from "node:util";

function loadEnvLocal(): void {
  const envLocal = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envLocal)) return;
  const text = fs.readFileSync(envLocal, "utf-8");
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = val;
  }
}
loadEnvLocal();

import { searchVideos, fetchChannelMetadata, getQuotaUsedThisProcess } from "@/lib/youtube/data-api";

const MOCK_DATA_PATH = path.resolve(process.cwd(), "src/lib/mock-data.ts");

type Person = { slug: string; name_zh: string; name_en: string };

function parsePeople(text: string): Person[] {
  const start = text.indexOf("const peopleSeed:");
  if (start < 0) throw new Error("Could not locate peopleSeed");
  const end = text.indexOf("\n];", start);
  const block = text.slice(start, end);
  const out: Person[] = [];
  const re = /\{\s*slug:\s*"([^"]+)"[\s\S]*?name_zh:\s*"([^"]+)"[\s\S]*?name_en:\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    out.push({ slug: m[1], name_zh: m[2], name_en: m[3] });
  }
  return out;
}

type Resolved = {
  slug: string;
  name_en: string;
  channelId: string | null;
  channelTitle: string | null;
  avatar_url: string | null;
};

async function resolveAvatars(people: Person[]): Promise<Resolved[]> {
  const out: Resolved[] = [];
  for (const p of people) {
    try {
      const search = await searchVideos(p.name_en, { maxResults: 1, type: "channel" });
      const first = search[0];
      if (!first) {
        out.push({ slug: p.slug, name_en: p.name_en, channelId: null, channelTitle: null, avatar_url: null });
        continue;
      }
      // For channel-type search, the API returns channelId in `id.channelId`; our wrapper
      // packs that into `videoId` (since either field is the only id present).
      const channelId = first.videoId;
      const channel = await fetchChannelMetadata(channelId);
      out.push({
        slug: p.slug,
        name_en: p.name_en,
        channelId,
        channelTitle: channel?.title ?? first.channelTitle ?? null,
        avatar_url: channel?.thumbnails.high?.url ?? channel?.thumbnails.medium?.url ?? channel?.thumbnails.default?.url ?? null,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`[fetch-avatars] failed for ${p.slug}: ${(e as Error).message}`);
      break;
    }
  }
  return out;
}

function printDryRun(rows: Resolved[]): void {
  // eslint-disable-next-line no-console
  console.log("\n=== fetch-avatars · DRY RUN ===\n");
  for (const r of rows) {
    if (r.avatar_url) {
      // eslint-disable-next-line no-console
      console.log(`[${r.slug}] (${r.name_en}) → channel="${r.channelTitle}" id=${r.channelId}`);
      // eslint-disable-next-line no-console
      console.log(`  avatar: ${r.avatar_url}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`[${r.slug}] (${r.name_en}) → NO MATCH`);
    }
  }
}

async function applyToMockData(rows: Resolved[]): Promise<{ applied: number; skipped: number; backup: string }> {
  const original = fs.readFileSync(MOCK_DATA_PATH, "utf-8");
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = `${MOCK_DATA_PATH}.bak-${ts}`;
  fs.writeFileSync(backup, original, "utf-8");

  let text = original;
  let applied = 0;
  let skipped = 0;
  for (const r of rows) {
    if (!r.avatar_url) { skipped++; continue; }
    // person avatar_url currently set to "" in the people = peopleSeed.map(...) block.
    // We inject avatar by replacing `avatar_url: ""` ONLY when bound to this slug.
    // Since people are built dynamically (no static avatar_url field per seed),
    // we instead append an avatar override map at the bottom of the file's people array
    // by rewriting the `avatar_url: ""` line inside people.map → match person.slug.
    // Simpler approach: replace the generic `avatar_url: ""` line by switching on slug.
    // To keep edits minimal, we mutate the `peopleSeed` entries to include avatar_url
    // and patch the people.map block to use p.avatar_url instead of "".
    //
    // Implementation: insert/update `avatar_url: "<url>",` right after the matching slug line in peopleSeed.
    const escSlug = r.slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(\\{\\s*slug:\\s*"${escSlug}",\\s*\\n)`, "g");
    let inserted = false;
    text = text.replace(re, (full, p1: string) => {
      if (inserted) return full;
      inserted = true;
      const indent = p1.match(/\n(\s*)/)?.[1] ?? "    ";
      return `${p1}${indent}avatar_url: "${r.avatar_url}",\n`;
    });
    if (inserted) applied++;
    else skipped++;
  }

  // Switch the generic literal `avatar_url: ""` in the people-build block to use seed value.
  // (Only the first occurrence in people.map.)
  text = text.replace(
    /avatar_url:\s*""\s*,/,
    `avatar_url: (p as unknown as { avatar_url?: string }).avatar_url ?? "",`,
  );

  fs.writeFileSync(MOCK_DATA_PATH, text, "utf-8");
  return { applied, skipped, backup };
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
      apply: { type: "boolean", default: false },
    },
  });
  if (!values["dry-run"] && !values.apply) {
    // eslint-disable-next-line no-console
    console.error("Usage: tsx src/scripts/fetch-avatars.ts --dry-run | --apply");
    process.exit(2);
  }
  if (!process.env.YOUTUBE_API_KEY) {
    // eslint-disable-next-line no-console
    console.error("[fetch-avatars] YOUTUBE_API_KEY not set in env (.env.local)");
    process.exit(2);
  }

  const text = fs.readFileSync(MOCK_DATA_PATH, "utf-8");
  const people = parsePeople(text);
  // eslint-disable-next-line no-console
  console.log(`[fetch-avatars] persons_total=${people.length}`);

  const resolved = await resolveAvatars(people);
  const matched = resolved.filter((r) => r.avatar_url).length;
  const noMatch = resolved.length - matched;

  if (values["dry-run"]) {
    printDryRun(resolved);
    // eslint-disable-next-line no-console
    console.log(`\n[fetch-avatars] summary: matched=${matched} no_match=${noMatch} · quota_used=${getQuotaUsedThisProcess()}\n`);
    return;
  }

  const r = await applyToMockData(resolved);
  // eslint-disable-next-line no-console
  console.log(`[fetch-avatars] APPLY · applied=${r.applied} skipped=${r.skipped} backup=${r.backup} quota=${getQuotaUsedThisProcess()}`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
