# 需求分解 + 类型分流 · kdsj-world

> 把 `requirements-spec.md` 的 21 条 REQ 拆解为 Phase B 可生成的工件。
> 双轨:**后端 Skill(大刘 · B.2)** + **UI 模块(小赵 · B.1 · Mia 设计稿驱动)**。
> 类型遵循 discover SKILL.md v4.7 五类: Agent / Script / Hybrid / UI / UI-Agent-Hybrid。

---

## 0. 概要

| 项 | 值 |
|---|---|
| 客户 | Simprr |
| project_type | hybrid(已锁) |
| REQ 总数 | 21 |
| 后端 Skill 数 | 10(Agent 4 / Script 4 / Hybrid 2) |
| UI 模块数 | 12(UI 9 / UI-Agent-Hybrid 3) |
| 知识库数 | 4 |

类型分布:

| 类型 | 个数 | 用途 |
|---|---|---|
| Agent | 4 | AI 推理(摘要/观点/解释/人物聚合) |
| Script | 4 | DB CRUD / 搜索 / Embedding / 流水线编排 |
| Hybrid | 2 | 时间轴(分段 + 命名)/ 语义搜索 |
| UI | 9 | 纯渲染页面/组件 |
| UI-Agent-Hybrid | 3 | 后台触发 AI + 搜索框 + i18n 切换 |

---

## 1. 后端 Skill(B.2 · 大刘)

### S1 · summary-generator · Agent

- 对应 REQ: V02(一句话总结)
- 输入: transcript_text + locale
- 输出: ≤ 80 字双语总结
- 模型: DeepSeek-v4-pro(Edge Function)
- 复用: 沿用 bazi-studio Edge Function 模板

### S2 · keypoints-extractor · Agent

- 对应 REQ: V03(核心观点 5-10 条)
- 输入: transcript_text
- 输出: bullet 数组 · 双语 · 标 source span(防幻觉)
- 模型: DeepSeek-v4-pro
- 关键 prompt: "禁止虚构 · 每条必须能在原文找到锚点"

### S3 · timeline-builder · Hybrid

- 对应 REQ: V04(时间轴)
- Script 部分: 按 Whisper 输出的时间戳分段(语义边界 + 长度启发)
- Agent 部分: 每段命名 + 一句摘要(DeepSeek)
- 输出: ≥ 5 节点 · 双语

### S4 · two-tier-explainer · Agent

- 对应 REQ: V05(2 档解释)
- 输入: transcript + 一句话总结
- 输出: { adult_quick: <300字双语>, deep: <800-1500字双语> }
- 模型: DeepSeek-v4-pro · 两次调用 / 单次结构化 prompt 二选一

### S5 · person-profile-aggregator · Agent

- 对应 REQ: P02(人物代表观点)
- 输入: person_id 的所有视频 keypoints JOIN
- 输出: 3-5 条代表观点 · 双语
- 触发: 每次新视频入库后 cron 重算该人物

### S6 · video-crud · Script

- 对应 REQ: X01(视频 CRUD)
- 输入: video metadata
- 输出: DB row + 触发 S9 流水线
- API: REST `POST /admin/videos`

### S7 · semantic-search · Hybrid

- 对应 REQ: S02(语义搜索)
- Script: query embedding(同 embed 模型) + pgvector cosine top-k
- Agent: 可选 re-rank(MVP 先不上)
- 输出: top-5 视频

### S8 · keyword-search · Script

- 对应 REQ: S01(关键词搜索)
- Script: Postgres ILIKE / GIN ts_vector(中英分词)
- 输出: 命中视频 / 人物 / 主题

### S9 · ai-pipeline-orchestrator · Script

- 对应 REQ: V02-V05 的编排
- 触发: 新视频入库
- 步骤: fetch_subtitle → if_none_whisper → S1 → S2 → S3 → S4 → embed → DB 写入
- 状态: pending / asr_done / ai_done / failed
- 重试: 每步 ≤ 3 次

### S10 · favorite-crud · Script

- 对应 REQ: U02/U03
- 输入: user_id + video_id
- 输出: favorites 表 CRUD

---

## 2. UI 模块(B.1 · 小赵 · Mia handoff 后)

### UI-H01 · HomeGrid · UI

- 对应 REQ: H01
- 组件: VideoCard(grid) · Hero · Footer(含 simprr 链接)

