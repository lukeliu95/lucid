# Interaction Spec · kdsj-world

> 6 大关键交互 · 含状态机 + 时序 · 小赵照此实现

---

## I-01 · 2 档解释 Tab 切换(详情页)

**触发**: 点击 `[成人速懂] | [深度版]` tab

**状态机**:
- `default`: 两个 tab 等权,左 active 暖橘下划线 + 墨黑 text
- `hover`(非 active): tab text 颜色 ink-700 → ink-900 + 暖橘下划线 50% 透明
- `active`: 内容容器 opacity 0 → 1(150ms ease-out)· 上一个内容立刻替换(无 fade-out 避免抖)
- `keyboard`: ← / → 切 tab · Tab 键进入内容
- `loading`(理论不出现 · 内容已预加载)

**a11y**: `role="tablist"` / `role="tab"` / `role="tabpanel"` · `aria-selected` 同步

**无 layout shift**: tab content 容器 `min-height: 600px`(深度版 wax case)

**默认值**: `quick`(成人速懂)· URL hash `#quick` / `#deep` 持久化

---

## I-02 · 时间轴跳秒(详情页侧栏)

**触发**: 点击节点 timestamp

**时序**:
```
0ms     用户点节点 N(seconds=204)
0ms     UI: 节点 N 切 active 状态(暖橘 left-border 3px + bold)
0ms     上一个 active 节点降级
50ms    postMessage to iframe: { event: 'command', func: 'seekTo', args: [204, true] }
        (YouTube IFrame API)
        // Bilibili: postMessage 'pause' + 'seek' 2 步
~300ms  iframe 跳秒 + 自动播放
250ms   节点 active 高亮动画完成(平滑 border 出现)
```

**降级**: 若 iframe 不支持 postMessage(B 站某些场景)→ 跳到带 `?t=204` 的外链 · toast "在 YouTube 跳到 3:24 ↗"

**滚动**: 跳秒 + 主内容自动滚动到一句话总结(`#summary`),让用户既能听又能读

**鼠标 hover** 节点: 节点 + 一句摘要短暂展开(150ms slide-down)

---

## I-03 · 双语切换(LocaleToggle · 全站)

**触发**: 点击 `zh | en` toggle

**时序**:
```
0ms    用户点 en
0ms    UI: toggle 切高亮(暖橘 active)
20ms   Next.js router.push('/en/<same-path>')
       ↓ next-intl Server Component 重新渲染
~150ms 内容刷新(无 FOUC · server-rendered)
```

**无 layout shift 关键**:
- 标题容器 `min-height: 80px`(中英标题高差)
- 卡片 `min-height: 320px`(卡片整体)
- LocaleToggle 自身宽度固定 80px

**持久化**: 用户首次选择写入 cookie `NEXT_LOCALE` · next-intl middleware 接管后续

**首访默认**: Accept-Language header 头判定 · `zh-CN/zh-*` → zh · 其他 → en

---

## I-04 · 全局搜索

**触发**:
- 点击 header 搜索框
- 快捷键 `/` 或 `⌘K` 聚焦
- ESC 关闭(失焦或清空)

**输入时序**:
```
keyup    用户输入 "ag"
0ms      显示历史搜索(localStorage 最近 5 条)
300ms    debounce 后 fetch /api/search/suggest?q=ag
~500ms   下拉显示建议(标题命中 top 5)
Enter    跳转 /search?q=ag(完整结果页)
```

**结果页**:
- toggle 关键词 / 语义 → URL `?mode=keyword|semantic`(默认 keyword)
- 输入框已填 query · 修改后 ↩ 重新搜
- 空结果:推荐主题胶囊
- 加载:三段 skeleton 各 2 行

**a11y**: 搜索框 `role="searchbox"` · 下拉建议 `role="listbox"` · 结果区 `aria-live="polite"` 通报

---

## I-05 · 收藏

**未登录态**:
```
点心标 → 心标快速变满 200ms(乐观 UI)
       → 立刻 toast "登录后可永久收藏" + CTA[登录]
       → 1.5s 后心标回空(乐观回滚)
       → CTA 点击跳 /login?redirect=/v/[slug]
```

**已登录态**:
```
点心标空 → 立刻填满(乐观)+ POST /api/favorites
         → 200 OK → 保持填满 · 微动画 pulse 一次
         → 失败 → 回空 + toast "网络错误 · 重试"

点心标满 → 立刻变空 + DELETE /api/favorites/{video_id}
         → 同步
```

**位置**: 详情页标题下 + 卡片 hover 右上角

---

## I-06 · 运营状态轮询(`/admin`)

**列表轮询**:
```
mount   GET /api/admin/videos
30s     再次 GET(轮询)
        每条 row status 列实时刷新色块
unmount 停止
```

**状态色块**(`StatusBadge`):
| status | bg | text | label key |
|---|---|---|---|
| pending | ink-300 | ink-900 | admin.status.pending |
| asr_done | info(#1E40AF 10% bg) | info | admin.status.asr_done |
| ai_done | success(#15803D 10% bg) | success | admin.status.ai_done |
| failed | error(#B91C1C 10% bg) | error | admin.status.failed |

**新视频提交**:
```
表单 submit → button 切 loading "处理中…"
            → POST /api/admin/videos
            → 200 OK → 跳转 /admin/videos/{id}/status
            → 该详情页开始 5s 轮询(更紧)直到 ai_done|failed
```

**状态文案双语化** · 列在 i18n-keys.md §10

---

## 通用状态(所有组件)

每个交互元素必须有:
- `default`
- `hover` — 颜色加深 1-2 级 + 暖橘下划线/border
- `active` — 文本暖橘 + 当前页或当前 tab indicator
- `focus-visible` — 暖橘 3px focus ring(token: shadow.focus)
- `disabled` — opacity 0.5 + cursor not-allowed
- `loading` — skeleton 或 spinner(衬线大字慎用 spinner · 用 dot-pulse)

---

## 性能与体验硬约束

- 任何交互不超过 100ms 首响应(乐观 UI)
- API 响应 > 300ms 必须有 skeleton / spinner
- 切语言 / 切 tab 不能引起 page-level layout shift(CLS < 0.05)
- 时间轴跳秒成功率 ≥ 95%(剩 5% 走外链兜底)
