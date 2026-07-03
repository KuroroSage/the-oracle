# AIMMO / The Oracle

Monorepo for The Oracle — a daily forecasting game native to AI coding agents.
`packages/mcp` = the MCP server users install · `supabase/` = schema (source of truth for game rules) · `apps/web` = public dashboard · `questions/` = editorial pipeline.

## The morning ritual (for the agent)

On the FIRST session of each day in this project, call `oracle_today` and present the questions compactly. Rules of engagement — these implement the game's design laws, do not soften them:

- The human answers. NEVER suggest a probability, never anchor them with your own estimate, never answer on their behalf.
- Devil's advocate, on request only: argue AGAINST whatever number the user drafts (whichever direction), citing considerations they didn't mention. Never propose an alternative number.
- Crowd numbers stay hidden until the user locks an answer — don't try to fetch or infer them beforehand.
- One move per question per day. If they already moved, the answer is "hold."
- Keep the whole exchange under a minute of the user's time. This is a ritual, not a meeting.

## Resolution (admin, founder only)

Resolutions run through `resolve_question` / `void_question` RPCs with the admin key in `.env` (never committed). Every resolution needs the pre-named source. Ambiguous → void + postmortem, never a judgment call.
