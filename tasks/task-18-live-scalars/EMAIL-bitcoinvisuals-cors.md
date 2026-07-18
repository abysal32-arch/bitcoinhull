# Draft: CORS request to bitcoinvisuals.com (Lightning daily data)

To: bitcoinvisuals.com contact (site footer / operator email)
Subject: CORS header request for data_daily.csv (Lightning stats)

Hi — bitcoinvisuals.com is currently the freshest public source of
Lightning Network aggregate stats anywhere (your daily CSV runs ~1-2
days behind reality, while mempool.space's Lightning statistics have
been stalled for over a month).

I run https://bitcoinhull.com, a static open-source Bitcoin dashboard
(vanilla JS, no backend — visitors' browsers fetch sources directly).
I'd love to show your Lightning capacity/node/channel figures live with
credit and a link, but `/static/data/data_daily.csv` sends no
`Access-Control-Allow-Origin` header, so browsers block the fetch.

Would you consider adding `Access-Control-Allow-Origin: *` to that
static file (one header line)? Even better — a small
`/static/data/latest.json` with just the newest row would save your
bandwidth (the CSV is ~4 MB); we'd fetch once per visitor per day.

Repo for reference: https://github.com/abysal32-arch/bitcoinhull

Thanks for the excellent data either way.
Joe
