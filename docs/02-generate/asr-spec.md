# ASR Spec · 本地 Whisper · kdsj-world

> 运营机器跑 · 不上 Vercel · 不进 LLM 预算。

---

## 1. 工具选择

- **whisper.cpp** (推荐) 或 OpenAI `whisper` Python package
- 模型: `large-v3`(质量优先 · MVP 30 视频时间可接受)
- 平台: Alan 的 Mac(M 系列) · CoreML 加速

## 2. 安装

```bash
# whisper.cpp (Mac)
brew install whisper-cpp
# 下载 large-v3 模型(~3GB)
sh ./models/download-ggml-model.sh large-v3

# Python 兜底
pip install -U openai-whisper
brew install ffmpeg
```

## 3. 工作流

```bash
# 1. 下载视频音轨(yt-dlp)
yt-dlp -x --audio-format wav -o "%(id)s.%(ext)s" "https://youtube.com/watch?v=XXX"

# 2. 跑 ASR · 输出 SRT
whisper-cli -m models/ggml-large-v3.bin \
            -l auto \
            --output-srt \
            -of XXX \
            XXX.wav

# 输出: XXX.srt(双语原文 · auto detect 一般给英文转写)
```

## 4. 翻译策略

Whisper 只给**原文转写**(英文视频出英文 SRT)。中文摘要/观点/解释 = LLM 阶段生成,不依赖 Whisper 翻译。

> 若客户视频是中文原片(MVP 暂不收) · Whisper 出中文 SRT · 流程一致。

## 5. 与 S9 流水线对接

- SRT 文件命名: `<platform_id>.srt`,放 `data/subtitles/`(运营机器目录)
- ingest-video.ts 优先读 `--subtitle <path>` · 没有 → 调 YouTube caption API · 还没有 → 标 `whisper_needed` 终止

## 6. 性能预算(参考)

| 时长 | Mac M2 + large-v3 | M2 Pro |
|---|---|---|
| 30 min | ~3 min | ~2 min |
| 2 h | ~10 min | ~7 min |
| 30 视频(均 1.5 h) | ~1 晚批跑 | ~半天 |

## 7. 质量检查

- SRT 行数 > 50 · 时长覆盖 ≥ 视频 90%
- 抽 3 行人工核对(英文拼写 / 中文断句)
- 失败案例: 重音乐 / 多人重叠 → 标 `failed` · 用人工外字幕替代

## 8. 不上 Vercel 的原因

- Whisper local 单次 1-10 min CPU bound → 远超 Vercel function 60s 限
- 模型 3GB → 不可能进 deployment
- 隐私: 仅用公开内容,但保留本地处理弹性
- 预算: 0 美金 vs Replicate Whisper $0.0006/sec(30 视频 ≈ $50)

> Phase D 后若内容量级超 1000,可考虑 Replicate / fal.ai · MVP 不需要。
