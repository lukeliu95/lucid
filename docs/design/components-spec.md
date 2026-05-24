# Component Spec · 16 关键组件

> shadcn/ui 优先 · 不造轮子 · Tailwind utility · 所有颜色字号通过 design-tokens

约定:
- **shadcn base**: 列出底座(若有)
- **Props**: TS 接口
- **Variants**: cva-style 变体
- **States**: default / hover / active / focus / disabled / loading / error / empty
- **a11y**: ARIA + 键盘

---

## C01 · Header

**shadcn base**: 无(自定义) · 用 shadcn `<Input>` + `<DropdownMenu>` 子组件

```ts
interface HeaderProps {
  locale: "zh" | "en";
  user: { id: string; avatar?: string } | null;
}
```

**Layout**: sticky top-0 · h-16 · bg-paper-100/80 backdrop-blur · border-b border-paper-300 · z-30

**子组件**:
- `Logo` — 左 · 衬线 "看懂世界" / "kdsj"(根据 locale)+ 小标语
- `SearchBar`(C 共用) — 中 · w-96 · placeholder 双语 · ⌘K 快捷
- `TopicsDropdown` — 5 主题快链
- `LocaleToggle` — `zh | en` · 当前 active 暖橘
- `LoginAvatar` — 头像 / "登录" button

**States**: scroll > 50px → border-b 加深(border-strong)

**a11y**: `<header role="banner">` · skip-link `<a href="#main">跳到主内容</a>` 视觉隐藏 + tab 显示

---

## C02 · Footer

```ts
interface FooterProps { locale: "zh" | "en"; }
```

**Layout**: 全宽 · py-16 · bg-paper-200 · border-t border-paper-300

**内容**:
- 主行: 双语 copyright + Simprr 链接(`<a href="https://x.com/simprr" target="_blank" rel="noopener">x.com/simprr</a>`)
- 副行: 主题快链 5 个 · 关于 · 隐私
- 极小 tagline: `footer.tagline`

**硬规则**: **Simprr 链接全站必须可见**(intent-brief 验收硬门槛)

---

## C03 · VideoCard

```ts
interface VideoCardProps {
  video: {
    slug: string;
    title: string;          // localized
    cover_url: string;
    person_name: string;
    duration_sec: number;
    topic_names: string[];  // localized
    one_liner?: string;     // localized · hover 显示
  };
  variant?: "default" | "compact" | "horizontal";
  showFavorite?: boolean;
}
```

**Layout default**: w-full · aspect-cover 16:9 · 卡片整体 max-w-[296px] · border border-paper-300 · radius-base 4px · hover 升 bg-paper-50 + border 加深

**Variants**:
- `default` — grid 卡(首页/主题/收藏)
- `compact` — 侧栏小卡(相关视频)
- `horizontal` — 搜索结果用 · thumb 左 + 文字右

**Hover**:
- 整体: border-strong + bg-paper-50
- 封面: subtle scale 1.02
- 显示 `one_liner` 浮层(底部上移 8px slide-up · 150ms)
- 右上 FavoriteButton 出现(opacity 0 → 1)

**Focus**: 整卡 focus ring

**a11y**: 整卡 `<a>` 包裹 · `aria-label="标题 · 嘉宾 · 时长"`

---

## C04 · VideoEmbedPlayer

```ts
interface VideoEmbedPlayerProps {
  platform: "youtube" | "bilibili";
  platform_id: string;
  onReady?: (player: PlayerHandle) => void;
}
interface PlayerHandle {
  seekTo: (seconds: number) => void;
}
```

**Layout**: aspect-video w-full · radius-lg 8px overflow-hidden · border border-paper-300

**实现**:
- YouTube: `<iframe src="https://www.youtube.com/embed/{id}?enablejsapi=1">` + YT IFrame API
- Bilibili: `<iframe src="//player.bilibili.com/player.html?bvid={id}">` + 有限 postMessage

**暴露 ref**: `seekTo(sec)` 供 TimelineNav 调用

