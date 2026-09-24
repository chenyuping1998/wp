// Provenance gate — nothing in this game may have come from somewhere else.
//
// The Hot Miami submission shipped third-party template assets for months
// without anyone noticing: a `MiningMayhem_by_KICK` spine, a `TWIST GAMES`
// path, an `SD2_Coin` sheet. They arrived with the starter template, no gate
// looked at them, and they are still sitting in four sibling apps today. The
// actual leak in the spine was not the filename — it was this, inside the JSON:
//
//   "audio": "D:/BigTech Media Dropbox/Kevin Tran/BigTech Media/WickedGames/
//             Kick/0007_MiningMayhem_by_KICK/Assets/Animation/Anticipation/img"
//
// Another studio's name, their employee's name, and their Dropbox layout,
// published on Stake. A filename check would never have found it.
//
// So this gate looks at five things, cheapest and most certain first:
//
//   1. asset keys are inside this game's `moooo*` namespace
//   2. no path or filename carries a sibling-app or known-template marker
//   3. no TEXT asset embeds an absolute filesystem path or a foreign studio
//   4. no PNG carries tEXt/iTXt/zTXt metadata (authoring tools write these)
//   5. no file is BYTE-IDENTICAL to a file in a sibling app (licensed fonts
//      excepted — see the note above rule 5 for why, and what it still checks)
//
// (5) is the one that cannot be talked around. Renaming a copied asset defeats
// every other check here and defeats a human reviewer; it does not defeat a
// hash. It is also the literal instruction in the brief — "do not copy assets
// from WildParty / GoBananas / HotMiami" — expressed as something a machine can
// decide.
//
// Usage:  node design/check_provenance.mjs [appRoot]
// The optional argument aims the gate at another app, which is how it was
// verified: pointed at MarginCall it finds the MiningMayhem leak.
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(process.argv[2] ?? path.join(here, '..'));
const appsRoot = path.resolve(appRoot, '..');
const thisApp = path.basename(appRoot);
// Rule 1 below is about THIS game's namespace, so it only applies when the gate
// is checking its own app. Aimed at a sibling (the verification path) every key
// would trivially be "foreign" and the real findings would be buried.
const checkingSelf = process.argv[2] === undefined;

// This game's asset namespace. The brief's rule, mechanised.
const NAMESPACE = /^moooo/;

// Markers that mean "this came from somewhere else". Sibling app names are
// generated from the apps directory rather than listed, so a new sibling is
// covered the day it is created and nobody has to remember this file.
const SIBLINGS = fs.existsSync(appsRoot)
	? fs.readdirSync(appsRoot, { withFileTypes: true }).filter((e) => e.isDirectory() && e.name !== thisApp).map((e) => e.name)
	: [];
const TEMPLATE_ARTIFACTS = ['SD2_Coin', 'MiningMayhem', 'TWIST GAMES', 'TWIST_GAMES', 'WickedGames', 'BigTech', 'by_KICK'];
const PATH_MARKERS = [...SIBLINGS, ...TEMPLATE_ARTIFACTS];

// Absolute paths and cloud-drive layouts embedded in exported asset metadata.
// Spine, TexturePacker and Aseprite all write the artist's local path unless
// told not to.
const EMBEDDED = [
	// C:/ or D:\ — a Windows workstation path. The lookbehind is load-bearing:
	// without it every "https://" in every licence file and SVG matches on its
	// "s:/", and a gate that cries wolf on fonts is a gate people learn to skip.
	/(?<![A-Za-z])[A-Za-z]:[\\/]{1,2}(?![\\/])/,
	/\/Users\/[^"\s]+/, // a macOS home directory
	/\/home\/[^"\s]+/,
	/Dropbox|Google Drive|OneDrive|iCloud/i,
];

// Directories that are build output — copies of static/, not sources. Checking
// them reports every problem twice and hides which file to actually fix.
const IGNORED_DIRS = new Set(['node_modules', '.svelte-kit', 'build', 'build-playtest', 'dist', '.git', '__pycache__']);

const TEXT_EXT = new Set(['.json', '.atlas', '.txt', '.xml', '.svg', '.ts', '.js', '.mjs', '.css']);
const ASSET_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp3', '.ogg', '.wav', '.m4a', '.json', '.atlas', '.ttf', '.otf', '.woff', '.woff2', '.fnt']);

const walk = (dir) => {
	if (!fs.existsSync(dir)) return [];
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		if (IGNORED_DIRS.has(entry.name)) return [];
		const full = path.join(dir, entry.name);
		return entry.isDirectory() ? walk(full) : [full];
	});
};

const problems = [];
const fail = (msg) => {
	problems.push(msg);
	console.log(`  !! ${msg}`);
};

const rel = (f) => path.relative(appsRoot, f);

