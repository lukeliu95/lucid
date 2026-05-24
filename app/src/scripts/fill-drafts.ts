/**
 * fill-drafts.ts — 给 mock-data.ts 里 fake / draft platform_id 的视频找真实 YouTube 候选。
 *
 * Draft detection: platform_id 不是 11 字符合法 YouTube ID。
 *
 *   npx tsx src/scripts/fill-drafts.ts --dry-run
 *   npx tsx src/scripts/fill-drafts.ts --apply [--overrides src/scripts/fill-drafts.overrides.json]
 *
 * --apply 行为受 USE_MOCK_API 控制:
 *   true  → 直接改 mock-data.ts(改 platform_id / cover_url / title_en / duration_sec / published_at),
 *           写前备份 mock-data.ts.bak-{ts}。
 *   false → 调用 POST /api/admin/videos url-only payload(需要 dev server + ADMIN_USER_IDS=*)
 *
 * overrides.json shape: { "<draft-slug>": "<chosen videoId>", ... }
 */
import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { parseArgs } from "node:util";

// Load .env.local manually if present (Next.js convention)
function loadEnvLocal(): void {
  const envLocal = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envLocal)) return;
  const text = fs.readFileSync(envLocal, "utf-8");
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnvLocal();

import { searchVideos, fetchVideoMetadata, thumbnailUrl, getQuotaUsedThisProcess } from "@/lib/youtube/data-api";

const MOCK_DATA_PATH = path.resolve(process.cwd(), "src/lib/mock-data.ts");
const VALID_YT_ID = /^[A-Za-z0-9_-]{11}$/;

type Seed = {
  slug: string;
  title_zh: string;
  title_en: string;
  person_slug: string;
  platform_id: string;
};

/**
 * Light-weight parser for the `videoSeeds` array literal in mock-data.ts.
 * We rely on the existing one-line-per-seed format. Falls back to skipping
 * unparseable lines (and warns).
 */
function parseSeeds(text: string): Seed[] {
  const start = text.indexOf("const videoSeeds: VideoSeed[] = [");
  if (start < 0) throw new Error("Could not locate videoSeeds in mock-data.ts");
  const end = text.indexOf("];", start);
  const block = text.slice(start, end);
  const out: Seed[] = [];
  const objRe = /\{\s*slug:\s*"([^"]+)"[^}]*?title_zh:\s*"([^"]+)"[^}]*?title_en:\s*"([^"]+)"[^}]*?person_slug:\s*"([^"]+)"[^}]*?platform_id:\s*"([^"]+)"\s*\}/g;
  let m: RegExpExecArray | null;
  while ((m = objRe.exec(block)) !== null) {
    out.push({ slug: m[1], title_zh: m[2], title_en: m[3], person_slug: m[4], platform_id: m[5] });
  }
  return out;
}

function isDraft(seed: Seed): boolean {
  return !VALID_YT_ID.test(seed.platform_id);
}

function buildQuery(seed: Seed): string {
  // Prefer English title (YouTube search works better in English for these creators).
  return seed.title_en;
}

type CandidateRow = {
  draft_slug: string;
  draft_platform_id: string;
  person_slug: string;
  query: string;
  candidates: Array<{ videoId: string; title: string; channel: string; publishedAt: string }>;
};

async function findCandidates(seeds: Seed[], maxPerSeed: number): Promise<CandidateRow[]> {
  const rows: CandidateRow[] = [];
  for (const seed of seeds) {
    const query = buildQuery(seed);
    let candidates: CandidateRow["candidates"] = [];
    try {
      const results = await searchVideos(query, { maxResults: maxPerSeed, type: "video", order: "relevance" });
      candidates = results.map((r) => ({
        videoId: r.videoId,
        title: r.title,
        channel: r.channelTitle,
        publishedAt: r.publishedAt,
      }));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`[fill-drafts] search failed for ${seed.slug}: ${(e as Error).message}`);
      break; // likely quota; stop further calls
    }
    rows.push({
      draft_slug: seed.slug,
      draft_platform_id: seed.platform_id,
      person_slug: seed.person_slug,
      query,
      candidates,
    });
  }
  return rows;
}

