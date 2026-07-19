# Draft: GitHub issue for mempool/mempool — Lightning statistics stalled on mempool.space

To: https://github.com/mempool/mempool/issues (new issue; Joe files it)
Title: Lightning statistics on mempool.space stalled since 2026-06-18

---

**Describe the bug**

The Lightning statistics on the production mempool.space instance have not
updated since **2026-06-18**. As of 2026-07-19:

- `GET https://mempool.space/api/v1/lightning/statistics/latest` returns
  `{"latest":{"id":106271,"added":"2026-06-18T00:00:00.000Z", ...}}` —
  31 days old.
- The interval endpoints (`.../statistics/24h`, `/3d`, `/1w`) return `[]`.
- The https://mempool.space/lightning page renders the same frozen figures,
  so this is the instance's data pipeline rather than a single API route.

Node/channel lookups may be affected too — I have only verified the
aggregate statistics endpoints.

**Expected behavior**

A new statistics snapshot roughly daily, as before June 18.

**Additional context**

I run https://bitcoinhull.com (static open-source dashboard,
https://github.com/abysal32-arch/bitcoinhull) and read the statistics
endpoint directly from visitors' browsers — thank you for keeping it
CORS-open. Happy to provide more probe data if useful. I could not find an
existing issue tracking this; apologies if it is a known operational matter.
