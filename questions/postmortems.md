# Postmortems

Every void gets one. The lesson matters more than the question.

## 2026-07-12 · `github-trending-ai-jul10` (voided)

**What happened:** the resolution contract required checking github.com/trending at 16:00 UTC ±15min on July 10 with a screenshot logged. The window passed with nothing scheduled to capture it, and no Wayback snapshot exists for that page/time. The pre-named evidence could not be produced, so per the constitution the question was voided — never a judgment call.

**The lesson (editorial rule, effective immediately):** no question ships whose resolution depends on a human or process being awake at a specific minute. Time-boxed evidence needs either (a) scheduled capture automation committed to `evidence/` before the question goes live, or (b) a source with durable history (APIs with historical endpoints, official releases, archived pages). "Screenshot logged" is a promise — don't write it unless something is scheduled to keep it.
