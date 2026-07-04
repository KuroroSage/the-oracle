#!/usr/bin/env node
// Founder metrics vs the pre-committed bars. Usage: node scripts/pulse.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const env = Object.fromEntries(
  readFileSync(ROOT + ".env", "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const URL_ = "https://hzasywatskzapyfegnfb.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6YXN5d2F0c2t6YXB5ZmVnbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNDUyNjMsImV4cCI6MjA5ODYyMTI2M30.CYFw_1qVkIUcAXIM0cCrIwlfzS8mEQRP-M6dwlnFvB8";

const res = await fetch(`${URL_}/rest/v1/rpc/pulse`, {
  method: "POST",
  headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" },
  body: JSON.stringify({ p_admin_key: env.ORACLE_ADMIN_KEY }),
});
if (!res.ok) { console.error(await res.text()); process.exit(1); }
const p = await res.json();

console.log(`THE ORACLE · pulse · ${new Date().toISOString().slice(0, 10)}`);
console.log(`  users ${p.users_total} · forecasts ${p.forecasts_total} · DAU today ${p.dau_today} · WAU ${p.wau}`);
console.log(`  DAU/WAU ${p.dau_wau_pct ?? "—"}%   (bar: ≥45% scale · <30% by wk4 kill)`);
const coh = p.d7_cohorts ?? [];
if (coh.length) {
  const j = coh.reduce((a, c) => a + c.joined, 0), r = coh.reduce((a, c) => a + c.retained_d7, 0);
  console.log(`  D7 ${j ? Math.round((100 * r) / j) : "—"}% (${r}/${j})   (bar: ≥40% scale · <20% kill)`);
} else console.log(`  D7 — no cohort is 7 days old yet`);
console.log(`  actives by day: ${(p.actives_by_day ?? []).map((d) => `${d.day.slice(5)}:${d.actives}`).join(" ") || "none"}`);
console.log(`  answers by UTC hour (7d): ${(p.answers_by_hour_utc ?? []).map((h) => `${h.hour}h:${h.n}`).join(" ") || "none"}`);
console.log(`\n  slot-share note: morning-slot thesis holds if answers cluster in users' first session of the day.`);
