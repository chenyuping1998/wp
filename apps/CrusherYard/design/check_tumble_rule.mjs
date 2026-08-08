// Verify that the client's tumble refill rule reproduces the board the math paid.
//
//   node design/check_tumble_rule.mjs [maxBooksPerMode]
//
// WHY THIS EXISTS
//
// The client rebuilds the board itself after every tumble, from explodingSymbols
// and newSymbols. If its rule disagrees with the math's, the board on screen
// drifts away from the board being evaluated — and nothing catches it: the build
// passes, types pass, the asset and event scans pass, and the board still looks
// completely plausible. It shows up only as "eight of that symbol were on the
// board and it did not pay", which is indistinguishable from a maths bug and is
// exactly how it was found in the sibling game, from a player screenshot.
//
// The subtlety that caused it: newSymbols[reel][0] is the NEW PADDING row, not a
// visible symbol. tumble_board() pushes the column's existing padding symbol down
// into view without recording it, draws the rest from the strip, then inserts the
// freshly drawn padding at the FRONT of the list it sends. So the visible refill
// is everything after index 0, and the old padding symbol lands in the top
// visible cell behind it.
//
// The check replays every chain and asserts that each following winInfo's winning
// positions really do hold that symbol on the reconstructed board.
//
// Inherited from the cluster game next door, where this caught a real bug that had
// survived every other check. The rule it asserts is a property of the math's
// tumble_board(), not of the win type, so it transfers unchanged — but the
// verification is STRICTER here: with no wild on the strips there is no symbol
// that can legitimately stand in for another, so any disagreement is a defect.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire('E:/stake/tools/gen/noop.js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIB = path.resolve(appRoot, '../../../math-sdk/games/CrusherYard/library/publish_files');
const LIMIT = Number(process.argv[2] ?? 1500);

const ROWS = 5;
const PAD_TOP = 0;

const decompress = (file) => {
	const raw = fs.readFileSync(file);
	// zstd landed in node's zlib in v22.15; fall back to the bundled decoder.
	if (typeof zlib.zstdDecompressSync === 'function') return zlib.zstdDecompressSync(raw);
	const { ZSTDDecompress } = require('simple-zstd');
	throw new Error('node zlib has no zstd support and no fallback is wired up');
};

/**
 * The rule under test — deliberately written out here rather than imported, so
 * this file states the contract independently of the component that implements
 * it. If TumbleLayer changes, this must be changed to match, on purpose.
 */
const applyTumble = (board, event) => {
	const exploded = new Map();
	for (const pos of event.explodingSymbols) {
		if (!exploded.has(pos.reel)) exploded.set(pos.reel, new Set());
		exploded.get(pos.reel).add(pos.row);
	}

	for (const [reel, rows] of exploded) {
		const column = board[reel];
		const survivors = [];
		for (let r = 1; r <= ROWS; r += 1) if (!rows.has(r)) survivors.push(column[r]);

		const incoming = event.newSymbols[reel] ?? [];
		const newPadding = incoming[0];
		const refill = incoming.slice(1);
		const oldTopPadding = column[PAD_TOP];

		const visible = [...refill, oldTopPadding, ...survivors];
		if (visible.length !== ROWS) {
			return { board: null, reason: `reel ${reel} rebuilt to ${visible.length} rows, expected ${ROWS}` };
		}
		board[reel] = [newPadding ?? oldTopPadding, ...visible, column[ROWS + 1]];
	}
	return { board };
};

let checks = 0;
let mismatches = 0;
const examples = [];

for (const mode of ['base', 'bonus']) {
	const file = path.join(LIB, `books_${mode}.jsonl.zst`);
	if (!fs.existsSync(file)) {
		console.error(`books not found: ${file}`);
		console.error('Run the math pipeline first (games/CrusherYard/run.py).');
		process.exit(1);
	}

	// Walked as a Buffer, one line at a time, rather than decoded whole.
	// `buffer.toString()` is capped at 0x1fffffe8 characters and the bonus books
	// decompress well past that — the whole-file decode threw ERR_STRING_TOO_LONG
	// the first time this ran against real output. Slicing per line also means
	// the LIMIT actually saves work instead of paying for the full decode first.
	const buffer = decompress(file);
	let seen = 0;
	let offset = 0;
	while (offset < buffer.length && seen < LIMIT) {
		let end = buffer.indexOf(0x0a, offset);
		if (end === -1) end = buffer.length;
		const line = buffer.toString('utf8', offset, end);
		offset = end + 1;
		if (!line.trim()) continue;
		seen += 1;
		const book = JSON.parse(line);

		let board = null;
		for (const ev of book.events) {
			if (ev.type === 'reveal') {
				board = ev.board.map((column) => [...column]);
			} else if (ev.type === 'tumbleBoard' && board) {
				const result = applyTumble(board, ev);
				if (!result.board) {
					mismatches += 1;
					if (examples.length < 5) examples.push(`${mode} book ${book.id ?? seen}: ${result.reason}`);
					board = null;
					break;
				}
				board = result.board;
			} else if (ev.type === 'winInfo' && board) {
				for (const win of ev.wins) {
					for (const pos of win.positions) {
						checks += 1;
						const actual = board[pos.reel][pos.row].name;
						// No wild-substitution escape hatch: this game has none. If one is
						// ever added to the strips, this is where it has to be allowed for.
						if (actual !== win.symbol) {
							mismatches += 1;
							if (examples.length < 5) {
								examples.push(
									`${mode} book ${book.id ?? seen}: reel ${pos.reel} row ${pos.row} holds ${actual}, win says ${win.symbol}`,
								);
							}
						}
					}
				}
			}
		}
	}
}

if (mismatches > 0) {
	console.error(`FAIL: ${mismatches} of ${checks} winning positions disagree with the math.`);
	for (const example of examples) console.error(`  ${example}`);
	console.error('\nThe client is rebuilding a different board from the one being paid.');
	process.exit(1);
}

console.log(`OK: tumble refill matches the math (${checks} winning positions checked)`);
