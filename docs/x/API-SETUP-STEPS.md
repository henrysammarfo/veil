# API setup — step by step (free tiers first)

Keys go in `tools/x-bot/.env` only. Never commit.

## Already configured (you)

| Service | Status |
|---------|--------|
| OpenAI | In `.env` — **rotate key** (was pasted in chat) |
| TinyFish | In `.env` — **rotate key** (was pasted in chat) |

## TinyFish MCP (Cursor — for agent research)

Run once in terminal:

```powershell
npx -y install-mcp@latest https://agent.tinyfish.ai/mcp --client cursor
```

First use → browser OAuth. Search/fetch are **free** on all accounts.

In Cursor, prefer TinyFish MCP over generic web search for trends and page fetch.

CLI (optional):

```powershell
npm install -g @tiny-fish/cli
tinyfish auth login --source cli
tinyfish search query "sui overflow 2026"
```

## Suno (music — free tier)

1. Go to [suno.com](https://suno.com) → sign up
2. Free credits daily for song generation
3. No stable public API on free tier → use bot command:
   ```bash
   npm run xbot music "dark minimal cyber 90bpm no vocals"
   ```
4. Download MP3 → import to CapCut/DaVinci

Optional paid API: add `SUNO_API_KEY` when/if you upgrade.

## HeyGen (avatar clips — free tier)

1. [app.heygen.com](https://app.heygen.com) → sign up
2. Free minutes/month for avatar video
3. `npm run xbot heygen "30 sec script about stealth execution"`
4. Export 9:16 → attach to X post

API: Dashboard → API → create key → `HEYGEN_API_KEY` in `.env`

## Kling AI (b-roll video)

1. [klingai.com](https://klingai.com) → sign up
2. Free credits on signup
3. `npm run xbot kling "terminal UI zoom dark mode"`
4. 5s clips as b-roll under screen recording

## Hyperframes (speed ramps)

1. [hyperframes.ai](https://hyperframes.ai) → sign up
2. Free tier for UI motion / speed ramps
3. `npm run xbot hyperframes "dashboard walkthrough speed ramp"`

## VEED (captions)

1. [veed.io](https://www.veed.io) → free plan
2. Upload screen recording → auto captions → export for X
3. `npm run xbot veed "add bold captions crypto style"`

## Hugging Face (optional fallback)

1. [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) → read token
2. `HUGGINGFACE_API_KEY=hf_...` in `.env`

## X / Twitter (manual post — no keys needed)

You paste drafts yourself. Optional later:

- [developer.x.com](https://developer.x.com) → Free tier for **read analytics only**
- Do **not** need posting keys for v1

## CapCut / DaVinci (editor — no API)

**Learn editing via bot:**

```bash
# YouTube CapCut tutorials → auto-learn
npm run xbot watch "https://www.youtube.com/watch?v=CAPCUT_TUTORIAL_ID"
npm run xbot watch-batch $(Get-Content tools/x-bot/seeds/capcut-tutorials.txt)
```

Bot extracts: cut pace, text overlay style, transition patterns → playbook.

**Edit workflow:**

1. Screen record Veil demo (OBS, free)
2. `npm run xbot music "..."` → Suno track
3. CapCut desktop (free) or DaVinci Resolve (free)
4. Apply patterns from `data/playbook/MASTER.md`

## TikTok + X learning

```bash
# TikTok — TinyFish tries to fetch page text; else add notes
npm run xbot watch "https://www.tiktok.com/@user/video/123" --notes "hook: POV you..."

# X post thread
npm run xbot watch "https://x.com/user/status/123"

# Find viral refs first
npm run xbot trends
npm run xbot search "sui build in public viral"
```

## Waitlist URL (in 7 days)

When Vercel waitlist deploy is live, add to `.env`:

```
VEIL_WAITLIST_URL=https://your-short-domain.com
```

Drafts will auto-include `?src=x_postN` UTM.
