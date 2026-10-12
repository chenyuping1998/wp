import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const build = path.join(root, 'build');
const required = ['index.html', '_app', 'assets', 'fonts', 'favicon.svg', 'loader.gif', 'fonts/Nunito.ttf', 'fonts/OFL.txt'];
for (const entry of required) assert(existsSync(path.join(build, entry)), `Missing build/${entry}`);

const sourceAssets = readdirSync(path.join(root, 'static/assets'));
for (const asset of sourceAssets) assert(existsSync(path.join(build, 'assets', asset)), `Missing build/assets/${asset}`);

const html = readFileSync(path.join(build, 'index.html'), 'utf8');
assert(html.includes('./assets/loading-reference.webp'), 'Loading image must use a relative path');
assert(html.includes('./loader.gif'), 'Loader must use a relative path');
assert(!html.includes('../../../assets/'), 'CSS asset path escapes the upload directory');
assert(!html.includes('url(/assets/'), 'CSS asset path assumes a site root');
assert(!html.includes('fonts.googleapis.com'), 'Font must be served from the upload bundle');

const css = readFileSync(path.join(root, 'src/style.css'), 'utf8');
assert(!css.includes("url('/assets/"), 'Source CSS has a root-relative public asset');

console.log(`Upload build OK: ${sourceAssets.length} assets and Alchemy-style root layout`);