function printDryRun(rows: CandidateRow[]): void {
  // eslint-disable-next-line no-console
  console.log("\n=== fill-drafts · DRY RUN ===\n");
  for (const r of rows) {
    // eslint-disable-next-line no-console
    console.log(`[${r.draft_slug}]  (current platform_id=${r.draft_platform_id} · person=${r.person_slug})`);
    // eslint-disable-next-line no-console
    console.log(`  query: "${r.query}"`);
    if (r.candidates.length === 0) {
      // eslint-disable-next-line no-console
      console.log("  (no candidates)");
    } else {
      r.candidates.forEach((c, i) => {
        // eslint-disable-next-line no-console
        console.log(`  #${i + 1}  ${c.videoId}  ${c.title.slice(0, 70)}  · ${c.channel} · ${c.publishedAt.slice(0, 10)}`);
      });
    }
    // eslint-disable-next-line no-console
    console.log("");
  }
}

type OverrideMap = Record<string, string>;

function loadOverrides(p: string | undefined): OverrideMap {
  if (!p) return {};
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, "utf-8")) as OverrideMap;
}

async function applyToMockData(rows: CandidateRow[], overrides: OverrideMap): Promise<{ applied: number; skipped: number; backup: string }> {
  const original = fs.readFileSync(MOCK_DATA_PATH, "utf-8");
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = `${MOCK_DATA_PATH}.bak-${ts}`;
  fs.writeFileSync(backup, original, "utf-8");

  let text = original;
  let applied = 0;
  let skipped = 0;

  const overridesOnly = Object.keys(overrides).length > 0;
  for (const row of rows) {
    const chosen = overrides[row.draft_slug] ?? (overridesOnly ? undefined : row.candidates[0]?.videoId);
    if (!chosen || !VALID_YT_ID.test(chosen)) {
      skipped++;
      continue;
    }
    // fetch full metadata for chosen
    const meta = await fetchVideoMetadata(chosen);
    if (!meta) {
      skipped++;
      continue;
    }
    // Replace the platform_id in the seed line. We anchor on the seed's slug.
    const escSlug = row.draft_slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const seedRe = new RegExp(
      `(\\{\\s*slug:\\s*"${escSlug}"[\\s\\S]*?platform_id:\\s*")([^"]+)(")`,
      "g",
    );
    let mutated = false;
    text = text.replace(seedRe, (_full, p1: string, _id: string, p3: string) => {
      mutated = true;
      return `${p1}${chosen}${p3}`;
    });
    // duration_sec & title_en update on same seed
    const durRe = new RegExp(
      `(\\{\\s*slug:\\s*"${escSlug}"[\\s\\S]*?duration_sec:\\s*)(\\d+)`,
      "g",
    );
    text = text.replace(durRe, (_full, p1: string, _n: string) => `${p1}${meta.durationSec}`);
    const titleEnRe = new RegExp(
      `(\\{\\s*slug:\\s*"${escSlug}"[\\s\\S]*?title_en:\\s*")([^"]+)(")`,
      "g",
    );
    text = text.replace(titleEnRe, (_full, p1: string, _t: string, p3: string) => {
      // escape any embedded double-quotes (rare in YT titles)
      const safe = meta.title.replace(/"/g, '\\"');
      return `${p1}${safe}${p3}`;
    });
    if (mutated) applied++;
    else skipped++;
  }

  fs.writeFileSync(MOCK_DATA_PATH, text, "utf-8");
  // eslint-disable-next-line no-console
  console.log(`[fill-drafts] thumbnails will resolve to: https://i.ytimg.com/vi/<id>/maxresdefault.jpg (already wired via videoCards.cover_url)`);
  return { applied, skipped, backup };
}

async function applyViaAdminApi(rows: CandidateRow[], overrides: OverrideMap): Promise<{ applied: number; skipped: number }> {
  const base = process.env.ADMIN_API_BASE ?? "http://localhost:3000";
  const adminUserId = process.env.ADMIN_USER_ID ?? "*";
  let applied = 0;
  let skipped = 0;
  for (const row of rows) {
    const chosen = overrides[row.draft_slug] ?? row.candidates[0]?.videoId;
    if (!chosen) { skipped++; continue; }
    const res = await fetch(`${base}/api/admin/videos`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": adminUserId },
      body: JSON.stringify({
        url: `https://www.youtube.com/watch?v=${chosen}`,
        person_slug: row.person_slug,
      }),
    });
    if (res.ok) applied++;
    else {
      const txt = await res.text().catch(() => "");
      // eslint-disable-next-line no-console
      console.warn(`[fill-drafts] POST failed for ${row.draft_slug}: ${res.status} ${txt.slice(0, 120)}`);
      skipped++;
    }
  }
  return { applied, skipped };
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
      apply: { type: "boolean", default: false },
      overrides: { type: "string" },
      "max-per-seed": { type: "string", default: "3" },
    },
  });
  if (!values["dry-run"] && !values.apply) {
    // eslint-disable-next-line no-console
    console.error("Usage: tsx src/scripts/fill-drafts.ts --dry-run | --apply [--overrides path.json]");
    process.exit(2);
  }
  if (!process.env.YOUTUBE_API_KEY) {
    // eslint-disable-next-line no-console
    console.error("[fill-drafts] YOUTUBE_API_KEY not set in env (.env.local)");
    process.exit(2);
  }

  const text = fs.readFileSync(MOCK_DATA_PATH, "utf-8");
  const seeds = parseSeeds(text);
  const drafts = seeds.filter(isDraft);
  // eslint-disable-next-line no-console
  console.log(`[fill-drafts] total=${seeds.length} drafts=${drafts.length}`);

  // OPT: in --apply mode with overrides, skip search for override slugs (saves 100 quota / slug)
  const preOverrides = values.apply ? loadOverrides(values.overrides) : {};
  const draftsToSearch = drafts.filter((d) => !(d.slug in preOverrides));
  const stubbedRows: CandidateRow[] = drafts
    .filter((d) => d.slug in preOverrides)
    .map((d) => ({
      draft_slug: d.slug,
      draft_platform_id: d.platform_id,
      person_slug: d.person_slug,
      query: `(override: ${preOverrides[d.slug]})`,
      candidates: [{ videoId: preOverrides[d.slug], title: "(override)", channel: "(override)", publishedAt: "" }],
    }));
  const searchedRows = await findCandidates(draftsToSearch, parseInt(values["max-per-seed"] ?? "3", 10));
  const rows = [...stubbedRows, ...searchedRows];
  const matched = rows.filter((r) => r.candidates.length > 0).length;
  const noMatch = rows.length - matched;

  if (values["dry-run"]) {
    printDryRun(rows);
    // eslint-disable-next-line no-console
    console.log(`\n[fill-drafts] summary: drafts=${drafts.length} candidates_found=${matched} no_match=${noMatch} · quota_used=${getQuotaUsedThisProcess()}\n`);
    return;
  }

  const overrides = loadOverrides(values.overrides);
  const useMock = (process.env.USE_MOCK_API ?? "").toLowerCase() !== "false";
  if (useMock) {
    const r = await applyToMockData(rows, overrides);
    // eslint-disable-next-line no-console
    console.log(`[fill-drafts] APPLY mode=mock-data · applied=${r.applied} skipped=${r.skipped} backup=${r.backup} quota=${getQuotaUsedThisProcess()}`);
  } else {
    const r = await applyViaAdminApi(rows, overrides);
    // eslint-disable-next-line no-console
    console.log(`[fill-drafts] APPLY mode=admin-api · applied=${r.applied} skipped=${r.skipped} quota=${getQuotaUsedThisProcess()}`);
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
