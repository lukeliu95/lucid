# 10 · 风险登记册

> 自动生成 · GEI v4.1.0 · 2026-05-24T15:14Z
> 数据源: known_w_tickets · alan_concerns_before_launch · reflections · delivery-report §8 · round-001 §5(8 数据源综合)
> 自动化类型: ✅ 全自动(v4.3+)

## 已识别风险

| ID | 类别 | 描述 | 严重度 | 缓解措施 | 状态 |
|---|---|---|---|---|---|
| R-01 | 数据风险 | 30 视频中 27 个 platform_id 仍是 `<slug>_DRAFT` 占位 · Alan 必须上线前回填真 YouTube ID | **高** | round-001 改用 `_DRAFT` 后缀强制可见 · `grep _DRAFT src/db/seed.ts` 应返 0 才能上线 · 见 `runbook` Step 0 | 🟡 部分缓解 · Alan 必做 |
| R-02 | 质量风险 | N1 LLM 摘要准确率 ≥ 85% 未真测(Desk Evaluation · 25 cases seeded) | **高** | 上线后 24h 内 Alan 跑 `DEEPSEEK_API_KEY=$REAL_KEY npx tsx src/llm-eval-suite/run-all.ts` · 不达标改 prompt 走 round-002 | 🟡 留种 · 上线后跑 |
| R-03 | 评估风险 | 评估只用单一阈值 85% · 未做多指标校准(`calibrated_thresholds.per_metric` 缺失) | 中 | 用 N1+N2+N3 三北极星替代分别校准(MVP 简化)· 上线后真跑数据补 per-skill 阈值 | 🟡 接受 |
| R-04 | 系统性 / 工程风险 | W3 · `src/db/client.ts` 模块级 `neon()` · build 需 stub DATABASE_URL | 中(已修) | round-001 KEPT · lazy init · build 不再需要 stub | ✅ resolved |
| R-05 | 工程风险 | W4 · standalone tsc TS6046(`moduleResolution: bundler`)· Next 15 已知 upstream issue | 低(已绕) | KEPT-as-doc · 用 `next build` 内置 tsc 替代 · `docs/04-evolve/known-tsc-issue.md` | ✅ resolved |
| R-06 | 安全 / 收费风险 | W6 · `/api/search` 缺 rate-limit · 走 OpenAI embedding 计费 · 被刷会飙账单 | **高**(上线前) | round-001 KEPT · 接 `lib/rate-limit.ts`(已在 ai/chat 用)· 30/60s/IP · 429 + retry-after | ✅ resolved |
| R-07 | 工程风险 | W5 · favorites + admin/videos 现 stub `x-user-id` header · 未接 Clerk `auth()` | 中 | Clerk Marketplace 装好后切 `auth()` · Phase D round-002 候选(Alan 决策何时切) | 🟡 deferred |
| R-08 | 部署风险 | Vercel 部署时 Clerk Marketplace 集成异常 | 低 | bazi-studio 已成功跑通 · 复用配置 · runbook Step 1-3 9 步详细 | 🟡 prevented |
| R-09 | 运营风险 | Whisper 本地 ASR 性能不足(运营机器跑 28 视频) | 中 | `docs/02-generate/asr-spec.md` 已设跑批 · 28 视频也就 14 小时 | 🟡 接受 |
| R-10 | 进化 / 收敛风险 | round-001 单轮收尾 · 未跑 round-002+ · 复杂 prompt 调优场景未演练 | 低 | `codeloop_state.exit_reason = max_rounds_reached_per_brief` · maintain mode 设计如此 · 上线后真有数据再开 round-002 | 🟡 接受 |
| R-11 | 版权风险 | 不下载视频原片 · embed/外链 + 保留原作者(intent-brief §4 / PRD §12.4) | 中 | 30 条全有 `metadata.platform + platform_id + original_url` · video-detail 页"在 YouTube 看原片"外链 + 来源卡 | ✅ designed-in |
| R-12 | 性能风险 | Lighthouse Vercel prod 真测未跑 · 仅估算 LCP 1.8s / bundle 139KB | 中 | post-launch-checklist T+7d Lighthouse 真测 · 目标 Perf ≥80 / A11y ≥90 / BP ≥90 / SEO ≥90 | 🟡 上线后跑 |
| R-13 | 隐性风险 | 假设 30 视频中 ≥ 70% 有 YouTube 公开字幕 · 若不达,Whisper 工作量上升 | 中 | 选片清单 `content-plan.md` 已优先选大频道(Lex / Karpathy)字幕齐全 · 兜底 Whisper | 🟡 验证中 |

**排序**:严重度高(R-01, R-02, R-06)优先 · R-06 已 resolved · R-01 R-02 是 Alan 上线前/上线后必做 2 件事。

## pipeline 中命中的 pitfall

> 来源: `gei-memory` retrieved_memory_entries 与 reflections 关键词匹配

**本次 pipeline 未显式记录 pitfall hit**(`retrieved_memory_entries = {}`)。

隐性命中的 GEI pattern(从 reflections + round-001 反推):

- **MVP 砍到见骨**(intent-brief K1-K8 砍 8 条)· 对应 GEI 常见 pitfall "scope 过宽"
- **Edge Function key 隔离**(沿用 bazi-studio)· 对应 "key 泄漏"
- **Desk Evaluation 模式**(无 LLM key 时不强跑真测)· 对应 "评估期烧 token 预算"

## 未解决风险

| ID | 描述 | 责任 / 何时 |
|---|---|---|
| R-01 | 27 视频 `_DRAFT` 回填 | Alan · 上线前(`deployment-runbook.md` Step 0) |
| R-02 | LLM eval 真测 25 cases | Alan · 上线后 24h(`llm-eval-execution-plan.md`) |
| R-07 | W5 Clerk `auth()` 接管 | Alan · 时机未定 · round-002+ 候选 |
| R-12 | Lighthouse prod 真测 | Alan · T+7d(`post-launch-checklist.md`) |

## 建议的持续监控项

> 来源:funnel_diagnosis 汇总 + `post-launch-checklist.md` 24h/7d/30d 清单

1. **OpenAI 账单**(每日)· 若 > $1 → W6 rate-limit 30→10/60s · 防 R-06 复发
2. **DeepSeek 账单**(每日)· ingest 后不应再涨 · 涨了说明出了未预期 LLM 调用
3. **LLM 摘要准确率**(每周 5-10 cases 抽检)· N1 北极星跌破 85% → round-002 prompt 调优
4. **Vercel logs 5xx 率**(每日)· > 1% → 排查 DB 连接 / Clerk session / 编码异常
5. **Vercel Analytics LCP**(每日)· 首页 > 2.5s 或详情页 > 3s → check bundle 是否回归
6. **收藏功能 401 比例**(W5 stub 期)· 异常说明 stub `x-user-id` 漏跑 · 接 Clerk `auth()` 时机
