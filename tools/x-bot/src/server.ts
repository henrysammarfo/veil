import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { env, XBOT_PORT } from "./config.js";
import { listDrafts, listLearnings, readPlaybook, updateDraftStatus } from "./store.js";
import { formatDraftForCopy } from "./generate/draft.js";

const app = new Hono();

function page(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<style>
  *{box-sizing:border-box}body{font-family:system-ui,sans-serif;background:#0a0a0b;color:#e8e8ea;margin:0;padding:24px;max-width:900px}
  h1{font-size:1.5rem}a{color:#f59e0b}nav a{margin-right:16px}
  .card{border:1px solid #333;border-radius:12px;padding:16px;margin:12px 0;background:#141416}
  pre{white-space:pre-wrap;font-size:13px;background:#0f0f11;padding:12px;border-radius:8px}
  button{background:#f59e0b;color:#000;border:none;padding:8px 14px;border-radius:8px;cursor:pointer;font-weight:600}
  .muted{color:#888;font-size:12px}
  textarea{width:100%;min-height:120px;background:#0f0f11;color:#eee;border:1px solid #333;border-radius:8px;padding:10px}
</style></head><body>
<nav><a href="/">Drafts</a><a href="/learn">Learnings</a><a href="/playbook">Playbook</a></nav>
${body}</body></html>`;
}

app.get("/", (c) => {
  const drafts = listDrafts();
  const cards = drafts
    .map(
      (d) => `<div class="card">
        <div class="muted">${d.brand} · ${d.status} · ${new Date(d.createdAt).toLocaleString()}</div>
        <strong>${d.hook}</strong>
        <pre id="d-${d.id}">${escapeHtml(formatDraftForCopy(d))}</pre>
        <button onclick="navigator.clipboard.writeText(document.getElementById('d-${d.id}').innerText)">Copy for X</button>
        ${d.status === "draft" ? `<form method="post" action="/draft/${d.id}/posted" style="display:inline"><button type="submit">Mark posted</button></form>` : ""}
      </div>`,
    )
    .join("");
  return c.html(page("X Bot", `<h1>Drafts (manual post)</h1><p class="muted">Copy → paste on X. No auto-post.</p>${cards || "<p>No drafts. Run: npm run xbot draft veil</p>"}`));
});

app.get("/learn", (c) => {
  const items = listLearnings();
  const cards = items
    .map(
      (v) => `<div class="card">
        <strong>${escapeHtml(v.title)}</strong>
        <div class="muted">${v.platform} · ${escapeHtml(v.url)}</div>
        <p>${escapeHtml(v.analysis.summary)}</p>
        <p><b>Hook:</b> ${escapeHtml(v.analysis.hookPattern)}</p>
        <p><b>Steal:</b> ${v.analysis.stealablePatterns.map(escapeHtml).join(" · ")}</p>
      </div>`,
    )
    .join("");
  return c.html(page("Learnings", `<h1>Video learnings</h1>${cards || "<p>Run: npm run xbot watch &lt;youtube-url&gt;</p>"}`));
});

app.get("/playbook", (c) => {
  const md = readPlaybook() || "Run: npm run xbot playbook";
  return c.html(page("Playbook", `<h1>Master playbook</h1><pre>${escapeHtml(md)}</pre>`));
});

app.post("/draft/:id/posted", async (c) => {
  updateDraftStatus(c.req.param("id"), "posted");
  return c.redirect("/");
});

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function startServer(port = Number(env("XBOT_PORT") || XBOT_PORT)): void {
  const p = port || 3947;
  serve({ fetch: app.fetch, port: p }, () => {
    console.log(`X Bot dashboard → http://127.0.0.1:${p}`);
  });
}
