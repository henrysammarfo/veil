import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { DATA_DIR, assertDataDir } from "./config.js";

export interface VideoLearning {
  id: string;
  url: string;
  platform: "youtube" | "tiktok" | "x" | "other";
  title: string;
  channel?: string;
  analyzedAt: number;
  transcriptSnippet: string;
  analysis: VideoAnalysis;
}

export interface VideoAnalysis {
  summary: string;
  hookPattern: string;
  pacing: string;
  editStyle: string;
  textOverlays: string;
  musicMood: string;
  ctaStyle: string;
  nicheTags: string[];
  stealablePatterns: string[];
  veilAngles: string[];
  suggestedSunoPrompt?: string;
  suggestedBroll?: string[];
}

export interface PostDraft {
  id: string;
  brand: "veil" | "magmos";
  createdAt: number;
  topic: string;
  hook: string;
  body: string;
  thread?: string[];
  hashtags: string[];
  mediaNotes: string;
  status: "draft" | "posted" | "skipped";
  utm: string;
}

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function writeJson(path: string, data: unknown): void {
  writeFileSync(path, JSON.stringify(data, null, 2), "utf8");
}

export function saveLearning(learning: VideoLearning): void {
  assertDataDir();
  writeJson(join(DATA_DIR, "learnings", `${learning.id}.json`), learning);
}

export function listLearnings(): VideoLearning[] {
  assertDataDir();
  const dir = join(DATA_DIR, "learnings");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson<VideoLearning>(join(dir, f))!)
    .filter(Boolean)
    .sort((a, b) => b.analyzedAt - a.analyzedAt);
}

export function saveDraft(draft: PostDraft): void {
  assertDataDir();
  writeJson(join(DATA_DIR, "drafts", `${draft.id}.json`), draft);
}

export function listDrafts(): PostDraft[] {
  assertDataDir();
  const dir = join(DATA_DIR, "drafts");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson<PostDraft>(join(dir, f))!)
    .filter(Boolean)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function updateDraftStatus(id: string, status: PostDraft["status"]): boolean {
  const path = join(DATA_DIR, "drafts", `${id}.json`);
  const d = readJson<PostDraft>(path);
  if (!d) return false;
  d.status = status;
  writeJson(path, d);
  return true;
}

export function savePlaybook(md: string): void {
  assertDataDir();
  writeFileSync(join(DATA_DIR, "playbook", "MASTER.md"), md, "utf8");
}

export function readPlaybook(): string {
  const p = join(DATA_DIR, "playbook", "MASTER.md");
  return existsSync(p) ? readFileSync(p, "utf8") : "";
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
