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
// completely plausible. It shows up only as "five matching symbols in a row did
// not pay", which is indistinguishable from a maths bug and is exactly how it was
// found, from a player screenshot.
//
// The subtlety that caused it: newSymbols[reel][0] is the NEW PADDING row, not a
// visible symbol. tumble_board() pushes the column's existing padding symbol down
// into view without recording it, draws the rest from the strip, then inserts the
// freshly drawn padding at the FRONT of the list it sends. So the visible refill
// is everything after index 0, and the old padding symbol lands in the top
// visible cell behind it.
//
// The check replays every chain and asserts that each following winInfo's cluster
// positions really do hold that cluster's symbol on the reconstructed board.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire('E:/stake/tools/gen/noop.js');

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIB = path.resolve(appRoot, '../../../math-sdk/games/EmberForge/library/publish_files');
const LIMIT = Number(process.argv[2] ?? 1500);

const ROWS = 7;
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
		console.error('Run the math pipeline first (games/EmberForge/run.py).');
		process.exit(1);
	}

	const text = decompress(file).toString('utf8');
	let seen = 0;
	for (const line of text.split('\n')) {
		if (!line.trim()) continue;
		if (seen >= LIMIT) break;
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
						// A Wild stands in for the cluster's symbol.
						if (actual !== win.symbol && actual !== 'W') {
							mismatches += 1;
							if (examples.length < 5) {
								examples.push(
									`${mode} book ${book.id ?? seen}: reel ${pos.reel} row ${pos.row} holds ${actual}, cluster says ${win.symbol}`,
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
	console.error(`FAIL: ${mismatches} of ${checks} cluster positions disagree with the math.`);
	for (const example of examples) console.error(`  ${example}`);
	console.error('\nThe client is rebuilding a different board from the one being paid.');
	process.exit(1);
}

console.log(`OK: tumble refill matches the math (${checks} cluster positions checked)`);
