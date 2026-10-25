// Pick a handful of real books out of the published set for src/dev/devBooks.json.
//
//   node design/make_dev_books.mjs
//
// The mock RGS (src/dev/mockRgs.ts) serves these so a round can be played with
// `pnpm dev` and no Stake Engine. Nothing here is synthesised — every book is one
// the RGS could really hand out — because a hand-written book proves the
// presentation survives a shape the maths never produces, which is the opposite
// of useful.
//
// The shapes are chosen to reach the paths that are hard to hit by playing: a
// feature trigger (about 1 in 400 base spins), Medusa's throw applied and wasted,
// a feature that builds a large running total, and a retrigger.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

import { mathGameDir } from '../../../tools/math_game_dir.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIB = path.join(mathGameDir('MedusaGaze'), 'library', 'publish_files');
const OUT = path.join(appRoot, 'src/dev/devBooks.json');

const BIG_TOTAL = 100; // a running total worth watching build

const readBooks = (mode, limit) => {
	const file = path.join(LIB, `books_${mode}.jsonl.zst`);
	if (!fs.existsSync(file)) {
		console.error(`books not found: ${file}\nRun the math pipeline first.`);
		process.exit(1);
	}
	// Line-at-a-time over the Buffer: the bonus books decompress past the
	// 0x1fffffe8 cap on a single JS string.
	const buffer = zlib.zstdDecompressSync(fs.readFileSync(file));
	const out = [];
	let offset = 0;
	while (offset < buffer.length && out.length < limit) {
		let end = buffer.indexOf(0x0a, offset);
		if (end === -1) end = buffer.length;
		const line = buffer.toString('utf8', offset, end);
		offset = end + 1;
		if (line.trim()) out.push(JSON.parse(line));
	}
	return out;
};

const types = (book) => new Set(book.events.map((e) => e.type));
const eventsOf = (book, type) => book.events.filter((e) => e.type === type);

const pick = (books, predicate, label) => {
	const found = books.find(predicate);
	if (!found) {
		console.warn(`  !! no book matched "${label}" — the harness will be missing that shape`);
		return null;
	}
	return { id: found.id, payoutMultiplier: found.payoutMultiplier, state: found.events };
};

console.log('reading base books…');
const base = readBooks('base', 6000);
console.log('reading bonus books…');
const bonus = readBooks('bonus', 2500);

const selection = {
	// A plain base win, so the very first spin exercises the tumble path.
	baseWin: pick(
		base,
		(b) => b.payoutMultiplier > 0 && !types(b).has('freeSpinTrigger') && !types(b).has('medusaThrow'),
		'base win, no feature',
	),
	// The feature opening from the base game, effectively unreachable by playing.
	baseTrigger: pick(
		base,
		(b) => types(b).has('freeSpinTrigger') && !types(b).has('wincap'),
		'base feature trigger',
	),
	// Medusa's base-game throw landing on a win.
	baseThrow: pick(
		base,
		(b) => eventsOf(b, 'medusaThrow').some((e) => e.applied) && !types(b).has('freeSpinTrigger'),
		'base throw applied',
	),
	// ...and wasted on a spin with no tumble win.
	baseThrowWasted: pick(
		base,
		(b) => eventsOf(b, 'medusaThrow').some((e) => !e.applied) && !types(b).has('freeSpinTrigger'),
		'base throw wasted',
	),
	// A bought feature, the ordinary case.
	bonusPlain: pick(bonus, (b) => b.payoutMultiplier > 0 && !types(b).has('freeSpinRetrigger'), 'bonus'),
	// A feature whose running total climbs high: multi-orb throws into the plate.
	bonusBigTotal: pick(
		bonus,
		(b) => eventsOf(b, 'medusaThrow').some((e) => e.applied && e.mult >= BIG_TOTAL),
		`bonus with running total >= ${BIG_TOTAL}`,
	),
	// A retrigger: the running total has to carry across the extra award.
	bonusRetrigger: pick(bonus, (b) => types(b).has('freeSpinRetrigger'), 'bonus with a retrigger'),
};

const books = {};
for (const [key, value] of Object.entries(selection)) if (value) books[key] = [value];

fs.writeFileSync(OUT, JSON.stringify(books));
const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
console.log(`\nwrote ${path.relative(appRoot, OUT)} (${kb} KB)`);
for (const [key, value] of Object.entries(books)) {
	const book = value[0];
	const total = book.state
		.filter((e) => e.type === 'medusaThrow')
		.reduce((max, e) => Math.max(max, e.mult), 0);
	console.log(
		`  ${key.padEnd(15)} id=${String(book.id).padEnd(6)} ${String(book.payoutMultiplier / 100 + 'x').padEnd(10)} events=${String(book.state.length).padEnd(5)} medusa=${total || '-'}`,
	);
}
