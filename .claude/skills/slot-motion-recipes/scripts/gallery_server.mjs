// Static server for a teardown folder, plus one write endpoint so the gallery can save contact sheets to disk.
//
//   node gallery_server.mjs <researchDir> [port=4193]
//
// GET  /<path>                     -> file under <researchDir>
// POST /save?name=<file>.png       -> body is a data:image/png URL, written to <researchDir>/sheets/<file>.png
// Only localhost can reach it; nothing else is writable.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.argv[2] ?? '.');
const PORT = +(process.argv[3] ?? 4193);
const SHEETS = path.join(ROOT, 'sheets');
const TYPES = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.atlas': 'text/plain; charset=utf-8',
	'.png': 'image/png', '.jpg': 'image/jpeg', '.js': 'text/javascript', '.css': 'text/css', '.md': 'text/plain; charset=utf-8' };

http.createServer((req, res) => {
	const url = new URL(req.url, 'http://localhost');
	if (req.method === 'POST' && url.pathname === '/save') {
		const name = (url.searchParams.get('name') ?? '').replace(/[^\w.-]/g, '_');
		if (!/\.png$/.test(name)) { res.writeHead(400).end('name must end in .png'); return; }
		const chunks = [];
		req.on('data', (c) => chunks.push(c));
		req.on('end', () => {
			const body = Buffer.concat(chunks).toString('utf8');
			const m = /^data:image\/png;base64,(.+)$/s.exec(body);
			if (!m) { res.writeHead(400).end('expected a PNG data URL'); return; }
			fs.mkdirSync(SHEETS, { recursive: true });
			fs.writeFileSync(path.join(SHEETS, name), Buffer.from(m[1], 'base64'));
			res.writeHead(200, { 'Content-Type': 'text/plain' }).end('saved ' + name);
		});
		return;
	}
	let file = path.join(ROOT, decodeURIComponent(url.pathname === '/' ? '/gallery.html' : url.pathname));
	// A research folder without its own gallery.html gets the template that sits next to this script.
	if (file === path.join(ROOT, 'gallery.html') && !fs.existsSync(file)) file = path.join(import.meta.dirname, 'gallery.html');
	else if (!file.startsWith(ROOT)) { res.writeHead(404).end(); return; }
	if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
	res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
	fs.createReadStream(file).pipe(res);
}).listen(PORT, '127.0.0.1', () => console.log(`gallery on http://localhost:${PORT}/  (root ${ROOT})`));
