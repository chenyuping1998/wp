// Verify the collect events the MATHS actually produced against what the CLIENT
// actually reads.
//
// This is the guard that would have caught the padded-row bug. The maths first
// reported carrier rows as raw 0-based indices while every other event in the
// SDK - and getSymbolY on the client - uses the padded convention where visible
// rows are 1..rows. Everything compiled, every type checked, and every collect
// animation would have played one cell off. Nothing else in the build could see
// it, because both sides were internally consistent and simply disagreed.
//
// So this reads real books out of the math output and asserts the things the
// client assumes are true of them:
//
//   * rows are inside the visible window, in the padded convention
//   * reels are on the board
//   * every carrier a sweep lists has a value, every collector a multiplier
//   * a sweep's award is its subtotal times its multiplier
//   * the rail never goes backwards or past its total within a round
//   * featureSet arrives before the first collect of a feature
//   * THE BOARD IS WHAT THE CLIENT READS - every M on a revealed board carries
//     the field name the reveal handler looks for, and its value matches what
//     the collect event later awards for that cell
//
// That last one was added after it failed, and it failed in the widest possible
// way. The maths writes a carrier as `{"name": "M", "multiplier": 3}`; the
// reveal handler read `rawSymbol.cashValue`, a field that has never existed on a
// board. So `stateGame.carriers` was empty on every spin of every build and no
// talisman ever showed a number - the carrier, the symbol the whole game is
// built on, drew as a spirit holding a blank piece of paper.
//
// Everything above passed the entire time, because the collect EVENTS were
// correct. The two sides never had to agree about the board, so they did not,
// and the only thing that could see it was a person looking at the game.
//
// Usage: node design/check_collect_contract.mjs
//   Skips (exit 0) when the math output is absent, so a clone without a math
//   build is not blocked - the CI that runs the maths is where this bites.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');
const PUBLISH = path.resolve(appRoot, '../../../math-sdk/games/SoulSeal/library/publish_files');

if (!fs.existsSync(PUBLISH)) {
	console.log('SKIP: no math output found - run games/SoulSeal/run.py first');
	process.exit(0);
}

// The paylines, read from the generated client config rather than restated, so
// a change to the maths' payline table cannot leave this guard checking against
// a table the game no longer uses.
const PAYLINES = (() => {
	const config = fs.readFileSync(path.join(appRoot, 'src/game/config.ts'), 'utf8');
	const m = config.match(/"paylines":(\{(?:"\d+":\[[\d,]+\],?)+\})/);
	if (!m) throw new Error('could not read paylines from src/game/config.ts');
	return JSON.parse(m[1]);
})();

const NUM_REELS = 5;
const ROWS = 3;
const RAIL_TOTAL = 12;
// Rounding slack. The maths rounds awards to 4 decimals before writing them.
const EPS = 1e-3;

const problems = [];
let checkedRounds = 0;
let checkedSweeps = 0;
let boardCarriers = 0;

/**
 * Yield the book objects in a .jsonl.zst one at a time.
 *
 * A GENERATOR over a BUFFER, and both halves matter at the sizes this now runs
 * at. Raising the simulation from 1e4 to 1e5 per mode took the bonus books past
 * Node's maximum string length (0x1fffffe8 characters, about 512MB) and the guard
 * stopped being able to read the two modes it most needs to read - reporting it
 * as a contract problem, which it was not.
 *
 * So nothing here ever holds the decompressed file as a string: the bytes stay in
 * a Buffer, lines are cut on the 0x0a byte, and each one is turned into a string
 * only long enough to be parsed and thrown away. The parsed book is handed back
 * through a generator for the same reason - an array of a hundred thousand books
 * is the same problem wearing a different type.
 *
 * The ceiling that remains is buffer.constants.MAX_LENGTH, which is several
 * gigabytes; a 1e6 run should still fit, and if it ever does not the fix is to
 * pipe the decompressor's stdout rather than to buffer it.
 */
