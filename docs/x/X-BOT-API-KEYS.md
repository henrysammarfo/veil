# X content bot — API keys & services

Side project for **Veil** + **Magmos Labs** social. You approve posts; the bot drafts, schedules, and monitors.

## Required (minimum viable)

| Key / access | Where to get it | Used for |
|--------------|-----------------|----------|
| **OpenAI API key** | [platform.openai.com](https://platform.openai.com/api-keys) | Hooks, threads, post variants, article drafts |
| **X API credentials** | [developer.x.com](https://developer.x.com) → Project → App | Read trends, post (if auto-post), analytics |

### X API tiers (pick one)

| Tier | Cost | Good for |
|------|------|----------|
| **Free** | $0 | Read-only + limited post — fine for **draft-only** bot (you paste manually) |
| **Basic** | ~$100/mo | Scheduled posting + more reads — needed for **24/7 auto-post** |

**For v1 (recommended):** Free tier + bot outputs drafts to a dashboard/Discord/Telegram. You post manually until Basic is worth it.

X keys you need (store in `.env`, never commit):

```env
X_API_KEY=
X_API_SECRET=
X_ACCESS_TOKEN=
X_ACCESS_TOKEN_SECRET=
X_BEARER_TOKEN=
```

Optional OAuth 2.0 user token if using newer v2 endpoints only.

---

## Strongly recommended

| Key | Where | Used for |
|-----|-------|----------|
| **OpenAI** (above) | — | Primary copywriter |
| **GitHub token** (`ghp_…` read-only) | github.com/settings/tokens | Pull Veil/Magmos changelogs for build-in-public posts |
| **Vercel token** (optional) | vercel.com/account/tokens | Deploy waitlist from CI |

---

## Research & scraping (free / local)

| Tool | API key? | Used for |
|------|----------|----------|
| **Tinyfish** | Your Tinyfish key | Trend pages, competitor landing pages, ad libraries (respect ToS) |
| **Qback AI (local)** | None (local) | Private brand memory, draft storage, voice rules |
| **Deskspace** | Per your setup | Workspace / scheduling if you wire it |

No free legal API gives “watch all YouTube/TikTok and learn edits.” v1 workflow:

1. Bot saves **manual** links you drop (or RSS/search snippets).
2. OpenAI summarizes patterns (hook length, cut pace, CTA).
3. You record screen + **DaVinci Resolve** (free) or CapCut.

---

## Video / voice (free tiers)

| Service | Key | Notes |
|---------|-----|-------|
| **ElevenLabs** | `ELEVENLABS_API_KEY` | Free tier ~10k chars/mo for VO |
| **Edge TTS** | None | Free Microsoft voices via local script |
| **YouTube Data API** | Google Cloud API key | Search + metadata only — not full “watch and learn” |

---

## Design / UI bot dashboard

| Tool | Key | Notes |
|------|-----|-------|
| **21st.dev MCP** | MCP config in Cursor | Component drafts for internal “command center” |
| **shadcn** | None | UI kit — already in Veil/Magmos stacks |

---

## Analytics (no key)

- **X Analytics** — native app (impressions, profile visits).
- **UTM on waitlist** — `?src=x_post1` on every link (no API needed).

---

## Suggested `.env` for `veil-x-bot` repo (future)

```env
# Copy generation
OPENAI_API_KEY=

# X — draft mode can skip posting keys initially
X_API_KEY=
X_API_SECRET=
X_ACCESS_TOKEN=
X_ACCESS_TOKEN_SECRET=
X_BEARER_TOKEN=

# Research
TINYFISH_API_KEY=

# Voice (optional)
ELEVENLABS_API_KEY=

# Accounts
VEIL_WAITLIST_URL=https://your-waitlist.vercel.app
VEIL_DEMO_URL=https://veil-reviewer.vercel.app
MAGOS_REPO=https://github.com/henrysammarfo/magmoslabs

# Brand
VEIL_X_HANDLE=
MAGOS_X_HANDLE=
```

---

## What to send me when we start building the bot

1. `OPENAI_API_KEY`
2. X developer app credentials (or say “draft-only, no post keys yet”)
3. Tinyfish key if you want automated research
4. Waitlist URL once deployed
5. Veil + Magmos X handles

Do **not** paste keys in chat — add to local `.env` or Cursor secrets.
