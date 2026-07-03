#!/usr/bin/env node
/**
 * THE ORACLE — MCP server.
 * Four tools, token-light by design: the whole morning ritual is two calls.
 * Auth: pseudonymous handle + api key stored at ~/.oracle/credentials.json.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

// Patched at setup time; anon key is public by design (all security lives in Postgres RPCs/RLS).
const ORACLE_URL = process.env.ORACLE_URL ?? "https://hzasywatskzapyfegnfb.supabase.co";
const ORACLE_ANON =
  process.env.ORACLE_ANON ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6YXN5d2F0c2t6YXB5ZmVnbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNDUyNjMsImV4cCI6MjA5ODYyMTI2M30.CYFw_1qVkIUcAXIM0cCrIwlfzS8mEQRP-M6dwlnFvB8";

const CRED_PATH = path.join(os.homedir(), ".oracle", "credentials.json");

type Creds = { handle: string; api_key: string };

function loadCreds(): Creds | null {
  try {
    return JSON.parse(fs.readFileSync(CRED_PATH, "utf8"));
  } catch {
    return null;
  }
}

function saveCreds(c: Creds) {
  fs.mkdirSync(path.dirname(CRED_PATH), { recursive: true, mode: 0o700 });
  fs.writeFileSync(CRED_PATH, JSON.stringify(c, null, 2), { mode: 0o600 });
}

async function rpc(fn: string, body: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${ORACLE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: ORACLE_ANON,
      Authorization: `Bearer ${ORACLE_ANON}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    try {
      throw new Error(JSON.parse(text).message ?? text);
    } catch (e: any) {
      throw new Error(e.message ?? text);
    }
  }
  return text ? JSON.parse(text) : null;
}

const ok = (text: string) => ({ content: [{ type: "text" as const, text }] });
const err = (e: unknown) => ok(`⚠ oracle: ${e instanceof Error ? e.message : String(e)}`);

const NOT_JOINED =
  "You haven't joined The Oracle yet. Ask the user for a handle (3-20 chars, a-z 0-9 _) and call oracle_join.";

function fmtToday(d: any): string {
  const lines: string[] = [];
  lines.push(`▸ THE ORACLE · @${d.handle} · streak ${d.streak}`);
  const qs = d.todays_questions ?? [];
  const unanswered = qs.filter((q: any) => q.your_percent == null);
  const answered = qs.filter((q: any) => q.your_percent != null);
  if (qs.length === 0) lines.push("\nNo questions published today (yet).");
  if (unanswered.length > 0) {
    lines.push(`\nTODAY — ${unanswered.length} to answer (1-99% + one-line rationale):`);
    for (const q of unanswered) {
      lines.push(`\n[${q.domain}] ${q.slug} · closes in ${q.closes_in_hours}h`);
      lines.push(`  ${q.title}`);
      lines.push(`  resolution: ${q.detail}`);
    }
  }
  if (answered.length > 0) {
    lines.push(`\nANSWERED TODAY:`);
    for (const q of answered)
      lines.push(
        `  [${q.domain}] ${q.slug} — you ${q.your_percent}% · crowd ${q.crowd_percent ?? "?"}% (n=${q.crowd_n ?? 0})`
      );
  }
  const pos = d.open_positions ?? [];
  if (pos.length > 0) {
    lines.push(`\nOPEN POSITIONS — hold or update (one move per day):`);
    for (const p of pos) {
      const moved =
        p.crowd_percent !== p.crowd_percent_24h_ago
          ? ` (crowd moved ${p.crowd_percent_24h_ago}%→${p.crowd_percent}% overnight)`
          : "";
      lines.push(`  ${p.slug} — you ${p.your_percent}% · crowd ${p.crowd_percent}%${moved} · closes ${p.closes_in_hours}h`);
    }
  }
  if ((d.catch_up ?? []).length > 0)
    lines.push(`\nUnanswered from earlier days (still open): ${d.catch_up.join(", ")}`);
  return lines.join("\n");
}

const server = new McpServer({ name: "oracle", version: "0.1.0" });

server.tool(
  "oracle_join",
  "Join The Oracle forecasting network with a pseudonymous handle. Creates your identity and stores your key locally.",
  { handle: z.string().describe("3-20 chars, lowercase letters/numbers/underscore") },
  async ({ handle }) => {
    try {
      const r = await rpc("join_oracle", { p_handle: handle });
      saveCreds({ handle: r.handle, api_key: r.api_key });
      return ok(`✓ ${r.message}\nYou are @${r.handle}, Oracle #${r.founding_number}. Now call oracle_today.`);
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "oracle_today",
  "Fetch today's Daily Three forecast questions, your open positions, and streak. The morning move. Crowd numbers are hidden until you answer (no anchoring).",
  {},
  async () => {
    const c = loadCreds();
    if (!c) return ok(NOT_JOINED);
    try {
      return ok(fmtToday(await rpc("today", { p_api_key: c.api_key })));
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "oracle_answer",
  "Lock in a probability (1-99) and a one-line rationale on one of today's questions, or update an open position (one move per question per day).",
  {
    question: z.string().describe("question slug from oracle_today"),
    percent: z.number().int().min(1).max(99).describe("your probability that the answer is YES, 1-99"),
    rationale: z.string().max(240).describe("one line: why"),
  },
  async ({ question, percent, rationale }) => {
    const c = loadCreds();
    if (!c) return ok(NOT_JOINED);
    try {
      const r = await rpc("submit_forecast", {
        p_api_key: c.api_key,
        p_slug: question,
        p_percent: percent,
        p_rationale: rationale,
      });
      const left =
        r.remaining_today > 0 ? `${r.remaining_today} question(s) left today.` : "Done for today. See you tomorrow.";
      return ok(
        `✓ locked ${r.locked}% on ${r.question}\n` +
          `crowd: ${r.crowd_percent}% (n=${r.crowd_n}) — revealed now that you've answered\n` +
          `streak: ${r.streak} · ${left}`
      );
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "oracle_me",
  "Your Oracle profile: streak, points, mean Brier, calibration buckets (needs 10+ resolved to be meaningful).",
  {},
  async () => {
    const c = loadCreds();
    if (!c) return ok(NOT_JOINED);
    try {
      const m = await rpc("me", { p_api_key: c.api_key });
      const lines = [
        `@${m.handle} · Oracle #${m.founding_number} · streak ${m.streak}`,
        `answered ${m.answered_total} · resolved ${m.resolved_total} · points ${m.points_total}` +
          (m.mean_brier != null ? ` · mean Brier ${m.mean_brier}` : ""),
        m.provisional ? `provisional: your first 30 resolved forecasts are private calibration bootcamp` : ``,
      ];
      const cal = m.calibration ?? [];
      if (cal.length > 0) {
        lines.push(`calibration (said → happened):`);
        for (const b of cal) lines.push(`  ~${b.avg_percent}% → ${b.hit_percent}% (n=${b.n})`);
      }
      return ok(lines.filter(Boolean).join("\n"));
    } catch (e) {
      return err(e);
    }
  }
);

await server.connect(new StdioServerTransport());