**States**: loading(灰底)· error("视频加载失败 · 在 YouTube 看 ↗")

---

## C05 · SummaryBlock

```ts
interface SummaryBlockProps {
  text: string;
  variant: "hero" | "detail";
  cta?: { label: string; href: string };
}
```

**Variants**:
- `hero`(首页): font-serif · text-5xl(36) · leading-tight · text-ink-950 · 引号 + cta link 暖橘
- `detail`(详情页): font-serif · text-3xl(28) · 暖橘 amber-600 · 引号大字 · 左 border-l-4 amber-600 pl-6 · max-w-content 680px

**Quote 装饰**: 用 `「」`(中文) / `"..."`(英文)· 视觉权重高

---

## C06 · KeypointsList

```ts
interface KeypointsListProps {
  items: Array<{
    text: string;            // localized
    timestamp_sec?: number;
    source_span?: string;    // 原文片段 · hover 显示
  }>;
  onSeekTo?: (sec: number) => void;
}
```

**Layout**: `<ol>` · 每条 py-3 border-b border-paper-300 last:border-0

**单条**:
```
• 观点文字(衬线 17/28) ─────────────── 2:14 ↗
  hover ↓
  原文锚点片段(italic ink-500 sm)
```

**Hover**: bg-paper-50 + 显示 source_span(slide-down)
**Click timestamp**: 调 `onSeekTo(sec)`

**a11y**: `<ol role="list">` · 每个 timestamp 是 `<button>` · `aria-label="跳到 2 分 14 秒"`

---

## C07 · TimelineNav

```ts
interface TimelineNavProps {
  items: Array<{
    timestamp_sec: number;
    title: string;        // localized
    one_liner: string;    // localized
  }>;
  activeIndex: number;
  onSeekTo: (sec: number) => void;
}
```

**Layout**: sticky top-20 · vertical list · 每条 py-2 pl-4

**Item States**:
- default: dot ink-300 + text-ink-700
- hover: dot amber-600 + 展开 one_liner(150ms slide-down)
- active: 左 border-l-3 amber-600 + dot amber-600 + text-ink-900 + bold + 展开 one_liner

**a11y**: `<nav aria-label="视频时间轴">` · `role="list"` · `aria-current="true"` for active

---

## C08 · TwoTierTabs

```ts
interface TwoTierTabsProps {
  quick: string;   // localized
  deep: string;    // localized
  defaultValue?: "quick" | "deep";
}
```

**shadcn base**: `<Tabs>` from shadcn/ui · 重写样式

**Layout**:
- Tab triggers: 顶部 row · 两个 tab 等宽 max-w-md · 衬线 lg · 暖橘下划线 indicator
- Content: max-w-content 680px · font-serif text-md(17) leading-relaxed · prose-like

**Variants**: 仅暖橘 underline(无 bg pill · 杂志感)

**无 layout shift**: TabsContent 容器 `min-h-[600px]`

**a11y**: shadcn 已自带 · `aria-label={t('a11y.tabs_label')}` 补充

---

## C09 · SourceCitation

```ts
interface SourceCitationProps {
  platform: "youtube" | "bilibili";
  channel: string;
  published_at: string;  // ISO
  original_url: string;
}
```

**Layout**: 侧栏 · text-sm · ink-500 标签 + ink-900 值 · 最后一行 "原视频 ↗" 暖橘 link

---

## C10 · TopicStrip

```ts
interface TopicStripProps {
  topics: Array<{ slug: string; name: string }>;
  activeSlug?: string;
  variant?: "default" | "mini";
}
```

**Layout default**: horizontal row · py-4 · 主题间 `·` 分隔 · 衬线 lg

**Item**: text-ink-900 hover:text-amber-600 transition-fast · active: text-amber-600 underline

**Variant mini**(详情侧栏): pill-style · bg-paper-200 px-3 py-1 radius-full text-sm

---

## C11 · PersonAvatarRail

