# 09 · Demo 验收剧本

> 自动生成 · GEI v4.1.0 · 2026-05-24T15:14Z
> 数据源: skills-spec.md(10 skill type)+ llm-eval-suite/s1-s5-eval.md + requirements-spec.md
> 自动化类型: ✅ Non-UI 全自动(Desk Evaluation 模式)/ ⚠️ UI 半自动

## Non-UI Skills · 对话式走查

> hybrid project_type · 5 Agent/Hybrid skill 走 Tier B(eval-cases 完整 / 无 results) · 5 Script skill 走静态审计 Tier A 简化版。
> 所有 LLM 输出标 `[Desk Evaluation — 仅设计评估]` · Phase D 上线后真跑后回填实测数据。

### Scenario #1 · S1 summary-generator(REQ-V02)

- **对应需求 ID**: REQ-V02 · 一句话总结(双语)
- **触发**: pipeline 内调用(`pipeline.fanout` 时)
- **用户输入**: Sam Altman Lex #419 transcript 节选 + video_title="Sam Altman on GPT-5 & AGI · Lex Podcast #419"
- **Skill 回应**(预期):
  ```json
  {
    "summary_zh": "Sam Altman 在 Lex 第 419 期谈 GPT-5 训练规模、AGI 时间表与 OpenAI 内部张力,认为 2030 前 AGI 概率 > 50%。",
    "summary_en": "Sam Altman on Lex #419 discusses GPT-5 training scale, AGI timeline, internal OpenAI tensions; >50% AGI probability by 2030."
  }
  ```
- **实际通过率**: `[Desk Evaluation — 仅设计评估]` · 上线后 5 cases × 3 trials 跑真 key
- **Rubric 均分**: seeded · 5 case(C1 Sam Altman / C2 Karpathy LLM intro / C3 Naval How to Get Rich / C4 极短 transcript / C5 中英混合)

### Scenario #2 · S2 keypoints-extractor(REQ-V03 · 反 hallucination 重点)

- **对应需求 ID**: REQ-V03 · 核心观点 5-10 条
- **触发**: pipeline 内调用
- **用户输入**: Karpathy Intro LLM transcript_with_timestamps
- **Skill 回应**(预期 · 5-10 条双语 · `source_span` 锚点 ≤30 字):
  ```json
  {
    "keypoints_zh": [
      {"text": "LLM 训练分 pretraining 与 RLHF 两阶段", "timestamp_sec": 312, "source_span": "two phases: pretraining and reinforcement learning from human feedback"},
      "..."
    ],
    "keypoints_en": [...]
  }
  ```
- **关键校验**: `source_span` 字符串必须能在 transcript 找到(deterministic 校验)· 找不到丢该条
- **实际通过率**: `[Desk Evaluation — 仅设计评估]` · 反 hallucination case 重点(给一个不存在的论点,看 LLM 是否硬编)
- **Rubric 均分**: seeded · 5 case

### Scenario #3 · S3 timeline-builder(REQ-V04 · Hybrid)

- **对应需求 ID**: REQ-V04 · 时间轴 ≥5 节点
- **触发**: pipeline 内调用
- **用户输入**: SRT segments `[{start, end, text}]`(60 分钟视频 ~250 段)
- **Skill 回应**:
  - **Script 部分**: 按 ≥6min 滑窗 + 双换行/长停顿启发 → 5-12 段
  - **Agent 部分**: 每段调一次 DeepSeek 命名 + 一句摘要
- **预期输出**:
  ```json
  {
    "timeline_zh": [
      {"timestamp_sec": 0, "title": "开场 · 嘉宾介绍", "one_liner": "Lex 介绍 Sam Altman 及本期主题。"},
      {"timestamp_sec": 432, "title": "GPT-5 训练规模", "one_liner": "..."},
      "..."
    ],
    "timeline_en": [...]
  }
  ```
- **实际通过率**: `[Desk Evaluation — 仅设计评估]`
- **Rubric 均分**: seeded · 5 case(段数 5-12 / 段名质量 / 时间戳准确率)

### Scenario #4 · S4 two-tier-explainer(REQ-V05 · 反 padding 重点)

- **对应需求 ID**: REQ-V05 · 2 档解释
- **用户输入**: transcript + summary_zh + summary_en
- **Skill 回应**(单次调用 JSON 模式 · 4 字段):
  ```json
  {
    "explainer_quick_zh": "(200-300 字 · 成人速懂版)",
    "explainer_quick_en": "(250-400 chars)",
    "explainer_deep_zh": "(800-1500 字 · 深度版 · 加上下文 / 类比 / 影响)",
    "explainer_deep_en": "(1000-2000 chars)"
  }
  ```
- **关键校验**: 字数严格控制(deterministic)+ 双档差异化(quick 与 deep 不能内容雷同)
- **实际通过率**: `[Desk Evaluation — 仅设计评估]` · 反 padding 重点(简单档不要堆词)
- **Rubric 均分**: seeded · 5 case

### Scenario #5 · S5 person-aggregator(REQ-P02 · 反混淆重点)

