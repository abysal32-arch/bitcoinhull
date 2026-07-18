# Draft bug report for Luke Dashjr (Joe sends — never sent automatically)

To: luke@dashjr.org (or the contact on dashjr.org)
Subject: Duplicate CORS header on luke.dashjr.org breaks browser fetch of history.txt

Hi Luke,

Your node-count history file is served with the Access-Control-Allow-Origin
header TWICE, which makes every browser reject cross-origin reads of it —
the two values combine to "*, *", which fails the CORS check even though
each header alone is valid:

    $ curl -sI https://luke.dashjr.org/programs/bitcoin/files/charts/data/history.txt | grep -i access-control
    access-control-allow-origin: *
    access-control-allow-origin: *

(Same over HTTP/1.1 and HTTP/2; confirmed 2026-07-17. Your own chart page
never notices because it fetches the file same-origin.)

It's almost certainly the header being set in two places in your Apache
config (e.g. both a vhost/server block and a .htaccess or directory block).
Removing one of the two `Header set Access-Control-Allow-Origin "*"` lines
fixes it — no other change needed.

We'd love to consume the file live from a static dashboard
(bitcoinhull.com); right now we ship a periodically refreshed copy instead.
Thanks for keeping the longest-running node-count series alive.

— Joe (bitcoinhull.com)
