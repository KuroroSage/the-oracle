# Question seed — batch 2 (July 6–9, 2026)

Same contract discipline as batch 1: source named in advance, exact time, edge cases pre-decided.
Daily mix: 1 × `ai` · 1 × `world`/`fast` · 1 × `fast`/`meta`.

---

## July 6 (LIVE — promoted from batch-1 drafts)

### ai · `datacenter-100b-sep30`
**Will a single named AI datacenter/compute project with stated cost ≥$100B be officially announced between July 5 and Sept 30, 2026?**
- Resolution: official company or government press releases. Multi-year programs count if a single named project with a stated ≥$100B figure.
- Edge cases: aggregated "we will invest $X over N years" without a named project → NO. Re-announcements of pre-July-5 projects → NO.
- Lock: 2026-07-12 23:59 UTC · Resolve by: 2026-10-01

### world · `fed-cut-september-2026`
**Will the FOMC lower the federal funds target range at its September 2026 meeting?**
- Resolution: federalreserve.gov post-meeting statement.
- Edge cases: inter-meeting cut before September → YES only if the September meeting ALSO cuts; the question is about the September meeting's action. No September meeting held → void.
- Lock: 2026-09-15 23:59 UTC · Resolve by: 2026-09-18

### meta · `oracle-100-users-aug1`
**Will The Oracle reach 100 joined users by 23:59 UTC Aug 1, 2026?**
- Resolution: this database (`count(*) from oracle_users`), `_`-prefixed accounts excluded, count published.
- Lock: 2026-07-25 23:59 UTC · Resolve by: 2026-08-02

## July 7 (LIVE)

### ai · `chinese-lab-lmarena-1-aug31`
**Will a model from a China-headquartered lab rank #1 overall on the LMArena text leaderboard at any point between July 7 and Aug 31, 2026?**
- Resolution: lmarena.ai text Overall, default view; any verifiable snapshot (site, Wayback, or widely-shared screenshot corroborated by the leaderboard history) counts.
- Edge cases: China-headquartered = DeepSeek, Alibaba/Qwen, Moonshot/Kimi, Zhipu/GLM, ByteDance, Tencent, MiniMax, StepFun, 01.AI and similar; ties for #1 count as #1.
- Lock: 2026-07-14 23:59 UTC · Resolve by: 2026-09-01

### fast · `spx-up-week-jul10`
**Will the S&P 500 close higher on Friday July 10, 2026 than its Monday July 6 close?**
- Resolution: official S&P 500 index closing level (as reported by S&P DJI / major financial press).
- Edge cases: equal → NO. Market closure moving Friday's close → last trading day of that week.
- Lock: 2026-07-07 23:59 UTC · Resolve by: 2026-07-11

### meta · `oracle-5-full-answers-jul8`
**Will at least 5 forecasters answer all three of July 8's questions by 23:59 UTC July 8?**
- Resolution: this database; count of users with forecasts on all three publish_date=2026-07-08 questions, logged at resolution.
- Edge cases: `_`-prefixed accounts excluded.
- Lock: 2026-07-08 12:00 UTC · Resolve by: 2026-07-09

## July 8 (LIVE)

### ai · `anthropic-model-card-aug15`
**Will Anthropic publish a new model card or system card (PDF or web) between July 8 and Aug 15, 2026?**
- Resolution: anthropic.com official publications/news, or files linked from official Anthropic channels.
- Edge cases: updates/addenda to existing cards count if published as a new document in the window; blog posts alone → NO.
- Lock: 2026-07-15 23:59 UTC · Resolve by: 2026-08-16

### world · `opec-production-change-aug10`
**Will OPEC+ officially announce a change to production targets between July 8 and Aug 10, 2026?**
- Resolution: official OPEC press releases / post-meeting statements.
- Edge cases: reaffirming existing targets → NO; voluntary-cut extensions at existing levels → NO; any change in target volumes (up or down) → YES.
- Lock: 2026-07-15 23:59 UTC · Resolve by: 2026-08-11

### fast · `github-trending-ai-jul10`
**Will the #1 repository on GitHub's weekly trending page be AI-related at 16:00 UTC Friday July 10, 2026?**
- Resolution: github.com/trending?since=weekly checked at 16:00 UTC ±15min, screenshot logged.
- Edge cases: AI-related = repo name, description, or topics contain any of: ai, llm, ml, agent, model, gpt, diffusion, transformer (case-insensitive).
- Lock: 2026-07-09 23:59 UTC · Resolve by: 2026-07-10

## July 9 (LIVE)

### ai · `hf-top-download-chinese-july`
**Will the most-downloaded model on Hugging Face for the trailing 30 days (checked Aug 3, 2026) be from a China-headquartered organization?**
- Resolution: huggingface.co/models sorted by downloads (30d), top entry, checked Aug 3 ~16:00 UTC, screenshot logged.
- Edge cases: same China-HQ list as `chinese-lab-lmarena-1-aug31`; community re-uploads/quantizations resolve by the ORIGINAL model's org.
- Lock: 2026-07-16 23:59 UTC · Resolve by: 2026-08-03

### world · `us-cpi-june-3pct-jul15`
**Will US headline CPI-U year-over-year for June 2026 (released mid-July) print at or above 3.0%?**
- Resolution: bls.gov official CPI news release for June 2026 data.
- Edge cases: exactly 3.0% → YES; release delayed past July 31 → void.
- Lock: 2026-07-13 23:59 UTC · Resolve by: 2026-07-31

### meta · `oracle-founding-50-jul20`
**Will founding number 50 be claimed by 23:59 UTC July 20, 2026?**
- Resolution: this database (`max(founding_number) >= 50` among non-`_` accounts), count published.
- Lock: 2026-07-14 23:59 UTC · Resolve by: 2026-07-21