function* readBooks(file) {
	let buf;
	if (typeof zlib.zstdDecompressSync === 'function') {
		buf = zlib.zstdDecompressSync(fs.readFileSync(file));
	} else {
		// Node without zstd built in. The math venv ships zstandard, so borrow it
		// rather than adding a dependency here. `encoding: null` keeps the result a
		// Buffer - decoding it here would reintroduce the string limit.
		buf = execFileSync(
			path.resolve(appRoot, '../../../math-sdk/env/Scripts/python.exe'),
			[
				'-c',
				'import sys,zstandard;zstandard.ZstdDecompressor().copy_stream(open(sys.argv[1],"rb"),sys.stdout.buffer)',
				file,
			],
			{ encoding: null, maxBuffer: 1 << 32 },
		);
	}

	let start = 0;
	while (start < buf.length) {
		let end = buf.indexOf(0x0a, start);
		if (end === -1) end = buf.length;
		if (end > start) {
			const line = buf.toString('utf8', start, end).trim();
			if (line) yield JSON.parse(line);
		}
		start = end + 1;
	}
}

const checkPosition = (where, reel, row) => {
	if (!Number.isInteger(reel) || reel < 0 || reel >= NUM_REELS) {
		problems.push(`${where}: reel ${reel} is off the board`);
	}
	if (!Number.isInteger(row) || row < 1 || row > ROWS) {
		problems.push(
			`${where}: row ${row} is outside the visible window. Rows use the PADDED ` +
				`convention - visible rows are 1..${ROWS}, same as winInfo and getSymbolY.`,
		);
	}
};

