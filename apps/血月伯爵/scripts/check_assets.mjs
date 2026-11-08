import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const app = new URL('../', import.meta.url);
const readJson = path => JSON.parse(fs.readFileSync(new URL(path, app), 'utf8'));
const manifest = readJson('src/game/bloodmoonAssets.json');
assert.deepEqual(manifest, readJson('static/bloodmoon/manifest.json'), 'Asset manifests differ');
const files = new Set();
function asset(url) {
 assert.ok(url.startsWith('/') && !url.includes('..'), `Invalid local asset: ${url}`);
 const file = new URL(`static${url}`, app);
 assert.ok(fs.existsSync(file), `Missing asset: ${url}`);
 files.add(url);
 return file;
}
for (const [url, metadata] of Object.entries(manifest.assets)) {
 const data = fs.readFileSync(asset(url));
 assert.equal(data.length, metadata.bytes, `${url}: size mismatch`);
 assert.equal(crypto.createHash('sha256').update(data).digest('hex'), metadata.sha256, `${url}: checksum mismatch`);
}
function references(value) {
 if (typeof value === 'string' && value.startsWith('/bloodmoon/') && value !== '/bloodmoon/') {
  asset(value);
  assert.ok(manifest.assets[value], `Untracked export: ${value}`);
 } else if (value && typeof value === 'object') Object.values(value).forEach(references);
}
for (const key of ['scene','environment','celebrations','symbols','ui','audio','character','characterFallback','sequences']) references(manifest[key]);
for (const stage of Object.values(readJson('src/game/winSpineAssets.json').stages)) {
 for (const key of ['skeleton','atlas']) asset(stage[key]);
 const atlas = fs.readFileSync(asset(stage.atlas), 'utf8');
 // Spine atlas page names are the only embedded external file references.
 for (const page of atlas.matchAll(/^([^\r\n]+\.png)\r?$/gm)) asset(stage.atlas.slice(0,stage.atlas.lastIndexOf('/')+1)+page[1]);
}
for (const [folder,names] of Object.entries({chrome:['bar','spin','button','button-active','buy','buy-lit'],frame:['base','free','red','glow-gold','glow-red'],'win-chrome':['plaque','rays']})) {
 for (const name of names) asset(`/bloodmoon/${folder}/${name}.png`);
}
for (const name of ['menu','menuExit','settings','info','payTable','soundOn','soundOff','autoSpin','replay']) asset(`/assets/sprites/goBananasUiIconsMono/${name}.png`);
asset('/fonts/cinzel.woff2');
console.log(`Assets OK: ${files.size} local files, both manifests and all export checksums verified`);