### UI-H02 · LocaleToggle · UI

- 对应 REQ: H02 · 全局
- next-intl 路由切换

### UI-H03 · TopicStrip + PersonRail · UI

- 对应 REQ: H03

### UI-V01 · VideoEmbedPlayer · UI

- 对应 REQ: V01 · iframe wrapper

### UI-V02 · SummaryBlock · UI

- 对应 REQ: V02 · 一句话总结渲染

### UI-V03 · KeypointsList · UI

- 对应 REQ: V03

### UI-V04 · TimelineNav · UI

- 对应 REQ: V04 · 点击 timestamp → postMessage 到 iframe player

### UI-V05 · TwoTierTabs · UI

- 对应 REQ: V05 · tab 切 成人速懂 / 深度

### UI-V06 · SourceCitation · UI

- 对应 REQ: V07

### UI-P01 · PersonPage · UI

- 对应 REQ: P01

### UI-T01 · TopicPage · UI

- 对应 REQ: T01

### UI-U01 · AuthFlow · UI(NextAuth/Clerk 嵌入)

- 对应 REQ: U01

### UI-U02 · FavoriteButton + MyPage · UI

- 对应 REQ: U02/U03

### UI-X01 · AdminVideoForm · UI-Agent-Hybrid

- 对应 REQ: X01 + 触发 S9
- 提交表单后调用 S9 流水线 · 实时显示状态

### UI-X02 · AdminStatusDashboard · UI

- 对应 REQ: X02

### UI-S01 · SearchBar + Results · UI-Agent-Hybrid

- 对应 REQ: S01/S02
- 输入触发 S8(关键词)/ S7(语义)二选一(用户在 UI 上 toggle 或自动判定)

### UI-X03 · SummaryReviewEditor · UI-Agent-Hybrid (P1)

- 对应 REQ: X03

---

## 3. 知识库 / 数据 Schema 提示

| 表 | 字段(关键) | 备注 |
|---|---|---|
| videos | id, platform, platform_id, title_zh, title_en, person_id, topic_ids[], duration, ai_status, embedding | pgvector dim 1536(DeepSeek embedding) |
| videos_ai | video_id, summary_zh, summary_en, keypoints_zh[], keypoints_en[], timeline_zh, timeline_en, explainer_quick_zh/en, explainer_deep_zh/en | 拆 1:1 表减小主表 |
| people | id, name, bio_zh, bio_en, avatar, signature_views_zh[], signature_views_en[] |
| topics | slug, name_zh, name_en, intro_zh, intro_en |
| favorites | user_id, video_id, created_at |

---

## 4. Skill 复用扫描(初判)

| 已有 Skill / 模板 | 复用方式 | 对应 |
|---|---|---|
| bazi-studio Edge Function 模板 | 直接抄(LLM 代理 + 月度 rate limit) | S1-S5 共用底座 |
| next-intl 标准方案 | 直接用 | UI-H02 + 所有双语字段 |
| shadcn/ui DataTable | 直接用 | UI-X02 |
| Vercel Analytics | 直接用 | 上线 Day-1 验收 |

---

## 5. 优先级矩阵 · 7 天排期建议

| Day | 后端(大刘) | 前端(小赵) | 设计(Mia) |
|---|---|---|---|
| D1 | Stack 落锤 + Neon/pgvector init + 沿用 bazi Edge Function | 等 Mia handoff | 4 页设计 + tokens + i18n key |
| D2 | S6/S9/S10 框架 + DB schema | 启动 UI-H01/UI-V01..06 骨架 | handoff 完毕 |
| D3 | S1/S2(摘要 + 观点)上线 + Whisper 接入 | UI-V02..05 + Locale toggle | 巡检 |
| D4 | S3/S4(时间轴 + 解释)上线 + S5 人物聚合 | UI-P01/UI-T01 | — |
| D5 | S7/S8(搜索)+ 数据导入 30 视频跑通 | UI-S01 + UI-U01..02 | — |
| D6 | 后台 X01/X02 + 阿May eval 跑 | UI-X01..02 整合 | — |
| D7 | bug + 阿May eval gate · Twitter 发链 | 同左 + Lighthouse 优化 | — |

> 排期纯建议 · Alan 自己根据现实节奏调整 · orchestrator 派活时可参考。