for (const file of fs.readdirSync(PUBLISH).filter((f) => f.endsWith('.jsonl.zst'))) {
	const mode = file.replace(/^books_|\.jsonl\.zst$/g, '');
	// The generator is consumed inside the try: it does its reading lazily, so a
	// failure surfaces on the first `next()` rather than at the call.
	try {
		for (const book of readBooks(path.join(PUBLISH, file))) {
			checkedRounds += 1;
			const events = book.events ?? [];

			let railSeen = 0;
			let featureSetAt = -1;
			// The values the most recent reveal put on the board, so a collect can be
			// checked against the board the player was actually looking at.
			const lastBoardValues = new Map();

			events.forEach((event, index) => {
				if (event.type === 'featureSet') {
					featureSetAt = index;
					if (!['sealing', 'swarm'].includes(event.feature)) {
						problems.push(`${mode} book ${book.id}: unknown feature "${event.feature}"`);
					}
				}

				if (event.type === 'reveal') {
					// The field the client's reveal handler reads off each carrier. Named
					// here rather than inferred so that renaming it on either side without
					// the other is what breaks, which is the whole point.
					const CARRIER_VALUE_FIELD = 'multiplier';
					(event.board ?? []).forEach((reel, reelIndex) => {
						reel.forEach((symbol, row) => {
							if (symbol?.name !== 'M') return;
							// Padding rows are not on the board and are not drawn.
							if (row < 1 || row > ROWS) return;
							boardCarriers += 1;
							const value = symbol[CARRIER_VALUE_FIELD];
							if (typeof value !== 'number') {
								problems.push(
									`${mode} book ${book.id} event ${index}: the carrier at ` +
										`(${reelIndex},${row}) has no numeric "${CARRIER_VALUE_FIELD}" - ` +
										`it carries [${Object.keys(symbol).join(', ')}]. The client reads ` +
										`that field to draw the value on the talisman, so every carrier ` +
										`would render blank.`,
								);
							} else if (value <= 0) {
								problems.push(
									`${mode} book ${book.id} event ${index}: the carrier at ` +
										`(${reelIndex},${row}) is worth ${value}`,
								);
							} else {
								lastBoardValues.set(`${reelIndex},${row}`, value);
							}
						});
					});
				}

				if (event.type === 'collect') {
					// Which trigger is legal depends on the game type, and getting this
					// backwards is exactly the kind of thing that reads as "the feature
					// does nothing special".
					const gameType = [...events.slice(0, index)]
						.reverse()
						.find((e) => e.type === 'reveal')?.gameType;
					for (const sweep of event.sweeps ?? []) {
						// A sweep's carriers must be the ones the board showed, at the values
						// it showed them at. The talisman is a promise: game-spec 4.3 says
						// the round may award more than it reads but never less.
						for (const carrier of sweep.carriers ?? []) {
							const key = `${carrier.reel},${carrier.row}`;
							const shown = lastBoardValues.get(key);
							if (shown === undefined) {
								problems.push(
									`${mode} book ${book.id} event ${index}: swept a carrier at ` +
										`(${key}) that the last revealed board did not have one on`,
								);
							} else if (carrier.value + EPS < shown) {
								problems.push(
									`${mode} book ${book.id} event ${index}: the carrier at (${key}) ` +
										`showed ${shown}x and paid ${carrier.value}x - the talisman is a ` +
										`floor, never a ceiling`,
								);
							}
						}
						// ── a line sweep pays the LINE ──────────────────────────────
						//
						// The base game is a 9-line game, and the collect is one of its
						// lines: the run of spirits along a payline is what pays, exactly
						// as a run of any other symbol would be.
						//
						// It did not work that way. The line TRIGGERED the collect and the
						// sweep then took every carrier on the board, so a three-spirit
						// line paid out a five-spirit board. Nothing caught it, because
						// every carrier it swept was genuinely on the board and every
						// award genuinely matched its subtotal - the two checks above both
						// passed on a payout that was nearly twice what the line showed.
						//
						// What was missing is the only thing that could have caught it:
						// that the carriers swept are the ones ON the line named, and that
						// they are the whole run rather than part of it.
						if (sweep.source.kind === 'line') {
							const line = PAYLINES[String(sweep.source.lineIndex)];
							if (!line) {
								problems.push(
									`${mode} book ${book.id} event ${index}: swept line ` +
										`${sweep.source.lineIndex}, which is not a payline`,
								);
							} else {
								const swept = [...(sweep.carriers ?? [])].sort((a, b) => a.reel - b.reel);
								swept.forEach((carrier, position) => {
									if (carrier.reel !== position) {
										problems.push(
											`${mode} book ${book.id} event ${index}: line ` +
												`${sweep.source.lineIndex} swept reel ${carrier.reel} at ` +
												`position ${position} - a line run starts at reel 0 and is ` +
												`unbroken`,
										);
									} else if (carrier.row !== line[carrier.reel] + 1) {
										problems.push(
											`${mode} book ${book.id} event ${index}: line ` +
												`${sweep.source.lineIndex} passes through row ` +
												`${line[carrier.reel] + 1} on reel ${carrier.reel} but the ` +
												`sweep took the carrier at row ${carrier.row} - it paid a ` +
												`carrier that was not on the line`,
										);
									}
								});
								// And the run is not cut short: if the next cell along the line
								// held a carrier too, it belonged to this win.
								const next = swept.length;
								if (next < NUM_REELS) {
									const key = `${next},${line[next] + 1}`;
									if (lastBoardValues.has(key)) {
										problems.push(
											`${mode} book ${book.id} event ${index}: line ` +
												`${sweep.source.lineIndex} stopped at reel ${next} but there ` +
												`is a carrier at (${key}) continuing it`,
										);
									}
								}
							}
						}
						if (gameType === 'basegame' && sweep.source.kind !== 'line') {
							problems.push(
								`${mode} book ${book.id} event ${index}: a ${sweep.source.kind} sweep in the base game - ` +
									`only a carrier LINE collects outside the feature`,
							);
						}
						if (gameType === 'freegame' && sweep.source.kind !== 'collector') {
							problems.push(
								`${mode} book ${book.id} event ${index}: a ${sweep.source.kind} sweep in the feature - ` +
									`only a WILD collects inside it`,
							);
						}
					}
					if (featureSetAt === -1 && events.some((e) => e.type === 'freeSpinTrigger')) {
						// only meaningful inside a feature; a base-game collect has no
						// featureSet before it and should not
					}
					for (const sweep of event.sweeps ?? []) {
						checkedSweeps += 1;
						const where = `${mode} book ${book.id} event ${index}`;

						if (!sweep.carriers?.length) {
							problems.push(`${where}: a sweep with no carriers was emitted`);
							continue;
						}
						for (const carrier of sweep.carriers) {
							checkPosition(where, carrier.reel, carrier.row);
							if (typeof carrier.value !== 'number' || carrier.value <= 0) {
								problems.push(`${where}: carrier has no value (${carrier.value})`);
							}
						}

						// The multiplier is GLOBAL - one per collect, from the rail - not
						// per sweep. A sweep that carried its own would be the old
						// collector-symbol shape leaking back in.
						const mult = event.collectMultiplier;
						if (!Number.isInteger(mult) || mult < 1) {
							problems.push(`${where}: collectMultiplier ${mult} is not a positive integer`);
						}
						if ('multiplier' in sweep.source) {
							problems.push(`${where}: a sweep source carries its own multiplier`);
						}
						if (sweep.source.kind === 'collector') {
							checkPosition(where, sweep.source.position.reel, sweep.source.position.row);
						}

						const subtotal = sweep.carriers.reduce((sum, c) => sum + c.value, 0);
						if (Math.abs(subtotal - sweep.subtotal) > EPS) {
							problems.push(
								`${where}: subtotal ${sweep.subtotal} does not match its carriers (${subtotal})`,
							);
						}
						if (Math.abs(sweep.subtotal * mult - sweep.award) > EPS) {
							problems.push(
								`${where}: award ${sweep.award} is not subtotal ${sweep.subtotal} x ${mult}`,
							);
						}
					}

					// One wild per reel. The strips are built to make this structurally
					// impossible, so a failure here means the strips or the
					// force-placement changed.
					const reels = (event.sweeps ?? [])
						.filter((s) => s.source.kind === 'collector')
						.map((s) => s.source.position.reel);
					if (new Set(reels).size !== reels.length) {
						problems.push(`${mode} book ${book.id}: two collectors swept from the same reel`);
					}
				}

				if (event.type === 'railAdvance') {
					if (event.filled !== railSeen + 1) {
						problems.push(
							`${mode} book ${book.id}: rail went ${railSeen} -> ${event.filled}, expected +1. ` +
								`The event carries the count AFTER the advance.`,
						);
					}
					railSeen = event.filled;
					if (!Number.isInteger(event.collectMultiplier) || event.collectMultiplier < 1) {
						problems.push(
							`${mode} book ${book.id}: rail collectMultiplier ${event.collectMultiplier} is not a positive integer`,
						);
					}
					if (event.filled > RAIL_TOTAL) {
						problems.push(`${mode} book ${book.id}: rail filled ${event.filled} past ${RAIL_TOTAL}`);
					}
					if (event.total !== RAIL_TOTAL) {
						problems.push(`${mode} book ${book.id}: rail total ${event.total}, expected ${RAIL_TOTAL}`);
					}
					if (featureSetAt === -1) {
						problems.push(`${mode} book ${book.id}: rail advanced before any featureSet`);
					}
				}
			});
		}
	} catch (err) {
		problems.push(`${mode}: could not read books (${err.message})`);
	}
}

if (problems.length > 0) {
	console.log(`  !! ${problems.length} contract problem(s)`);
	for (const p of problems.slice(0, 25)) console.log(`     ${p}`);
	if (problems.length > 25) console.log(`     ... and ${problems.length - 25} more`);
	process.exit(1);
}

console.log(
	`OK: collect contract holds across ${checkedRounds} rounds / ${checkedSweeps} sweeps / ${boardCarriers} board carriers`,
);
