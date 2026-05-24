# Design Handoff · kdsj-world

> Mia → 小赵(B.1 前端)+ 大刘(B.2 后端 · API contract 对齐)
> 2026-05-24 · Stage F · Stage E 自查全 PASS

---

## 1. 实现约束

| 项 | 值 |
|---|---|
| Framework | Next.js 15 App Router |
| UI Lib | shadcn/ui + Tailwind |
| i18n | next-intl(`[locale]` segment · default `zh`) |
| Auth | Clerk(Vercel Marketplace) |
| ORM | Drizzle |
| DB | Neon Postgres + pgvector |
| Deploy | Vercel |
| Target | Desktop 1440 优先 · 1024-1440 流体 · < 768 提示"建议桌面访问" |
| 性能预算 | LCP ≤ 2.5s · 首屏 JS < 200KB · CLS < 0.05 · Lighthouse Perf ≥ 80 / A11y ≥ 90 / SEO ≥ 90 |
| 浏览器 | Chrome / Safari / Edge 最近 2 版本 · IE 不支持 |
| 字体 | next/font 自托管 Source Serif Pro + Source Han Serif SC + Inter |

---

## 2. 资产路径

| 资产 | 路径 | 用法 |
|---|---|---|
| Design Spec(总) | `docs/design/design-spec.md` | 必读起点 |
| Design Tokens(源) | `docs/design/tokens/design-tokens.json` | DTCG 格式 · 之后可生成多平台 |
| Tailwind Config Snippet | `docs/design/tokens/tailwind.config.snippet.ts` | 贴进 `tailwind.config.ts` `theme.extend` |
| i18n Keys 表 | `docs/design/tokens/i18n-keys.md` | 生成 `messages/zh.json` + `messages/en.json` |
| Wireframes | `docs/design/wireframes/0X-*.md` | 4 大页面 ASCII 布局 + 组件标注 + 数据态 |
| High-Fidelity HTML | `docs/design/high-fidelity/*.html` | 直接浏览器看 · 像素级照抄 |
| Components Spec | `docs/design/components-spec.md` | 16 组件 props/variants/states/a11y |
| Interactions Spec | `docs/design/interactions.md` | 6 大交互时序 |
| Stage E 自查 | `docs/design/stage-e-self-review.md` | 已 PASS · 含 2 项转 Phase C 实测 |

> 别名: ui-brief.md 提到的 `docs/02-design/` 不另建副本 · 以 `docs/design/` 为 canonical。

---

## 3. API Contract 占位(与大刘对齐)

