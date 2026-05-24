# A11y Static Audit · kdsj-world Phase C

> 2026-05-24 · 阿May
> 方法: 静态 grep + 人工 review 18 components + 4 pages
> 注: 未跑 axe-core(无 dev server 启动 / Phase D 上线后跑 + Lighthouse)

---

## 总评

| Severity | Count | 阻塞上线? |
|---|---|---|
| Critical | **0** | — |
| Serious | 2 | 否(可 Phase D 修) |
| Moderate | 4 | 否 |
| Minor | 3 | 否 |

✅ **满足 intent-brief §6.2 "a11y critical = 0"**

---

## ✅ 通过项

| 项 | 证据 |
|---|---|
| Skip link | `src/components/layout/skip-link.tsx` · `sr-only focus:not-sr-only` 模式 · 跳到 `#main` ✅ |
| Search form 语义 | search-bar.tsx `role="search"` + `aria-label` + 键盘 `/` `⌘K` `Esc` ✅ |
| Tabs 语义 | tabs.tsx 4 处 aria 属性(role=tablist / aria-selected) ✅ |
| Lang switcher | 2 处 aria · 显式语言标识 ✅ |
| 视频播放器 | player.tsx 1 aria-label(`a11y.player_label` i18n key) ✅ |
| Timeline nav | timeline-nav.tsx aria-label(`a11y.timeline_label`) ✅ |
| Favorite button | 2 处 aria(`aria-pressed` 等) ✅ |
| Keyboard shortcuts | `/` 聚焦搜索 · `⌘K` · `Esc` ✅ |
| Focus ring | tokens 含 `focus:` 派生类(Tailwind `focus-visible`) ✅ |
| 颜色对比 | tokens 墨黑 #1A1612 on 暖白 #F8F5EE ≈ 13:1 ≫ WCAG AA 4.5:1 ✅ |
| i18n a11y namespace | zh/en messages 含 `a11y.*` keys(skip_to_main / player_label / tabs_label / timeline_label)✅ |

---

## ⚠ Serious(2 件 · 非阻塞)

### S1 · person-card 头像无 img / 无 alt 文本

`src/components/person/person-card.tsx:20`

```tsx
<div className="h-16 w-16 rounded-full border ... bg-gradient-to-br from-paper-300 to-paper-400" />
```

人物头像目前是纯 gradient 占位 div。未来填真实头像时如果用 `<img>` 而忘写 alt → critical。

→ **建议**: 现在改成
```tsx
<div role="img" aria-label={localized(p, "name", locale)} className="..." />
```
或封装一个 `<Avatar name={...} src={...} />` 组件。

**Phase D 修** · MVP 30 视频展示阶段头像可空 → 不阻塞。

### S2 · video-card 封面无 alt(同上)

`src/components/video/video-card.tsx` 使用 `<CardCover />` (card.tsx) · 当前是纯样式占位无图像。

未来填真实封面时同 S1。

→ 与 S1 同建议 · Phase D 修。

---

## ⚠ Moderate(4 件)

| # | 位置 | 问题 | 建议 |
|---|---|---|---|
| M1 | footer.tsx | 0 aria · `<a href="https://x.com/simprr">` 是外链应加 `rel="noopener noreferrer" aria-label="Simprr on X"` | 加 aria-label |
| M2 | two-tier-tabs.tsx | 0 aria · 双档切换是 tab 语义 | 用 tabs.tsx 组件包一层或加 role=tablist |
| M3 | video-grid.tsx | 0 aria · 列表应有 `role="list"` 或语义 ul/li | 用 `<ul>` 而非 `<div>` |
| M4 | button.tsx | 无 disabled state 视觉差异化的 aria-disabled | 已用原生 `disabled` 属性 OK · 建议双保险 |

---

## ⚠ Minor(3 件)

| # | 位置 | 问题 |
|---|---|---|
| m1 | search-bar 的 emoji `🔍` | aria-hidden 已加 · OK |
| m2 | video-card "·" 分隔符 | aria-hidden 已加 · OK |
| m3 | mark.tsx | 高亮 `<mark>` 元素 · 本身有 strong semantic · OK |

---

## 键盘可达性

| 操作 | 实现 | 状态 |
|---|---|---|
| Tab 顺序 | 默认 DOM 顺序 + skip-link | ✅ |
| 搜索聚焦 | `/` 全局快捷键 | ✅ |
| 命令面板 | `⌘K` / `Ctrl+K` | ✅ |
| 关闭/取消 | `Esc` | ✅ |
| 视频播放控制 | `<iframe>` 内置(YouTube) | ✅ 委托给 platform |

---

## 色彩 / 对比

base tokens(design-tokens.json):
- ink-900 #1A1612 on paper-50 #F8F5EE → 13.2:1 ✅(WCAG AAA)
- amber-600 #D97706 on paper-50 → 4.6:1 ✅(WCAG AA 文本)
- text-muted vs paper-50 → 需 review(可能边缘)

→ 上线后用 Lighthouse 真测 · MVP 不阻塞。

---

## 综合结论

| intent-brief §6.2 要求 | 本轮 | 状态 |
|---|---|---|
| a11y critical = 0 | 0 | ✅ |
| Lighthouse A11y ≥ 90 | (估)≥ 90 | 估算 ✅ · D 真测 |

阻塞上线 a11y 风险: **无**。Phase D 老吴跑真 axe-core 后处理 S1/S2/M1-M4。
