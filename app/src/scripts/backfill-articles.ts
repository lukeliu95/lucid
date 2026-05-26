/**
 * backfill-articles.ts — 方案 A:基于库内已有素材,把每条视频的 explainer_deep
 * 重写成统一 ~1000 字(中)/ ~600-800 词(英)的导读文章,5 分钟读完。
 *
 * 不重新抓字幕 —— 输入 = 已有 summary + explainer_deep/quick + keypoints + timeline。
 * 覆盖写回 videos_ai.explainer_deep_zh / explainer_deep_en。
 *
 * 运行:
 *   DOTENV_CONFIG_PATH=.env.local tsx --conditions=react-server src/scripts/backfill-articles.ts
 * 可选环境:
 *   BACKFILL_LIMIT=5        只处理前 N 条(测试用)
 *   BACKFILL_SLUG=xxx       只处理指定 slug
 *   BACKFILL_MIN_ZH=1000    已 >= 该字数则跳过(默认 0 = 全部重写)
 */
import "dotenv/config";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import { chatJSON } from "@/lib/ai/deepseek";

type Out = { explainer_deep_zh: string; explainer_deep_en: string };

const SYSTEM = `你是明读的资深内容编辑。基于给定的"已有素材"(标题/人物/一句话总结/已有解读/要点/时间线),
重写一篇高质量导读文章,中英双语。这是给读者在看视频前后用的"速读全文"。
约束:
- 中文 1000-1200 字(务必不少于 1000 字);英文 600-800 词,信息量与中文等价(非逐字翻译)
- 5 分钟内读完,读完对这期视频有整体了解
- 分 3-5 段,段间用 \\n\\n 分隔;结构:是谁/什么场合 → 核心主张与背景 → 关键论据/案例 → 反方或局限 → 收束
- 大白话,不堆术语,不照搬原话,不空洞客套("本视频探讨了……"这种开头禁用)
- 只基于提供的素材,不编造素材里没有的具体数据/人名/事件
- 输出 JSON: {"explainer_deep_zh":"...","explainer_deep_en":"..."}`;

function buildUser(v: any, ai: any): string {
  const kp = (ai.keypoints_zh || []).map((k: any) => `- ${k.text ?? k}`).join("\n");
  const tl = (ai.timeline_zh || []).map((t: any) => `- ${t.label ?? t.title ?? ""}`).join("\n");
  return [
    `标题(中): ${v.title_zh}`,
    `标题(英): ${v.title_en}`,
    `人物: ${v.person_name ?? ""}`,
    `一句话总结(中): ${ai.summary_zh ?? ""}`,
    `一句话总结(英): ${ai.summary_en ?? ""}`,
    `已有深度解读(中,可能偏短,需扩写并润色):\n${ai.explainer_deep_zh ?? ai.explainer_quick_zh ?? ""}`,
    `已有深度解读(英):\n${ai.explainer_deep_en ?? ai.explainer_quick_en ?? ""}`,
    kp ? `核心要点:\n${kp}` : "",
    tl ? `时间线小标题:\n${tl}` : "",
    `\n现在重写成符合约束的导读文章,输出 JSON。`,
  ].filter(Boolean).join("\n");
}

async function main() {
  const limit = Number(process.env.BACKFILL_LIMIT || 0);
  const onlySlug = process.env.BACKFILL_SLUG || "";
  const minZh = Number(process.env.BACKFILL_MIN_ZH || 0);

  const rows = await db.query.videos.findMany({
    with: { ai: true, person: true },
  });
  let targets = rows.filter((v: any) => v.ai && v.ai_status === "ai_done");
  if (onlySlug) targets = targets.filter((v: any) => v.slug === onlySlug);
  if (minZh > 0) targets = targets.filter((v: any) => (v.ai.explainer_deep_zh?.length ?? 0) < minZh);
  if (limit > 0) targets = targets.slice(0, limit);

  console.log(`[backfill] ${targets.length} 条待处理`);
  let ok = 0, fail = 0;
  for (const v of targets as any[]) {
    const ai = v.ai;
    v.person_name = v.person?.name_zh;
    try {
      const out = await chatJSON<Out>({
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: buildUser(v, ai) },
        ],
        temperature: 0.6,
        max_tokens: 6000,
      });
      if (!out.explainer_deep_zh || out.explainer_deep_zh.length < 600) {
        throw new Error(`输出过短 zh=${out.explainer_deep_zh?.length ?? 0}`);
      }
      await db.update(schema.videos_ai)
        .set({
          explainer_deep_zh: out.explainer_deep_zh,
          explainer_deep_en: out.explainer_deep_en,
          generated_at: new Date(),
        })
        .where(eq(schema.videos_ai.video_id, v.id));
      ok++;
      console.log(`  ✓ ${v.slug} · zh ${out.explainer_deep_zh.length} 字 / en ${out.explainer_deep_en?.length ?? 0} 字符`);
    } catch (e) {
      fail++;
      console.log(`  ✗ ${v.slug} · ${String(e).slice(0, 120)}`);
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  console.log(`[backfill] 完成 · ok=${ok} fail=${fail}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
