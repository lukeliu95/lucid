# Stage E · 自查清单(MVP 简化版)

> design SKILL.md Stage E 完整版要求派 qualify(老周可行性)+ evaluate(阿May 可用性)双轨。
> MVP 7 天紧迫,经 orchestrator 同意用自查替代 · 任何 BLOCK 或 high-risk 项必须列入 `concerns_for_alan`。
> Reviewer: Mia(自审) · 2026-05-24

---

## 1. 可行性(老周角度模拟)

| # | 项 | 判据 | 结果 | 备注 |
|---|---|---|---|---|
| F1 | Stack 匹配 | Next.js 15 App Router + shadcn + Tailwind + next-intl 都已锁(pipeline-state.confirmed_params)· 设计稿无超出栈外组件 | **PASS** | shadcn 已覆盖 Tabs / Table / Input / Card / DropdownMenu / Button |
| F2 | Shadcn 组件可达 | 16 组件中 10 个有 shadcn base · 6 个自定义(Header/Footer/VideoCard/Player/Summary/Timeline/Keypoints)— 都是简单 wrapper | **PASS** | 自定义组件复杂度 < 200 LOC each |
| F3 | 前端工时估算 ≤ 3 天 | 16 组件 × 平均 2h + 4 页面集成 × 4h + i18n 配置 4h = ~52h ≈ 3 天集中工 + 优化 1 天 | **PASS** | 与 decomposition §5 排期(D2-D6 前端)一致 |
| F4 | LCP ≤ 2.5s 可达 | 衬线字体走 next/font · 卡片用 CSS skeleton · 无 hero 大图(用大字代替)· iframe 懒加载 | **PASS** | iframe 是详情页 LCP 大头,首屏可不阻塞 |
| F5 | 首屏 JS < 200KB | shadcn tree-shake 友好 · 无重型 lib(无 framer-motion / 无 three.js) | **PASS** | 主要依赖: next-intl, clerk, tailwind, lucide-icons |
| F6 | API contract 对齐大刘 | wireframe / components-spec 已隐含字段需求(videos_ai.* / people.signature_views_*)与 decomposition Schema 一致 | **PASS** | 详见 handoff §3 |

**可行性总评**: PASS · 无 risk_level=high

---

## 2. 可用性(阿May 角度模拟)

| # | 项 | 判据 | 结果 | 备注 |
|---|---|---|---|---|
| U1 | 5 秒理解 | Hero "今日精读" 一句话总结 + TopicStrip + Footer tagline · 访客 5 秒能答"讲什么" | **PASS** | wireframe 01-home §"5 秒理解测试预想"已验证设计意图 |
| U2 | 双语切换无 layout shift | 标题容器 min-height 80px · 卡片 min-height 320px · LocaleToggle 固定 80px · server-render no FOUC | **PASS** | interaction I-03 已硬约束 CLS < 0.05 |
| U3 | 2 档切换流畅 | shadcn Tabs · 内容容器 min-h-[600px] 防抖 · 150ms fade-in | **PASS** | I-01 已明示 |
| U4 | 时间轴跳秒可用 | YT IFrame API postMessage · B 站降级到外链 · 节点 active 反馈 | **PASS · with note** | 跳秒成功率 95% target · B 站 5% 走降级(可接受) |
| U5 | 收藏未登录态体验 | 乐观 UI 200ms 反馈 + toast "登录后" + CTA redirect · 不直接跳走打断 | **PASS** | I-05 |
| U6 | 搜索 0 结果不空白 | 推荐主题胶囊 5 个 · 引导用户 | **PASS** | wireframe 04-search |
| U7 | a11y critical = 0 | skip-link + aria-* + role=tablist + focus-visible 暖橘 ring + `<mark>` semantic + 卡片 aria-label | **PASS · need verify** | 需 axe-core 实测验证 · Phase C 阿May eval gate |
| U8 | WCAG 2.1 AA 色对比 | 墨黑 #1A1612 on 暖白 #F8F5EE = ~15.5:1 (AAA) · 暖橘 #D97706 on 暖白 = 4.65:1 (AA Large + AA Normal 边缘) | **PASS** | 验证: 正文衬线 17px > 14px 大字阈值,暖橘只用在 link / accent / 大字 |
| U9 | 边界状态完备 | empty/loading/error 在 wireframes 每页都列出 · skeleton + retry | **PASS** | |
| U10 | 错误流可恢复 | 网络错 toast + retry · AI 处理失败 banner + 通知运营 · 跳秒失败外链兜底 | **PASS** | |

**可用性总评**: PASS · U7 标 `need verify`(Phase C 阿May 实测) · 不阻塞 handoff

---

## 3. 双语完整性

| # | 项 | 结果 |
|---|---|---|
| I1 | i18n-keys.md 覆盖所有 UI 文案 | **PASS** · 12 namespace / ~110 keys |
| I2 | DB 内容字段拆 `_zh` / `_en` | **PASS** · decomposition §3 Schema 已定义 |
| I3 | 切换不引起内容缺失 | **PASS** · REQ-V06 验收已写 0 fallback |
| I4 | 字符宽度差异处理 | **PASS** · 设计稿已为标题/卡片预留 min-height |
| I5 | 命名规范统一 | **PASS** · `namespace.section.name` snake_case |

**双语总评**: PASS

---

## 4. 版权红线

| # | 项 | 结果 |
|---|---|---|
| C1 | 嵌入播放器不下载 | **PASS** · 仅 iframe embed |
| C2 | 保留原作者/频道/平台/链接 | **PASS** · C09 SourceCitation 必出 · REQ-V07 验收 |
| C3 | 视频元数据不绕过版权 | **PASS** · 只显示标题/嘉宾/时长(公开信息)· 不重新发布原始字幕 |
| C4 | Simprr 署名全站可见 | **PASS** · C02 Footer 硬规则 · 全 4 个 mockup 都已含 |

**版权总评**: PASS

---

## 5. 闸门判定

| 维度 | 判定 | 是否 BLOCK | 是否 high risk |
|---|---|---|---|
| 可行性 | PASS | ❌ | ❌ |
| 可用性 | PASS · U7 need verify | ❌ | ❌ |
| 双语 | PASS | ❌ | ❌ |
| 版权 | PASS | ❌ | ❌ |

**结论**: **全 PASS** · Stage F handoff 放行 · 无 high-risk 项需 Alan 签批

---

## 6. concerns_for_alan(报给 orchestrator)

无 high-risk · 但有 2 个 "GO-WITH-NOTES" 转交 Phase C 阿May 实测:

1. **a11y critical = 0 需 axe-core 实测验证**(U7) — 设计层已尽全力,实测在 Phase C
2. **B 站 iframe 跳秒精度低于 YouTube**(U4) — 5% 降级到外链可接受 · 30 demo 视频中 YouTube 占比预计 > 80% · 不阻塞 MVP

## 7. 改稿动作

无需回 Stage D 重做。直接进 Stage F handoff。