```ts
// /api/videos · GET · 首页 grid
type VideoCard = {
  slug: string;
  title_zh: string; title_en: string;
  cover_url: string;
  person: { slug: string; name_zh: string; name_en: string };
  duration_sec: number;
  topics: Array<{ slug: string; name_zh: string; name_en: string }>;
  one_liner_zh?: string; one_liner_en?: string;
};

// /api/videos/[slug] · GET · 详情
type VideoDetail = VideoCard & {
  platform: "youtube" | "bilibili";
  platform_id: string;
  published_at: string;     // ISO
  ai_status: "pending" | "asr_done" | "ai_done" | "failed";
  ai: {
    summary_zh: string;     summary_en: string;
    keypoints_zh: Array<{ text: string; timestamp_sec?: number; source_span?: string }>;
    keypoints_en: Array<{ text: string; timestamp_sec?: number; source_span?: string }>;
    timeline_zh: Array<{ timestamp_sec: number; title: string; one_liner: string }>;
    timeline_en: Array<{ timestamp_sec: number; title: string; one_liner: string }>;
    explainer_quick_zh: string; explainer_quick_en: string;
    explainer_deep_zh:  string; explainer_deep_en:  string;
  } | null;  // null when ai_status != "ai_done"
};

// /api/people/[slug] · GET
type PersonDetail = {
  slug: string;
  name_zh: string; name_en: string;
  title_zh: string; title_en: string;
  avatar_url: string;
  bio_zh: string; bio_en: string;
  signature_views_zh: Array<{ quote: string; from_video_slug: string; from_video_title: string }>;
  signature_views_en: Array<{ quote: string; from_video_slug: string; from_video_title: string }>;
  videos: VideoCard[];
};

// /api/topics/[slug] · GET
type TopicDetail = {
  slug: string;
  name_zh: string; name_en: string;
  intro_zh: string; intro_en: string;
  videos: VideoCard[];
  related_people: Array<Pick<PersonDetail, "slug" | "name_zh" | "name_en" | "avatar_url">>;
};

// /api/search · GET · ?q=...&mode=keyword|semantic
type SearchResults = {
  query: string;
  mode: "keyword" | "semantic";
  videos: VideoCard[];      // ≤ 20
  people: Array<Pick<PersonDetail, "slug" | "name_zh" | "name_en" | "avatar_url" | "bio_zh" | "bio_en">>;
  topics: Array<Pick<TopicDetail, "slug" | "name_zh" | "name_en" | "intro_zh" | "intro_en">>;
};

// /api/favorites · POST { video_id } · DELETE { video_id } · GET (列表)
// auth required · clerk session

// /api/admin/videos · POST(创建 + 触发 S9)· GET(状态列表)
type AdminVideoCreateRequest = {
  url: string;
  platform: "youtube" | "bilibili";
  person_slug: string;
  topic_slugs: string[];
  title_zh?: string; title_en?: string;
};
```

---

## 4. 实现优先级 · 7 天排期

照 decomposition §5:

| Day | 小赵任务 |
|---|---|
| **D1** | 项目脚手架 + Tailwind + tokens + next-intl messages + Clerk 接入 + Layout(Header + Footer · C01 C02) |
| **D2** | VideoCard(C03) · 首页骨架(grid + Hero + TopicStrip + PersonRail · C05/C10/C11) · LocaleToggle 链路通 |
| **D3** | 视频详情核心:Player(C04)· SummaryBlock(C05 detail variant)· KeypointsList(C06)· TwoTierTabs(C08) |
| **D4** | 视频详情侧栏:TimelineNav(C07 sticky · postMessage 跳秒)· SourceCitation(C09)· Related(C10/C11 mini) |
| **D5** | 人物页 + 主题页 + 搜索结果页(C16) · SearchBar(C01 内嵌) |
| **D6** | 登录(C13 Clerk)· 收藏 + /me(C12 + Page) · /admin(C14 + C15) |
| **D7** | Lighthouse 优化 · a11y 通跑 · i18n 缺漏排查 · bug |

---

## 5. 验收点(小赵自检 + 阿May Phase C eval)

### 5.1 视觉硬门槛(继承 design-spec §7)

- [ ] 衬线字体: `<h1>` / `<h2>` / 正文 / 引文 全用 Source Serif · sans 仅 button / label / meta
- [ ] **暖橘 #D97706 是唯一 accent** · 不出现紫蓝渐变 · 不出现其他高亮色
- [ ] 卡片用 `border 1px solid var(--paper-300)` · **不用 shadow**(modal/dropdown 除外)
- [ ] 长文正文 `max-width: 680px`(深度版 + 简介)
- [ ] 标题 line-height 1.25 · 正文 1.65
- [ ] 详情页 grid: 主 8col / 侧 4col gap 32
- [ ] 全站 container max 1280 · padding 64
- [ ] LocaleToggle 容器宽度固定 80px(防 CLS)
- [ ] 标题容器 min-height 80px(防中英 CLS)
- [ ] 详情页 TabsContent min-height 600px(防 CLS)

### 5.2 Tokens 100% 套用(grep 无 hardcode)

- [ ] 全代码无 `#D97706`(用 `text-amber-600` / `var(--amber-600)`)
- [ ] 全代码无 hardcode `padding: 24px`(用 `p-6` / `var(--spacing-6)`)
- [ ] 全代码无 hardcode `font-size: 17px`(用 `text-md`)