- **对应需求 ID**: REQ-P02 · 人物代表观点 3-5 条
- **触发**: 新视频 `ai_done` 后异步对该 person 重算
- **用户输入**: SELECT 该 person 所有视频的 keypoints + summary
- **Skill 回应**:
  ```json
  {
    "signature_views_zh": [
      {"view": "AGI 的真正瓶颈是计算与能源,而非算法", "source_video_slugs": ["sam-altman-lex-419", "..."]},
      "..."
    ],
    "signature_views_en": [...]
  }
  ```
- **关键校验**: 不得把嘉宾 A 的观点算到嘉宾 B 头上(`source_video_slugs` 必须真属于该 person)
- **实际通过率**: `[Desk Evaluation — 仅设计评估]` · 反混淆重点
- **Rubric 均分**: seeded · 5 case

### Scenario #6 · S6/S10 video-crud / favorite-crud(REQ-X01 / U02)

- **触发**: `POST /api/admin/videos` / `POST /api/favorites`
- **静态审计 ✅ PASS**:
  - POST/GET 一致性(Drizzle insert + select 对账)
  - 401(未登录)/ 409(platform_id 重复 · video)/ 200 幂等(favorites UNIQUE 冲突)
  - Clerk auth gate(W5 现 stub `x-user-id` · D6 接 `auth()`)

### Scenario #7 · S7 semantic-search(REQ-S02 · Hybrid + W6 rate-limit)

- **触发**: `GET /api/search?q=AI+Agent&mode=semantic`
- **静态审计 ✅ PASS**:
  - OpenAI embedding(1536d)→ pgvector `<=>` cosine top-5
  - 5xx 时降级 keyword(`X-Search-Fallback: keyword`)
  - W6 rate-limit 30/60s/IP(防 OpenAI 账单飙升)

### Scenario #8 · S8 keyword-search(REQ-S01 · 双语自动检测)

- **触发**: `GET /api/search?q=AGI&mode=keyword`
- **静态审计 ✅ PASS**:
  - CJK 字符检测自动走中文路径(ILIKE on title_zh + summary_zh + keypoints_zh::text · trigram 索引)
  - 英文路径走 `to_tsquery('english', q)` on tsv_en
  - top-20 视频 + 命中人物 + 命中主题

### Scenario #9 · S9 ai-pipeline-orchestrator(编排 · 状态机)

- **触发**: `npx tsx src/scripts/ingest-video.ts --video-id 1`
- **静态审计 ✅ PASS**:
  - 流程: fetch_subtitle → fan-out S1//S2//S3//S4 (`Promise.all`) → S8 embedding → 事务写 DB → trigger S5
  - 状态机: 每步写 `pipeline_runs`(running → done / failed)
  - 重试: 单步 ≤ 3 次,指数退避(1s / 4s / 9s)

## UI Skills · 截图验收

> 本项目 UI 通过 frontend 实现 18 components + 6 pages · 不是独立的 ui-operation skill_type · 走 page-level 截图验收。

### UI 截图列表(`docs/delivery/demo/screenshots/` · 待 Alan 上线后补)

- `[v4.1 placeholder — 请补充 demo/screenshots/01-home-zh.png(首页中文)]`
- `[v4.1 placeholder — 请补充 demo/screenshots/02-home-en.png(首页英文 · 双语切换验证)]`
- `[v4.1 placeholder — 请补充 demo/screenshots/03-video-detail-zh.png(视频详情 · 摘要 + 5-10 观点 + 时间轴 + 2 档解释)]`
- `[v4.1 placeholder — 请补充 demo/screenshots/04-video-detail-en.png(同上英文)]`
- `[v4.1 placeholder — 请补充 demo/screenshots/05-person-zh.png(人物页 + 代表观点 + 相关视频)]`
- `[v4.1 placeholder — 请补充 demo/screenshots/06-topic-zh.png(主题页 · ai-agent)]`
- `[v4.1 placeholder — 请补充 demo/screenshots/07-search-result.png(/search?q=AGI · keyword + semantic)]`
- `[v4.1 placeholder — 请补充 demo/screenshots/08-favorites.png(收藏列表 · Clerk 登录态)]`

**如何补全截图**:

1. 跑完 `deployment-runbook.md` Step 7 拿到 Vercel preview URL
2. Chrome DevTools 切 1440 宽度截图(每页 zh / en 各一次)
3. 存到 `docs/delivery/demo/screenshots/`
4. 上述 placeholder 替换为 `![首页中文](demo/screenshots/01-home-zh.png)`

## 如何补全 UI 截图

> `[本项目无独立 ui-operation skill · Playwright starter 未自动生成]`
>
> 若 Alan 想做自动化截图(可选),可参考 Mia 高保真原型作 reference:
>
> - `docs/design/high-fidelity/home.html` · `video-detail.html` · `person.html` · `search.html` — 直接浏览器开 · 像素级照抄稿
> - 用 `playwright` 手写 4 个 scenarios(home / video / person / search)+ `page.screenshot()` 即可
> - 也可直接 Vercel preview URL + Chrome DevTools 手工截图(MVP 阶段 4 页 8 截图 ~10 分钟搞定 · 不必上 Playwright)

**自动化等级**:

- Non-UI 段: ✅ 全自动(Desk Evaluation · 上线后真跑回填)
- UI 段: ⚠️ 半自动(8 截图 placeholder · Alan 上线 smoke test 时顺手补)
