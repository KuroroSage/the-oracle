#!/usr/bin/env node
// Renders the day's consensus board as a postable PNG + drafts the post copy.
// Usage: node scripts/daily-edition.mjs [YYYY-MM-DD]   (defaults to today UTC)
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const d = process.argv[2] || new Date().toISOString().slice(0, 10);
const day = String(Math.max(1, Math.round((new Date(d + "T00:00:00Z") - new Date("2026-07-03T00:00:00Z")) / 864e5) + 1)).padStart(3, "0");

const URL_ = "https://hzasywatskzapyfegnfb.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6YXN5d2F0c2t6YXB5ZmVnbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNDUyNjMsImV4cCI6MjA5ODYyMTI2M30.CYFw_1qVkIUcAXIM0cCrIwlfzS8mEQRP-M6dwlnFvB8";
const qs = await (await fetch(`${URL_}/rest/v1/public_dashboard?select=*&publish_date=eq.${d}&order=domain.asc`, {
  headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
})).json();
if (!qs.length) { console.error(`no questions published for ${d}`); process.exit(1); }

mkdirSync(ROOT + "editions", { recursive: true });
const png = `${ROOT}editions/day-${day}-${d}.png`;

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (!existsSync(CHROME)) { console.error("Chrome not found — needed to render the PNG"); process.exit(1); }
execFileSync(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  "--window-size=1200,675", "--virtual-time-budget=9000",
  `--screenshot=${png}`,
  `file://${ROOT}apps/web/edition.html?d=${d}`,
], { stdio: "pipe" });

const line = (q) =>
  `[${q.domain}] ${q.title} — ` +
  (q.status === "resolved" ? `${q.outcome ? "YES" : "NO"} (crowd said ${q.crowd_percent ?? "—"}%)`
    : q.crowd_percent == null ? `sealed (${q.n} of 5)`
    : `${q.crowd_percent}% (n=${q.n})`);

const post = `THE ORACLE — Day ${day}

What the people building AI believe:

${qs.slice(0, 3).map(line).join("\n\n")}

Three questions a morning, inside your coding agent. 60 seconds. No money, ever — reputation.

https://aimmo-oracle.vercel.app`;

writeFileSync(`${ROOT}editions/day-${day}-${d}.txt`, post);
console.log(`wrote editions/day-${day}-${d}.png + .txt — post the PNG with the text. Every morning, no exceptions.`);
