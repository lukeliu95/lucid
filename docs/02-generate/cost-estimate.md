# Cost Estimate · kdsj-world

> MVP 规模:30 视频 · 双语预生成 · 单次全量 + 后续增量。

---

## 1. 单视频成本(双语 LLM 预生成)

详细推导见 `pipeline-spec.md` § 5。摘要:

| 服务 | 单视频成本 | 调用次数 |
|---|---|---|
| DeepSeek-v4-pro (S1+S2+S3+S4) | $0.017 | 11 |
| OpenAI text-embedding-3-small | $0.00002 | 1 |
| **合计** | **$0.017** | **12** |

## 2. MVP 全量预生成(30 视频)

- LLM 调用合计: **~$0.51 USD**
- 在线请求(用户访问 `/api/videos`): **$0**(不调 LLM)
- 实测预算上限设 **$3**(留 6x 容错)

## 3. 在线运行成本(月度估算)

| 项 | 单价 | 月用量预估 | 月成本 |
|---|---|---|---|
| Vercel Hobby | $0 | < 100GB BW | $0 |
| Neon Free Tier | $0 | < 0.5GB storage | $0 |
| Clerk Free Tier | $0 | < 10k MAU | $0 |
| DeepSeek (chat 端点 · MVP 关) | — | 0 | $0 |
| OpenAI embeddings (搜索) | $0.02/M tokens | ~10k search queries × 100 token | $0.02 |
| **合计 · 月** | | | **~$0** |

> MVP 阶段几乎零成本,唯一付费是 embeddings(忽略不计)。

## 4. 上线后扩容预算(假设 v1.1 100 视频 / 1k MAU)

| 项 | 月成本 |
|---|---|
| LLM 增量(新增 70 视频) | ~$1.2(一次性) |
| Embedding queries 增量 | $0.2 |
| Vercel Pro(若需要) | $20 |
| Neon Pro(若超额) | $19 |
| **月** | **~$40** |

## 5. 警戒线(自动告警 · Phase D 巡检)

- DeepSeek 月支出 > $5 → 告警(说明被滥用 / 或上了 chat 端点)
- OpenAI embeddings 月支出 > $2 → 告警
- Vercel BW > 80GB → 告警(图片优化 / cache 不够)
- Neon storage > 0.4GB → 告警(看 pipeline_runs 是否爆表)

## 6. 关键决策回顾

| 决策 | 替代方案 | 省钱量 |
|---|---|---|
| 双语**预生成**(非运行时翻译) | 每次访问调 LLM 翻译 | -99% (从 ~$100/month 降到 $0) |
| Whisper **本地** | Replicate Whisper API | -$50 / 30 视频 |
| DeepSeek-v4-pro (vs GPT-4o) | GPT-4o | -90% (DeepSeek 价格约 1/10) |
| OpenAI embed (vs DeepSeek embed) | DeepSeek 暂无原生 embedding | (无法替代,Alan 已拍板) |
| Edge Function key 服务端 | 客户端调 LLM | 防 key 泄漏,无穷大省钱 |
