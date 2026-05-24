# Wireframe · 首页 `/[locale]`

## 视图(桌面 1440)

```
╔═══════════════════════════════════════════════════════════════════╗
║ [看懂世界]    [🔍 搜索视频/人物/主题   ⌘K]    主题▾  zh|en  [👤] ║   ← Header 64
╠═══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║   今日精读 · TODAY'S READ                                          ║   ← Hero 280
║   ─────────────────────                                            ║
║                                                                    ║
║   「Dario Amodei:未来 5 年 AGI 会全面到来」                       ║
║                                                                    ║
║   一句话总结:Anthropic CEO 描绘 powerful AI 路线图 ──            ║
║   2027 前我们将见到能完成博士级科研工作的 AI 系统。               ║
║                                                                    ║
║                                                      → 阅读全文 →  ║
║                                                                    ║
╠═══════════════════════════════════════════════════════════════════╣
║   AI · AI Agent · 创业 · 芯片 · 未来工作                          ║   ← TopicStrip 56
╠═══════════════════════════════════════════════════════════════════╣
║   人物                                                             ║
║   [O] [O] [O] [O] [O] [O] [O] [O] [O] [O]              ◀ ▶       ║   ← PersonRail 120
║   Sam  Dario Demis Andrej Lex  Naval ...                          ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                    ║
║   最新精选                                                         ║
║                                                                    ║
║   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            ║
║   │ [封面]  │  │ [封面]  │  │ [封面]  │  │ [封面]  │            ║   ← VideoCard
║   │         │  │         │  │         │  │         │              ║      grid 4col
║   │ 标题... │  │ 标题... │  │ 标题... │  │ 标题... │            ║
║   │ 嘉宾·45m│  │ 嘉宾·1h │  │ 嘉宾·32m│  │ 嘉宾·1h │            ║
║   │ #AI     │  │ #创业   │  │ #芯片   │  │ #AI Agent│           ║
║   └─────────┘  └─────────┘  └─────────┘  └─────────┘            ║
║                                                                    ║
║   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            ║
║   │ ...     │  │ ...     │  │ ...     │  │ ...     │            ║
║   └─────────┘  └─────────┘  └─────────┘  └─────────┘            ║
║                                                                    ║
║   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            ║
║   │ ...     │  │ ...     │  │ ...     │  │ ...     │            ║
║   └─────────┘  └─────────┘  └─────────┘  └─────────┘            ║
║                                                                    ║
║                          [加载更多]                                ║
║                                                                    ║
╠═══════════════════════════════════════════════════════════════════╣
║   © 2026 看懂世界(kdsj-world)· by Simprr · @simprr           ║   ← Footer 120
║   AI · AI Agent · 创业 · 芯片 · 未来工作 · 关于 · 隐私              ║
║   © 2026 kdsj-world · curated by Simprr · x.com/simprr           ║
╚═══════════════════════════════════════════════════════════════════╝
```

## 组件标注

| Region | 组件 | Props 关键 | 数据源 |
|---|---|---|---|
| Header | C01 Header | locale, user | session |
| Hero | C05 SummaryBlock (variant=hero) | video(featured), size="hero" | videos WHERE featured=true LIMIT 1 |
| TopicStrip | C10 TopicStrip | topics[] | SELECT * FROM topics |
| PersonRail | C11 PersonAvatarRail | people[] | SELECT * FROM people LIMIT 10 |
| Grid | C03 VideoCard × N | video, locale | SELECT videos ORDER BY published_at DESC LIMIT 30 |
| Footer | C02 Footer | locale | static |

## 响应式(MVP 不做但流体)

- 1440 → 4col
- 1024 → 3col
- 768 → 2col + 提示 "建议桌面访问"
- < 768 → "请用桌面访问" 全屏卡(MVP 不优化)

## 数据态

- empty: 30 视频未导入完 → grid 占位骨架 6 张
- loading: skeleton card(灰描边 + shimmer)
- error: 居中 "加载失败 · 重试"

## a11y

- Hero 标题 = `<h1>` · 主题/最新精选 = `<h2>`
- 卡片整体可 tab 聚焦 · Enter 进详情
- LocaleToggle aria-label="切换语言 / Switch language"
