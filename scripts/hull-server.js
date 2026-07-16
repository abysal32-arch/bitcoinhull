// Dev-preview static server ONLY — the site itself needs no server (file://
// and GitHub Pages both work). Exists because the Claude browser pane denies
// file:// navigation. Serves the repo root at http://localhost:8765.
// Referenced by .claude/launch.json entries here and in the swap-key project.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.md': 'text/plain; charset=utf-8',
};

http.createServer((req, res) => {
  let u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/') u = '/index.html';
  const fp = path.join(ROOT, u);
  if (!fp.startsWith(ROOT)) { res.writeHead(403); res.end('403'); return; }
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('404'); return; }
    const type = TYPES[path.extname(fp).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(8765, () => console.log('bitcoinhull dev server on http://localhost:8765'));
