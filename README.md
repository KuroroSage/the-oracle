# THE ORACLE

**Wordle for what happens next.** Three forecast questions a morning, answered inside your
coding agent in ~60 seconds. Your calibration is your reputation. The aggregate — *what
builders believe about what's coming* — is public, daily: **https://aimmo-oracle.vercel.app**

No money, ever. No stakes, no prizes, no tokens. Reputation, not gambling.

## Play

```bash
git clone https://github.com/KuroroSage/the-oracle && cd the-oracle
npm install && npm run build -w @aimmo/oracle-mcp
```

Then open Claude Code (or any MCP-speaking agent) in that folder and say:

> join the oracle as \<your_handle\>

Every morning after that, your agent brings you the day's three questions. A probability
(1–99) and one line of reasoning each. Crowd numbers stay hidden until you commit — no
anchoring. One move per question per day.

## The rules

- **Same three questions for everyone**, per UTC day. Scoring is peer-relative Brier
  (beat the crowd median, capped ±25/question), so difficulty normalizes for free.
- **Your first 30 resolved forecasts are provisional** — private calibration bootcamp.
  Rankings unlock after.
- **Streaks count answering, not being right.** Honest probabilities are the whole game:
  proper scoring means your best move is your true belief.
- **0% and 100% don't exist here.** They're for gods, not forecasters.
- **Resolution is sacred.** Every question names its source before publication
  ([questions/](questions/) has every contract). Ambiguity is voided with a public
  postmortem, never adjudicated.
- **Aggregates only.** Individual forecasts are never published, sold, or shared — at any
  price. Public crowd numbers appear only past five forecasters.

## What's here

- [`packages/mcp`](packages/mcp) — the MCP server (`oracle_join`, `oracle_today`, `oracle_answer`, `oracle_me`)
- [`supabase/migrations`](supabase/migrations) — the game rules, in SQL: scoring, streaks, k-floor, provisional period
- [`apps/web`](apps/web) — the public dashboard
- [`questions/`](questions) — the editorial pipeline: every question with its resolution contract

## FAQ

**Why Brier and not accuracy?** Accuracy rewards answering only gimmes. Brier is a proper
scoring rule: your expected score is maximized by reporting what you actually believe.
Calibration — *when you say 80%, it happens 80% of the time* — is unfakeable and slow.
That's why it works as identity.

**Why can't I see the crowd before answering?** Because then you'd be forecasting the
crowd, not the world.

**Is this a prediction market?** No. Nothing is staked, nothing pays out, nothing is
redeemable. It's an opinion-research game with a scoreboard. Polls are speech.

---

*The Oracle · a game of judgment for the agent era · est. July 2026*
