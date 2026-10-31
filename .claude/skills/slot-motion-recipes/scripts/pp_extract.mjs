// Turn a downloaded Pragmatic Play demo into Spine skeletons a 4.2 runtime can play.
//
//   node pp_extract.mjs <researchDir> [--base <asset base url>]
//
// <researchDir>/raw/game/*.json must already hold the downloaded chunks (main_resources000.json ...).
// --base is the ".../games/vs/<symbol>/desktop/game/" URL; with it, textures that are not inlined
// (res/<md5>.png) are fetched too. Writes, under <researchDir>:
//   merged/<group>.json   the numbered chunks concatenated (each chunk alone is invalid JSON)
//   assets/<md5>.<ext>    every texture
//   spine/<name>.json     each skeleton as shipped (Spine 3.7)
//   spine-index.json      bones / slots / constraints / animation lengths per skeleton
//   spine-42/             <name>.json converted to 4.2 + <name>.atlas + its page images
import fs from 'node:fs';
import path from 'node:path';
import { convert } from './spine37to42.mjs';

const args = process.argv.slice(2);
const ROOT = path.resolve(args[0] ?? '.');
const BASE = args.includes('--base') ? args[args.indexOf('--base') + 1].replace(/\/?$/, '/') : null;
const dir = (d) => { const p = path.join(ROOT, d); fs.mkdirSync(p, { recursive: true }); return p; };

// ---------------------------------------------------------------- 1. merge chunks
const RAW = path.join(ROOT, 'raw', 'game');
const groups = new Map();
for (const f of fs.readdirSync(RAW).filter((f) => /\d{3}\.json$/.test(f)).sort()) {
	const g = f.replace(/\d{3}\.json$/, '');
	if (!groups.has(g)) groups.set(g, []);
	groups.get(g).push(f);
}
const MERGED = dir('merged');
const resources = [];
for (const [g, files] of groups) {
	const text = files.map((f) => fs.readFileSync(path.join(RAW, f), 'utf8')).join('');
	fs.writeFileSync(path.join(MERGED, `${g}.json`), text);
	const j = JSON.parse(text);
	for (const r of j.resources ?? []) resources.push({ ...r, group: g });
}
console.log(`merged ${groups.size} groups, ${resources.length} resources`);

// ---------------------------------------------------------------- 2. textures
const ASSETS = dir('assets');
const missing = [];
for (const r of resources.filter((r) => r.type === 'Texture')) {
	const d = r.data;
	if (typeof d === 'string' && d.startsWith('data:')) {
		const m = /^data:image\/(\w+);base64,/.exec(d);
		if (!m) { missing.push(`${r.id} (inline ${d.slice(5, 30)})`); continue; }
		const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
		fs.writeFileSync(path.join(ASSETS, `${r.id}.${ext}`), Buffer.from(d.slice(m[0].length), 'base64'));
	} else if (typeof d === 'string' && d.startsWith('res/')) {
		const file = path.join(ASSETS, `${r.id}${path.extname(d)}`);
		if (fs.existsSync(file)) continue;
		if (!BASE) { missing.push(d); continue; }
		const res = await fetch(BASE + d);
		if (!res.ok) { missing.push(`${d} (${res.status})`); continue; }
		fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
	} else missing.push(`${r.id} (${typeof d})`);
}
if (missing.length) console.log(`textures not written (${missing.length}):\n  ${missing.join('\n  ')}`);

// ---------------------------------------------------------------- 3. skeletons
const SPINE = dir('spine');
const skeletons = new Map();
const lastTime = (o) => { let m = 0; JSON.stringify(o, (k, v) => { if (k === 'time' && typeof v === 'number') m = Math.max(m, v); return v; }); return +m.toFixed(3); };
for (const r of resources.filter((r) => r.type === 'UHTSpine')) {
	const name = r.data.name.replace(/_SkeletonData$/, '');
	const j = JSON.parse(Buffer.from(r.data.spineJSON, 'base64').toString('utf8'));
	skeletons.set(name, j);
	fs.writeFileSync(path.join(SPINE, `${name}.json`), JSON.stringify(j, null, 1));
}
const index = [...skeletons].map(([name, j]) => ({
	name, version: j.skeleton?.spine, bones: j.bones?.length ?? 0, slots: j.slots?.length ?? 0,
	ik: j.ik?.length ?? 0, transform: j.transform?.length ?? 0, path: j.path?.length ?? 0,
	animations: Object.fromEntries(Object.entries(j.animations ?? {}).map(([a, v]) => [a, lastTime(v)])),
}));
fs.writeFileSync(path.join(ROOT, 'spine-index.json'), JSON.stringify(index, null, 1));
console.log(`skeletons: ${skeletons.size}`);

