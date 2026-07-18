# Draft: CORS request to HackNodes Lab (alt-bitnodes operator)

To: via GitHub issue on `ifuensan/alt-bitnodes` (or hacknodes.com contact)
Subject: CORS header request for pesquisa.hacknodes.xyz snapshots API

Hi — thank you for standing up a bitnodes-lineage crawler after
bitnodes.io went dark; as far as I can tell yours is one of only two
live public Bitcoin node crawls left on the internet.

I run https://bitcoinhull.com, a static, open-source Bitcoin dashboard
(vanilla JS, no backend — every visitor's browser fetches data sources
directly). I'd love to show your reachable-node count live with credit
and a link, but browsers block the fetch because
`/api/v1/snapshots/latest/` doesn't send an
`Access-Control-Allow-Origin` header.

Would you consider adding `Access-Control-Allow-Origin: *` (or
`https://bitcoinhull.com`) to the API responses? One header line in
your server config is the whole change. We'd poll gently — at most one
request per visitor per hour, cached client-side.

Repo for reference: https://github.com/abysal32-arch/bitcoinhull

Thanks either way — and thanks for keeping a node census alive.
Joe
