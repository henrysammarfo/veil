# Veil X Bot

**Manual-post only** — researches videos, learns edit patterns, drafts X posts for **Veil** and **Magmos**. No auto-posting to X.

## Setup

```bash
cd tools/x-bot
cp .env.example .env
# Add OPENAI_API_KEY (required for analyze + draft)
npm install
```

From repo root:

```bash
npm run xbot help
```

## Watch & learn (YouTube)

Pulls captions via `youtube-transcript` (free, no Google API key), then OpenAI extracts hooks, pacing, music mood, stealable patterns.

```bash
npm run xbot watch "https://www.youtube.com/watch?v=VIDEO_ID"
npm run xbot watch "https://tiktok.com/..." --notes "Hook: POV you lost 5 dollars on chain"
npm run xbot watch-batch URL1 URL2 URL3
npm run xbot playbook
```

Learnings → `tools/x-bot/data/learnings/`  
Master playbook → `tools/x-bot/data/playbook/MASTER.md`

## Draft posts (you paste on X)

```bash
npm run xbot draft veil --topic "15m stealth order settled with real loss"
npm run xbot draft magmos --topic "AURUM forge on testnet"
npm run xbot calendar veil 7
```

## Dashboard

```bash
npm run xbot:serve
# → http://127.0.0.1:3947 — copy drafts, mark posted
```

## Media queues (free tiers)

Bot queues prompts + manual instructions when no API key:

| Command | Tool | Free tier |
|---------|------|-----------|
| `music "dark cyber beat 90bpm"` | Suno | suno.com |
| `heygen "script…"` | HeyGen | app.heygen.com |
| `kling "dashboard UI zoom"` | Kling | klingai.com |
| `hyperframes "speed ramp terminal"` | Hyperframes | hyperframes.ai |
| `veed "add captions"` | VEED | veed.io |
| `thumb "Veil stealth trading card"` | Nano/Gemini | image gen |

Jobs saved under `data/media/`.

## Architecture

```
URL → transcript (YouTube) / notes (TikTok,X)
    → OpenAI analysis → learnings DB
    → playbook aggregation
    → draft generator (Veil / Magmos voice)
    → dashboard (copy → manual X post)
```

## Env keys

See `.env.example` and `docs/x/X-BOT-API-KEYS.md`.

**Minimum:** `OPENAI_API_KEY`  
**Not needed for v1:** X API keys (manual post)

## Suggested daily loop

1. Drop 3 competitor/build-in-public URLs → `watch-batch`
2. `draft veil` with today's topic
3. `serve` → copy post
4. Paste on X + attach screen clip edited in DaVinci Resolve
5. Mark posted in dashboard
