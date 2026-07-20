# Draft: CORS request to btcnodes.io (Rodrigo Martínez / @brunneis)

To: via GitHub issue on `brunneis/btcnodes` (or the contact on btcnodes.io)
Subject: CORS header request for the btcnodes.io API

Hi — btcnodes.io is, as far as I can tell, the best bitnodes-style
successor running anywhere today: real-time validated reachable-node
counts, a documented public API, and even `ratelimit-remaining:
unlimited` on the summary endpoint. Thank you for building it.

I run https://bitcoinhull.com, a static open-source Bitcoin dashboard
(vanilla JS, no backend — every visitor's browser fetches data sources
directly). I'd love to show your reachable-node count live with credit
and a link, but browsers block the fetch: `/api/home` sends no
`Access-Control-Allow-Origin` header (and OPTIONS returns 501, so the
preflight fails too).

Would you consider adding `Access-Control-Allow-Origin: *` (or
`https://bitcoinhull.com`) to the API responses? One header line in the
server config is the whole change. We'd poll gently — at most one
request per visitor per 30–60 minutes, cached client-side.

Repo for reference: https://github.com/abysal32-arch/bitcoinhull

Thanks either way — and thanks for keeping a real node census alive
after bitnodes.io went dark.
Joe
