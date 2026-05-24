# Wireframe · 视频详情页 `/[locale]/v/[slug]` — 核心

> 60% 体验权重 · 必须最精细

## 视图(桌面 1440 · 主 8col / 侧 4col)

```
╔════════════════════════════════════════════════════════════════════════╗
║ [看懂世界]      [🔍 搜索    ⌘K]            主题▾   zh|en   [👤]        ║   Header 64
╠════════════════════════════════════════════════════════════════════════╣
║                                                                         ║
║ ← 返回 首页                                                              ║
║                                                                         ║
║ ┌────────────── 主内容 col 8 ──────────────┐  ┌─ 侧栏 col 4 sticky ─┐ ║
║ │                                            │  │                      │ ║
║ │  ┌──────────────────────────────────────┐  │  │  时间轴               │ ║
║ │  │                                      │  │  │  ─────                │ ║
║ │  │   iframe Player 16:9                 │  │  │  ● 0:00  引子        │ ║
║ │  │   (YouTube / Bilibili embed)        │  │  │  ● 3:24  ▌Agent 来源 │ ║   ← active
║ │  │                                      │  │  │       Agent 概念源起 │ ║
║ │  └──────────────────────────────────────┘  │  │  ● 8:50  模型选择    │ ║
║ │                                            │  │  ● 15:12 商业化路径   │ ║
║ │   访谈标题(衬线 32/40)                   │  │  ● 22:00 未来 5 年    │ ║
║ │                                            │  │  ● 28:30 Q&A         │ ║
║ │   Dario Amodei · 47:23                    │  │                       │ ║
║ │   YouTube · Lex Fridman Podcast ↗          │  │  ─────                │ ║
║ │                                            │  │                       │ ║
║ │   [♥ 收藏]    [zh | en]    [分享 ↗]       │  │  来源                 │ ║
║ │                                            │  │  ─────                │ ║
║ │   ──────────────────────────              │  │  YouTube              │ ║
║ │                                            │  │  Lex Fridman Podcast  │ ║
║ │   一句话总结                                │  │  发布于 2026-04      │ ║
║ │                                            │  │  原视频 ↗            │ ║
║ │   ┌──────────────────────────────────┐    │  │                       │ ║
║ │   │ 「Anthropic CEO 描绘 powerful AI │    │  │  ─────                │ ║
║ │   │  路线图,2027 前我们将见到能完成 │    │  │                       │ ║
║ │   │  博士级科研工作的 AI 系统。」    │    │  │  相关人物             │ ║
║ │   └──────────────────────────────────┘    │  │  [O] Dario Amodei    │ ║
║ │   ↑ 暖橘衬线大字 28/36                     │  │                       │ ║
║ │                                            │  │  相关主题             │ ║
║ │   ──────────────────────────              │  │  #AI #未来工作       │ ║
║ │                                            │  │                       │ ║
║ │   核心观点                                  │  │                       │ ║
║ │                                            │  │                       │ ║
║ │   • Powerful AI 5 年内出现 ─── 2:14 ↗     │  │                       │ ║
║ │   • 安全研究是 alignment 必经 ── 8:50 ↗   │  │                       │ ║
║ │   • 商业模式以 Claude API 为锚 ─ 15:12 ↗  │  │                       │ ║
║ │   • 芯片/算力是物理瓶颈 ────── 22:00 ↗   │  │                       │ ║
║ │   • Anthropic 不追 AGI 比赛 ─── 28:30 ↗  │  │                       │ ║
║ │   ↑ hover 显示原文片段 · 点击跳秒          │  │                       │ ║
║ │                                            │  │                       │ ║
║ │   ──────────────────────────              │  │                       │ ║
║ │                                            │  │                       │ ║
║ │   ┌─[ 成人速懂 ]─[ 深度版 ]─────────┐    │  │                       │ ║
║ │   │                                  │    │  │                       │ ║
║ │   │  (active=成人速懂 · 300 字内)   │    │  │                       │ ║
║ │   │                                  │    │  │                       │ ║
║ │   │  Dario 在这期访谈中给出了他对    │    │  │                       │ ║
║ │   │  "powerful AI"何时到来的清晰    │    │  │                       │ ║
║ │   │  时间表 ── 大约在 2027 年前后    │    │  │                       │ ║
║ │   │  ...                              │    │  │                       │ ║
║ │   │                                  │    │  │                       │ ║
║ │   │  (max-width 680px · 衬线 17/28) │    │  │                       │ ║
║ │   │                                  │    │  │                       │ ║
║ │   └──────────────────────────────────┘    │  │                       │ ║
║ │                                            │  │                       │ ║
║ └────────────────────────────────────────────┘  └──────────────────────┘ ║
║                                                                          ║
╠════════════════════════════════════════════════════════════════════════╣
║   Footer ...                                                            ║
╚════════════════════════════════════════════════════════════════════════╝
```

## 组件标注

| Region | 组件 | 数据源 |
|---|---|---|
| Player | C04 VideoEmbedPlayer | videos.platform + platform_id |
| 标题块 | inline | videos.title_{locale} |
| 收藏/语言/分享 | C12 FavoriteButton + LocaleToggle | session + URL |
| 一句话 | C05 SummaryBlock (variant=detail) | videos_ai.summary_{locale} |
| 核心观点 | C06 KeypointsList | videos_ai.keypoints_{locale}[] · 含 timestamp |
| 2 档 Tab | C08 TwoTierTabs | videos_ai.explainer_quick/deep_{locale} |
| 时间轴 | C07 TimelineNav (sticky) | videos_ai.timeline_{locale}[] |
| 来源 | C09 SourceCitation | videos.platform + metadata |
| 相关人物 | C11 PersonAvatarRail (mini) | JOIN people |
| 相关主题 | C10 TopicStrip (mini) | JOIN topics |

## 数据态

- AI 状态 = `pending` / `asr_done`:show banner "AI 处理中 · 仅播放器和元信息可见"
- AI 状态 = `failed`:show banner "AI 处理失败 · 已通知运营"
- 收藏未登录:点 → 弹小 toast "登录后可收藏" + CTA 跳 `/login?redirect=/v/${slug}`
- 时间轴节点 hover/active:暖橘左 border + 加粗
- 跳秒:postMessage to iframe(YT API)· 节点切 active

## 双语切换

- toggle 改 URL `/zh/v/[slug]` ↔ `/en/v/[slug]`
- 所有 AI 字段从对应 `_zh` / `_en` 列读
- 标题中英字符宽度差异 → 标题容器 min-height 80px 防 layout shift

## a11y

- Player 上方 skip-link "跳过播放器到摘要"
- TwoTierTabs 用 `role="tablist"` · 键盘左右切
- TimelineNav 可键盘 tab 聚焦 · Enter 跳秒
- 一句话总结 = `<h2>` 锚点 #summary
