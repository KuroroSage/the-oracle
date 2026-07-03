# Question seed — batch 1 (July 3–6, 2026)

Editorial source of truth. Every question ships with a resolution contract: source named
in advance, exact time, edge cases decided BEFORE publication. Ambiguous → void + postmortem.
**FOUNDER: review titles/dates before recruiting anyone — you are the editor now.**

Daily mix: 1 × `ai` (builder edge) · 1 × `world`/`fast` (calibration breadth) · 1 × `fast`/`meta` (quick feedback).

---

## July 3 (LIVE)

### ai · `openweights-lmarena-top5-sep1`
**Will at least 2 of the top 5 models on the LMArena text leaderboard (Overall, default view) be open-weights at any check on Sept 1, 2026?**
- Resolution: lmarena.ai text leaderboard, Overall ranking, default view, checked Sept 1 ~16:00 UTC, screenshot logged.
- Edge cases: "open-weights" = weights publicly downloadable (any license). Ties sharing rank 5 count as top-5. If LMArena is discontinued, void.
- Lock: 2026-07-10 23:59 UTC · Resolve by: 2026-09-01

### fast · `btc-up-week-jul10`
**Will Bitcoin's daily close on Friday July 10, 2026 (UTC, Coinbase BTC-USD) be higher than its July 2 close?**
- Resolution: Coinbase BTC-USD daily close (UTC), per Coinbase or TradingView COINBASE:BTCUSD daily candles.
- Edge cases: equal → NO. Coinbase outage → use Kraken close.
- Lock: 2026-07-06 23:59 UTC · Resolve by: 2026-07-11

### meta · `oracle-25-forecasters-jul15`
**Will The Oracle have ≥25 users with at least one submitted forecast by 23:59 UTC July 15, 2026?**
- Resolution: this database (`select count(distinct user_id) from forecasts`), count published with resolution.
- Edge cases: test/admin accounts excluded (handles prefixed `_`).
- Lock: 2026-07-10 23:59 UTC · Resolve by: 2026-07-16

## July 4 (LIVE)

### ai · `frontier-flagship-july`
**Will OpenAI, Anthropic, Google DeepMind, Meta, or xAI officially announce a new flagship model between July 3 and July 31, 2026 (inclusive, UTC)?**
- Resolution: official lab blog or official X account. "Flagship" = billed by the lab as its new most-capable model or model family tier.
- Edge cases: point releases (x.1, "turbo", mini variants) count only if the lab's own announcement calls it their most capable. Preview/waitlist announcements count; rumors and leaks don't.
- Lock: 2026-07-11 23:59 UTC · Resolve by: 2026-08-01

### world · `cftc-event-market-rule-sep1`
**Will the CFTC publish a final rule or new formal staff guidance specifically governing event/prediction markets before Sept 1, 2026?**
- Resolution: cftc.gov press releases & Federal Register. Context: the CFTC issued an advance notice of proposed rulemaking in March 2026.
- Edge cases: enforcement actions alone → NO. Advisory letters count as "formal staff guidance" only if published as numbered staff advisories.
- Lock: 2026-07-17 23:59 UTC · Resolve by: 2026-09-01

### fast · `nvda-up-week-jul10`
**Will NVDA's official close on Friday July 10, 2026 be higher than its July 2 close?**
- Resolution: Nasdaq official closing price.
- Edge cases: equal → NO. Market-wide halt lasting past July 10 → void.
- Lock: 2026-07-06 13:00 UTC (before Monday's open) · Resolve by: 2026-07-11

## July 5 (LIVE)

### ai · `swebench-verified-90-oct1`
**Will any model score ≥90% on SWE-bench Verified per the official leaderboard by Oct 1, 2026?**
- Resolution: swebench.com official leaderboard, any submission type, checked Oct 1 ~16:00 UTC.
- Edge cases: self-reported paper numbers don't count — leaderboard only. Leaderboard discontinued → void.
- Lock: 2026-07-12 23:59 UTC · Resolve by: 2026-10-01

### world · `starship-launch-attempt-july`
**Will SpaceX conduct a Starship integrated launch attempt (vehicle leaves the pad) between July 5 and July 31, 2026?**
- Resolution: SpaceX official channels / live coverage.
- Edge cases: static fires and scrubs before liftoff → NO. Any liftoff counts regardless of mission outcome.
- Lock: 2026-07-09 23:59 UTC · Resolve by: 2026-08-01

### meta · `oracle-index-cited-jul20`
**Will an Oracle consensus chart be quote-tweeted or cited by an account with >10,000 followers by July 20, 2026?**
- Resolution: admin attestation with link, logged publicly with the resolution.
- Edge cases: founder's own accounts and paid placements don't count. Follower count at time of post.
- Lock: 2026-07-12 23:59 UTC · Resolve by: 2026-07-21

## July 6 (DRAFT — founder review)

### ai · `datacenter-100b-sep30` — Will a single named AI datacenter/compute project with stated cost ≥$100B be officially announced July 5–Sept 30, 2026? (Official company/government press releases; multi-year programs count if a single named project.)
### world · `fed-cut-september-2026` — Will the FOMC lower the federal funds target range at its September 2026 meeting? (federalreserve.gov statement.)
### meta · `oracle-100-users-aug1` — Will The Oracle reach 100 joined users by Aug 1, 2026? (This database; `_`-prefixed accounts excluded.)
