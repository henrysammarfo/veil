#!/usr/bin/env npx tsx
import { hasOpenAI } from "./config.js";
import { watchVideo, buildPlaybook, watchMany } from "./video/watch.js";
import { generateDraft, generateCalendar, formatDraftForCopy } from "./generate/draft.js";
import {
  queueSunoMusic,
  queueHeyGen,
  queueKling,
  queueHyperframes,
  queueVeed,
  queueNanoBanana,
} from "./media/providers.js";
import { listLearnings, listDrafts } from "./store.js";
import { startServer } from "./server.js";
import type { BrandKey } from "./brands.js";

function usage(): void {
  console.log(`
Veil X Bot — manual drafts + video learning (no auto-post)

  watch <url> [--notes "…"]     Analyze YouTube/TikTok/X link → learnings DB
  watch-batch <url> [url…]      Analyze multiple URLs + rebuild playbook
  playbook                        Rebuild MASTER.md from learnings
  draft <veil|magmos> [--topic]   Generate post draft
  calendar <veil|magmos> [days]   Generate N daily drafts (default 7)
  list                            List drafts + learnings counts
  serve                           Local dashboard :3947

Media queues (free-tier manual workflow + API hooks):
  music "<prompt>"                Suno queue
  heygen "<script>"               HeyGen avatar
  kling "<prompt>"                Kling b-roll
  hyperframes "<prompt>"          Hyperframes motion
  veed "<notes>"                  VEED captions workflow
  thumb "<prompt>"                Nano / image thumbnail

Env: copy tools/x-bot/.env.example → tools/x-bot/.env
`);
}

function argFlag(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

async function main(): Promise<void> {
  const [, , cmd, ...rest] = process.argv;
  if (!cmd || cmd === "help" || cmd === "-h") {
    usage();
    return;
  }

  switch (cmd) {
    case "watch": {
      const url = rest[0];
      if (!url) throw new Error("URL required");
      const notes = argFlag(rest, "--notes");
      const learning = await watchVideo(url, notes);
      buildPlaybook();
      console.log(JSON.stringify(learning, null, 2));
      if (!hasOpenAI()) console.warn("\n⚠ Set OPENAI_API_KEY for full analysis");
      break;
    }
    case "watch-batch": {
      if (!rest.length) throw new Error("URLs required");
      await watchMany(rest.filter((a) => !a.startsWith("--")));
      console.log(`Analyzed ${rest.length} videos. Playbook updated.`);
      break;
    }
    case "playbook": {
      console.log(buildPlaybook());
      break;
    }
    case "draft": {
      const brand = (rest[0] as BrandKey) || "veil";
      const topic = argFlag(rest, "--topic");
      const d = await generateDraft({ brand, topic });
      console.log(formatDraftForCopy(d));
      break;
    }
    case "calendar": {
      const brand = (rest[0] as BrandKey) || "veil";
      const days = Number(rest[1] || 7);
      const drafts = await generateCalendar(brand, days);
      console.log(`Created ${drafts.length} drafts. Open dashboard: npm run xbot:serve`);
      break;
    }
    case "list": {
      console.log(`Drafts: ${listDrafts().length}, Learnings: ${listLearnings().length}`);
      break;
    }
    case "serve": {
      startServer();
      break;
    }
    case "music": {
      console.log(queueSunoMusic(rest.join(" ")));
      break;
    }
    case "heygen": {
      console.log(queueHeyGen(rest.join(" ")));
      break;
    }
    case "kling": {
      console.log(queueKling(rest.join(" ")));
      break;
    }
    case "hyperframes": {
      console.log(queueHyperframes(rest.join(" ")));
      break;
    }
    case "veed": {
      console.log(queueVeed(rest.join(" ")));
      break;
    }
    case "thumb": {
      console.log(queueNanoBanana(rest.join(" ")));
      break;
    }
    default:
      usage();
      process.exit(1);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
