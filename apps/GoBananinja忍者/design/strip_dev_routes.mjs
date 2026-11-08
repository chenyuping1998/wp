// The /polish-review route is a DEV-only art and audio bench (its controls sit
// behind import.meta.env.DEV), but adapter-static still prerenders it, so the
// upload carried a second entry page at /polish-review.html. Engine serves the
// build as-is; nothing outside index.html should be reachable. Self-review
// 2026-11-01.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const build = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../build');
const pages = fs.readdirSync(build).filter((f) => f.endsWith('.html'));
for (const page of pages) if (page !== 'index.html') fs.rmSync(path.join(build, page));
const left = fs.readdirSync(build).filter((f) => f.endsWith('.html'));
if (left.length !== 1 || left[0] !== 'index.html') {
	console.error(`build should hold only index.html, found: ${left.join(', ')}`);
	process.exit(1);
}
console.log(`OK: build entry is index.html only${pages.length > 1 ? ` (removed ${pages.filter((p) => p !== 'index.html').join(', ')})` : ''}`);