```ts
interface PersonAvatarRailProps {
  people: Array<{ slug: string; name: string; avatar_url: string }>;
  variant?: "default" | "mini";
}
```

**Layout default**: horizontal scroll · py-4 · Avatar 64×64 round · 下方人名 sm · gap-6 · 左右 arrow button overflow

**Variant mini**: 单个 Avatar 32×32 + 姓名 inline(详情侧栏 相关人物)

---

## C12 · FavoriteButton

```ts
interface FavoriteButtonProps {
  videoId: string;
  initial?: boolean;
  size?: "sm" | "md";
}
```

**shadcn base**: `<Button variant="ghost" size="icon">`

**States**:
- default 空心心 + ink-700
- hover 暖橘 amber-600 + scale 1.05
- active(已收藏): 实心 amber-600
- loading: spinner replace icon

**乐观 UI**: 立刻切状态 · 网络失败回滚

---

## C13 · AuthForm

```ts
interface AuthFormProps { redirectTo?: string; }
```

**shadcn base**: `<Card>` + `<Button>` + `<Input>`

**Layout**: max-w-md center · py-12 · Card padding 32

**内容**:
- Logo
- 标题 衬线 3xl "登录" / "Sign in"
- Google button(主)
- divider "或 / or"
- Email input + magic link button(次)
- 底部 terms link 小字

**实现**: Clerk 已被 Phase A 落锤(pipeline-state `alan_late_call_phase_a.auth`)· 用 `<SignIn>` 组件套 Card 外壳

---

## C14 · AdminVideoForm

```ts
interface AdminVideoFormProps {
  onSubmit: (data: VideoFormData) => Promise<void>;
}
interface VideoFormData {
  url: string;
  platform: "youtube" | "bilibili";
  person_slug?: string;       // 选已有 or 新建
  topic_slugs: string[];      // multi
  title_zh?: string;          // 留空 → AI 自动填
  title_en?: string;
}
```

**shadcn base**: `<form>` + `<Input>` + `<Select>` + `<Button>`

**Layout**: 单列 max-w-2xl · 每个 field py-3 · label + input 上下

**实现**: 提交后 POST → 返回 video_id → router.push(`/admin/videos/{id}/status`)

---

## C15 · AdminStatusTable

```ts
interface AdminStatusTableProps {
  videos: Array<{
    id: string;
    title: string;
    status: "pending" | "asr_done" | "ai_done" | "failed";
    updated_at: string;
  }>;
  pollIntervalMs?: number;    // default 30000
}
```

**shadcn base**: `<Table>` from shadcn/ui

**列**: title · status badge · updated_at · 操作(编辑 / 详情)

**StatusBadge** 子组件: cva variant 按 status 色

**轮询**: useSWR / TanStack Query refetchInterval

---

## C16 · SearchResultsList

```ts
interface SearchResultsListProps {
  query: string;
  mode: "keyword" | "semantic";
  results: {
    videos: VideoCardData[];
    people: PersonRowData[];
    topics: TopicRowData[];
  };
}
```

**Layout**: 三段垂直堆叠 · 每段 h2 标题 + 列表 · 段间 mt-12

**子元素**:
- `VideoRow` — horizontal 卡(C03 variant=horizontal)
- `PersonRow` — Avatar + name + bio snippet
- `TopicRow` — slug + intro snippet

**高亮**: `<mark className="bg-amber-50 text-amber-700 px-0.5">` 命中词

**空态**: 整体空 → "没找到 ..." + 主题胶囊推荐

---

## 通用 Hooks(给小赵)

- `useLocale()` — next-intl
- `useSeekTo(playerRef)` — 暴露给 TimelineNav / KeypointsList
- `useFavorite(videoId)` — 乐观 UI + Clerk session
- `useDebounce(value, delay)` — search

## 通用 CSS classes(给小赵)

- `.prose-mia` — 长文 typography(衬线 + leading-relaxed + max-w-content)
- `.focus-amber` — 焦点环 token
- `.skip-link` — sr-only + focus 出现