// ---------------------------------------------------------------- 4. atlases
// Each skeleton ships one UIAtlas GameObject per page, named "<skeleton>_<page>"; the component holds the page's
// texture guid (= a texture resource id) and an NGUI spriteList (trimmed rects + padding).
const atlasPages = [];
for (const f of fs.readdirSync(MERGED)) {
	(function walk(o, go) {
		if (Array.isArray(o)) return o.forEach((x) => walk(x, go));
		if (!o || typeof o !== 'object') return;
		if (o.name && Array.isArray(o.components)) go = o.name;
		if (o.componentType === 'UIAtlas' && o.serializableData?.spriteList) { atlasPages.push({ go, ...o.serializableData }); return; }
		for (const k in o) walk(o[k], go);
	})(JSON.parse(fs.readFileSync(path.join(MERGED, f), 'utf8')), null);
}
const sizeOf = (file) => {
	const b = fs.readFileSync(file);
	if (b.toString('ascii', 1, 4) === 'PNG') return [b.readUInt32BE(16), b.readUInt32BE(20)];
	for (let i = 2; i < b.length - 8;) {
		if (b[i] !== 0xff) { i++; continue; }
		const m = b[i + 1];
		if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
		i += 2 + b.readUInt16BE(i + 2);
	}
	return [0, 0];
};
const OUT = dir('spine-42');
const byLongest = [...skeletons.keys()].sort((a, b) => b.length - a.length);
const pagesOf = new Map();
for (const p of atlasPages) {
	const skel = byLongest.find((s) => p.go === s || p.go?.startsWith(s + '_'));
	if (!skel) continue;
	const img = ['png', 'jpg'].map((e) => path.join(ASSETS, `${p.textureContent?.guid}.${e}`)).find(fs.existsSync);
	if (!img) { console.log(`atlas page ${p.go}: texture ${p.textureContent?.guid} missing`); continue; }
	const pageFile = `${p.go}${path.extname(img)}`;
	fs.copyFileSync(img, path.join(OUT, pageFile));
	const [w, h] = sizeOf(img);
	const lines = [pageFile, `size: ${w}, ${h}`, 'format: RGBA8888', 'filter: Linear,Linear', 'repeat: none'];
	for (const [raw, r] of Object.entries(p.spriteList)) {
		const pl = r.paddingLeft ?? 0, pt = r.paddingTop ?? 0, pr = r.paddingRight ?? 0, pb = r.paddingBottom ?? 0;
		lines.push(raw.replace(/^s_/, ''), `  rotate: ${r.rotate ? 'true' : 'false'}`, `  xy: ${r.x ?? 0}, ${r.y ?? 0}`,
			`  size: ${r.width}, ${r.height}`, `  orig: ${r.width + pl + pr}, ${r.height + pt + pb}`, `  offset: ${pl}, ${pb}`, '  index: -1');
	}
	if (!pagesOf.has(skel)) pagesOf.set(skel, []);
	pagesOf.get(skel).push(lines.join('\n'));
}

// ---------------------------------------------------------------- 5. Spine 3.7 -> 4.2 (see spine37to42.mjs)
let ready = 0;
for (const [name, j] of skeletons) {
	fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(convert(j)));
	const pages = pagesOf.get(name);
	if (pages) { fs.writeFileSync(path.join(OUT, `${name}.atlas`), pages.join('\n\n') + '\n'); ready++; }
	else console.log(`no atlas for ${name}`);
}
console.log(`spine-42: ${ready}/${skeletons.size} skeletons with atlases`);
