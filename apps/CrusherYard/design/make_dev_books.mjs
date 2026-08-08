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
// The shapes are chosen to reach the paths that are hard to hit by playing:
// a feature trigger (1 in 200 base spins), a spin with nitrogen tanks on the
// board, and one over the quench threshold (~1% of tank spins).

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIB = path.resolve(appRoot, '../../../math-sdk/games/CrusherYard/library/publish_files');
const OUT = path.join(appRoot, 'src/dev/devBooks.json');

const QUENCH_FROM = 50; // keep in step with constants.ts

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
		(b) => b.payoutMultiplier > 0 && !types(b).has('freeSpinTrigger'),
		'base win, no feature',
	),
	// The feature opening from the base game — 1 in 200 spins, so effectively
	// unreachable by playing.
	baseTrigger: pick(base, (b) => types(b).has('freeSpinTrigger'), 'base feature trigger'),
	// A bought feature with no tank spike: the ordinary case.
	bonusPlain: pick(
		bonus,
		(b) => !types(b).has('boardMultiplierInfo') && b.payoutMultiplier > 0,
		'bonus without tanks',
	),
	// Tanks on the board — the end-of-spin multiplier assembly.
	bonusTank: pick(
		bonus,
		(b) => eventsOf(b, 'boardMultiplierInfo').some((e) => e.winInfo.boardMult > 1),
		'bonus with nitrogen tanks',
	),
	// Over the quench threshold: hit-stop, flash, frame slam.
	bonusQuench: pick(
		bonus,
		(b) => eventsOf(b, 'boardMultiplierInfo').some((e) => e.winInfo.boardMult >= QUENCH_FROM),
		`bonus with boardMult >= ${QUENCH_FROM}`,
	),
	// A retrigger, which is where the pressure gauge is meant to carry across a
	// second award — the one thing about the feature that has no other test.
	bonusRetrigger: pick(bonus, (b) => types(b).has('freeSpinRetrigger'), 'bonus with a retrigger'),
};

const books = {};
for (const [key, value] of Object.entries(selection)) if (value) books[key] = [value];

fs.writeFileSync(OUT, JSON.stringify(books));
const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
console.log(`\nwrote ${path.relative(appRoot, OUT)} (${kb} KB)`);
for (const [key, value] of Object.entries(books)) {
	const book = value[0];
	const gauge = book.state
		.filter((e) => e.type === 'updateGlobalMult')
		.reduce((max, e) => Math.max(max, e.globalMult), 0);
	console.log(
		`  ${key.padEnd(15)} id=${String(book.id).padEnd(6)} ${String(book.payoutMultiplier / 100 + 'x').padEnd(10)} events=${String(book.state.length).padEnd(5)} gauge=${gauge || '-'}`,
	);
}