// ── 1. asset keys stay inside this game's namespace ──────────────────────────
const registryPath = path.join(appRoot, 'src/game/assets.ts');
if (checkingSelf && fs.existsSync(registryPath)) {
	const registry = fs.readFileSync(registryPath, 'utf8');
	const keys = [...registry.matchAll(/^\s{1,2}([A-Za-z][A-Za-z0-9_]*)\s*:\s*\{/gm)].map((m) => m[1]);
	const foreign = keys.filter((k) => !NAMESPACE.test(k));
	for (const key of foreign.slice(0, 8)) {
		fail(`asset key "${key}" is outside the moooo* namespace — it is another game's key or an unrenamed template key`);
	}
	if (foreign.length > 8) fail(`…and ${foreign.length - 8} more keys outside the namespace`);
}

// ── 2-4. scan this app's own files ───────────────────────────────────────────
const ownFiles = [...walk(path.join(appRoot, 'static')), ...walk(path.join(appRoot, 'src'))];

for (const file of ownFiles) {
	const ext = path.extname(file).toLowerCase();

	for (const marker of PATH_MARKERS) {
		if (file.toLowerCase().includes(marker.toLowerCase())) {
			fail(`${rel(file)}: path carries the foreign marker "${marker}"`);
			break;
		}
	}

	if (TEXT_EXT.has(ext)) {
		const text = fs.readFileSync(file, 'utf8');
		for (const pattern of EMBEDDED) {
			const hit = text.match(pattern);
			if (hit) {
				fail(`${rel(file)}: embeds an authoring path — ${JSON.stringify(hit[0].slice(0, 90))}`);
				break;
			}
		}
		for (const marker of TEMPLATE_ARTIFACTS) {
			if (text.includes(marker)) {
				fail(`${rel(file)}: content names the third-party asset "${marker}"`);
				break;
			}
		}
	}

	if (ext === '.png') {
		const buf = fs.readFileSync(file);
		// PNG: 8-byte signature, then length(4) type(4) data(length) crc(4)
		let offset = 8;
		while (offset + 8 <= buf.length) {
			const length = buf.readUInt32BE(offset);
			const type = buf.toString('ascii', offset + 4, offset + 8);
			if (type === 'IEND') break;
			if (type === 'tEXt' || type === 'iTXt' || type === 'zTXt') {
				const data = buf.toString('latin1', offset + 8, offset + 8 + Math.min(length, 120));
				fail(`${rel(file)}: PNG carries ${type} metadata — ${JSON.stringify(data.replace(/\0/g, ' ').trim().slice(0, 80))}`);
				break;
			}
			offset += 12 + length;
		}
	}
}

// ── 5. byte-identical copies of a sibling app's assets ───────────────────────
const digest = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

const siblingHashes = new Map();
for (const sibling of SIBLINGS) {
	for (const file of walk(path.join(appsRoot, sibling, 'static'))) {
		if (!ASSET_EXT.has(path.extname(file).toLowerCase())) continue;
		try {
			const h = digest(file);
			if (!siblingHashes.has(h)) siblingHashes.set(h, rel(file));
		} catch {
			/* unreadable file is not this gate's business */
		}
	}
}

// Typefaces are the one honest exception to rule 5.
//
// Orbitron, Saira and Titan One are SIL Open Font Licence faces, shared by every
// app in this repo on purpose — a font is not artwork, and two games using the
// same licensed typeface is a design decision, not a theft. Flagging them taught
// nothing and, worse, would have trained someone to skim past this gate's output
// on the day it reported something real.
//
// The exemption is narrow and it does not drop the actual obligation: a font is
// only exempt if a licence file sits beside it. Ship the .ttf without the OFL
// text and this still fails, which is the part a reviewer would actually care
// about.
const FONT_EXT = new Set(['.ttf', '.otf', '.woff', '.woff2']);
const licensedFont = (file) => {
	if (!FONT_EXT.has(path.extname(file).toLowerCase())) return false;
	// Matched to THIS font by name, not merely present in the folder. The first
	// version accepted any licence file in the directory, so dropping
	// Orbitron-OFL.txt still passed — Saira's and Titan One's licences covered
	// for it. A fonts folder almost always has some licence in it, which made the
	// check a formality that could never fail in the situation it was written for.
	//
	// Family name is the font's basename up to the first '-' (Saira-latin.woff2
	// and Saira-latin-ext.woff2 are both covered by Saira-OFL.txt).
	const dir = path.dirname(file);
	const family = path.basename(file, path.extname(file)).split('-')[0];
	const licensed = fs
		.readdirSync(dir)
		.some((name) => /(OFL|LICEN[CS]E|COPYING)/i.test(name) && name.toLowerCase().startsWith(family.toLowerCase()));
	if (!licensed) {
		fail(`${rel(file)}: no licence file named for "${family}" beside it — a font may only be shared with a sibling app if its licence ships too`);
		return false;
	}
	return true;
};

let copied = 0;
for (const file of ownFiles) {
	if (!ASSET_EXT.has(path.extname(file).toLowerCase())) continue;
	if (licensedFont(file)) continue;
	const source = siblingHashes.get(digest(file));
	if (source) {
		copied++;
		if (copied <= 20) fail(`${rel(file)}: byte-identical to ${source}`);
	}
}
if (copied > 20) fail(`…and ${copied - 20} more files byte-identical to a sibling app's assets`);

console.log(
	problems.length === 0
		? `OK: provenance clean (${ownFiles.length} files, ${siblingHashes.size} sibling assets compared)`
		: `${problems.length} provenance problem(s) found`,
);
process.exit(problems.length === 0 ? 0 : 1);
