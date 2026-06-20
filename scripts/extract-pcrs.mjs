#!/usr/bin/env node
/** Parse PCR0/1/2 from nitro-cli build output and write to .env */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const log = existsSync("nitro-build.log") ? readFileSync("nitro-build.log", "utf8") : "";
const eif = existsSync("veil-nitro.pcrs.json") ? readFileSync("veil-nitro.pcrs.json", "utf8") : "";

let pcr0, pcr1, pcr2;
for (const src of [eif, log]) {
  try {
    const j = JSON.parse(src);
    const m = j.Measurements || j.measurements || j;
    pcr0 = pcr0 || m.PCR0 || m.pcr0;
    pcr1 = pcr1 || m.PCR1 || m.pcr1;
    pcr2 = pcr2 || m.PCR2 || m.pcr2;
  } catch {
    /* not json */
  }
}
for (const m of log.matchAll(/"PCR([012])"\s*:\s*"([a-fA-F0-9]+)"/g)) {
  if (m[1] === "0") pcr0 = pcr0 || m[2];
  if (m[1] === "1") pcr1 = pcr1 || m[2];
  if (m[1] === "2") pcr2 = pcr2 || m[2];
}

const strip = (s) => String(s).replace(/^0x/i, "").toLowerCase();
pcr0 = pcr0 ? strip(pcr0) : null;
pcr1 = pcr1 ? strip(pcr1) : null;
pcr2 = pcr2 ? strip(pcr2) : null;

if (!pcr0 || !pcr1 || !pcr2) {
  console.error("Could not parse PCRs — see nitro-build.log");
  process.exit(1);
}

console.log("PCR0", pcr0.slice(0, 16) + "…");
console.log("PCR1", pcr1.slice(0, 16) + "…");
console.log("PCR2", pcr2.slice(0, 16) + "…");

const envPath = ".env";
let env = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
const set = (k, v) => {
  const line = `${k}=${v}`;
  env = new RegExp(`^${k}=.*$`, "m").test(env)
    ? env.replace(new RegExp(`^${k}=.*$`, "m"), line)
    : `${env.trimEnd()}\n${line}\n`;
};
set("VEIL_PCR0", pcr0);
set("VEIL_PCR1", pcr1);
set("VEIL_PCR2", pcr2);
writeFileSync(envPath, env);
console.log("Wrote VEIL_PCR0/1/2 to .env");