### 5.3 关键交互状态

- [ ] 每个 button / link 实现 default/hover/active/focus-visible/disabled 5 态
- [ ] FavoriteButton 乐观 UI + 网络失败回滚
- [ ] TimelineNav 跳秒成功率 ≥ 95%(YouTube)· B 站走外链降级
- [ ] TwoTierTabs / LocaleToggle CLS = 0(实测 Lighthouse)
- [ ] 搜索 input debounce 300ms · ESC 关闭 · `/` 聚焦

### 5.4 双语完整性

- [ ] `messages/zh.json` + `messages/en.json` 两文件 key 镜像(脚本验证)
- [ ] 跑 eval `i18n-key-coverage` · 0 fallback
- [ ] 切语言后所有 AI 字段从对应 `_zh` / `_en` 列读 · 0 缺漏

### 5.5 a11y(axe-core 实测)

- [ ] critical = 0
- [ ] serious ≤ 2
- [ ] Lighthouse A11y ≥ 90
- [ ] 键盘可达: Tab 顺序合理 · 所有交互 enter/space 可触发
- [ ] Focus ring 暖橘 3px 全站可见
- [ ] 跳过链接 "跳到主内容" 出现

### 5.6 性能

- [ ] LCP ≤ 2.5s(首页 + 详情页 · WebPageTest desktop slow 4G)
- [ ] CLS < 0.05
- [ ] 首屏 JS gzipped < 200KB(`@next/bundle-analyzer`)
- [ ] 衬线字体 `font-display: swap`
- [ ] iframe `loading="lazy"` · 首屏 player 例外可 eager
- [ ] 图片走 next/image · responsive sizes

### 5.7 版权 & 署名

- [ ] 全 4 页 Footer 含 `https://x.com/simprr` 链接 + Simprr 署名
- [ ] 详情页 C09 SourceCitation 含 平台 + 频道 + 发布时间 + 原片外链
- [ ] 不存在原视频下载链接 · 仅 iframe + 外链

---

## 6. 小赵可选用的外部 skill(自选)

- `frontend-design:frontend-design` — 从零高品质实现(若想要更瑞士/杂志感的微调)
- `impeccable:impeccable` — polish 既有代码 · 后期 D7 优化用
- shadcn MCP 跑 init + add component(`shadcn add tabs table card input dropdown-menu button select`)

---

## 7. 工单池(Stage E GO-WITH-NOTES 转 Phase C)

| # | 项 | 谁验 | 何时 |
|---|---|---|---|
| W1 | a11y critical = 0 (axe-core 实测) | 阿May | Phase C eval |
| W2 | B 站 iframe 跳秒精度 · 降级外链 UX | 阿May 抽检 | Phase C(MVP 可接受) |

---

## 8. Mia 后续可被召回的场景

- 小赵实现完跑通后,Mia 派 `impeccable:impeccable` 做视觉 polish/critique 一轮
- Phase C 阿May 发现 a11y / 可用性问题 → 转单 Mia 改稿
- Phase D 老吴巡检发现 UI 体验或 SEO 元信息问题 → 转单
- 上线后内容池扩到 100 视频时,Mia 重审首页 grid 信息密度

---

## 9. 🛑 硬规则提醒

- **小赵不能跳过本 handoff 自己拍设计决策** · 跳过 = bug(SKILL.md 不变量 #2)
- 任何设计变更走流程:小赵提 → Mia 改稿 → 重出 handoff 增量段
- design tokens 改动必须先改 `tokens/design-tokens.json` 源 · 再重生 `tailwind.config.snippet.ts`
- Simprr 署名 + footer 链接 不可删 · 任何页都必须有

---

**Handoff 准入完成 · 小赵可启动 B.1 UI Track · 不阻塞 B.2 大刘并行后端**
