#!/usr/bin/env node
// Resolution CLI. Usage: node scripts/resolve.mjs <slug> <yes|no|void> "<evidence: link or note>"
// Runs the RPC with the admin key from .env and appends to the public resolutions log.
import { readFileSync, appendFileSync, existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const [slug, outcome, ...ev] = process.argv.slice(2);
if (!slug || !["yes", "no", "void"].includes(outcome ?? "")) {
  console.error('usage: node scripts/resolve.mjs <slug> <yes|no|void> "<evidence>"');
  process.exit(1);
}
const evidence = ev.join(" ").trim();
if (!evidence) {
  console.error("evidence required — cite the source named in the question's contract (void → cite the ambiguity)");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(ROOT + ".env", "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const URL_ = "https://hzasywatskzapyfegnfb.supabase.co";
const ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6YXN5d2F0c2t6YXB5ZmVnbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNDUyNjMsImV4cCI6MjA5ODYyMTI2M30.CYFw_1qVkIUcAXIM0cCrIwlfzS8mEQRP-M6dwlnFvB8";

const fn = outcome === "void" ? "void_question" : "resolve_question";
const body = outcome === "void"
  ? { p_admin_key: env.ORACLE_ADMIN_KEY, p_slug: slug }
  : { p_admin_key: env.ORACLE_ADMIN_KEY, p_slug: slug, p_outcome: outcome === "yes" };

const res = await fetch(`${URL_}/rest/v1/rpc/${fn}`, {
  method: "POST",
  headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const text = await res.text();
if (!res.ok) {
  console.error("FAILED:", JSON.parse(text).message ?? text);
  process.exit(1);
}
const r = JSON.parse(text);

const LOG = ROOT + "questions/resolutions.md";
if (!existsSync(LOG)) writeFileSync(LOG, "# Resolutions log\n\nEvery resolution, with the evidence. Voids get a postmortem.\n");
const stamp = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";
appendFileSync(
  LOG,
  outcome === "void"
    ? `\n## ${slug} → VOID · ${stamp}\n- Postmortem: ${evidence}\n`
    : `\n## ${slug} → ${outcome.toUpperCase()} · ${stamp}\n- Crowd said ${r.crowd_percent ?? "—"}% (n=${r.n}, crowd Brier ${r.crowd_brier})\n- Evidence: ${evidence}\n`
);
console.log(JSON.stringify(r, null, 2));
console.log(`\nlogged to questions/resolutions.md — commit it. Resolution integrity is the product.`);
