/**
 * Rewrite the "速读 / Quick read" content (summary + explainer) with DeepSeek
 * into plain, human language a high-schooler can follow — key points, minimal
 * jargon, light analogies. Bilingual (zh + en).
 *
 * Targets real videos only (valid 11-char YouTube id). Reads title / person /
 * topics as grounding, writes videos_ai.{summary_*, explainer_quick_*}.
 *
 * Run: DATABASE_URL=... DEEPSEEK_API_KEY=... npx tsx src/db/enrich-explainers.ts
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

const dbUrl = process.env.DATABASE_URL;
const dsKey = process.env.DEEPSEEK_API_KEY;
if (!dbUrl || !dsKey) {
  console.error("[enrich] need DATABASE_URL and DEEPSEEK_API_KEY");
  process.exit(1);
}
const db = drizzle(neon(dbUrl), { schema });
const VALID_YT_ID = /^[A-Za-z0-9_-]{11}$/;

const SYS = `你是「明读」的内容编辑。把一期访谈/演讲改写成"速读"。
要求:
- 面向普通高中生,大白话,抓住重点。
- 尽量不用技术黑话;非用不可时,用一个生活化类比解释。
- 不编造具体数字/引语,只讲这期大致在聊什么、为什么重要。
严格输出 JSON,字段:
{
 "summary_zh": "一句话(40字内)讲清这期在聊什么",
 "summary_en": "one plain sentence (<25 words)",
 "explainer_quick_zh": "2~3个短段落,段落间用\\n\\n分隔,高中生能懂,含1个类比",
 "explainer_quick_en": "2-3 short paragraphs separated by \\n\\n, plain English, with one analogy"
}`;

async function deepseek(userPrompt: string): Promise<Record<string, string>> {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${dsKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYS },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1200,
    }),
  });
  if (!res.ok) throw new Error(`deepseek ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

async function main() {
  const rows = (await db.query.videos.findMany({
    with: { person: true, topics: { with: { topic: true } }, ai: true },
  })) as unknown as Array<{
    id: number;
    slug: string;
    platform_id: string;
    title_zh: string;
    title_en: string;
    person: { name_zh: string; name_en: string };
    topics: { topic: { name_zh: string } }[];
    ai: unknown | null;
  }>;

  const targets = rows.filter(
    (v) => VALID_YT_ID.test(v.platform_id) && v.platform_id !== "abcdEF12345" && v.ai,
  );
  console.log(`[enrich] ${targets.length} real videos to rewrite`);

  let ok = 0;
  for (const v of targets) {
    const topicStr = v.topics.map((t) => t.topic.name_zh).join("、");
    const prompt = `视频标题(中):${v.title_zh}
视频标题(英):${v.title_en}
主讲人:${v.person.name_zh} / ${v.person.name_en}
主题:${topicStr}
请据此写"速读"。`;
    try {
      const out = await deepseek(prompt);
      await db
        .update(schema.videos_ai)
        .set({
          summary_zh: out.summary_zh,
          summary_en: out.summary_en,
          explainer_quick_zh: out.explainer_quick_zh,
          explainer_quick_en: out.explainer_quick_en,
          model: "deepseek-chat:plain-rewrite",
        })
        .where(eq(schema.videos_ai.video_id, v.id));
      ok++;
      console.log(`  ✓ ${v.slug} — ${out.summary_zh?.slice(0, 30)}…`);
    } catch (e) {
      console.error(`  ✗ ${v.slug}: ${(e as Error).message}`);
    }
  }
  console.log(`[enrich] done · ${ok}/${targets.length} updated`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[enrich] failed:", e);
    process.exit(1);
  });
