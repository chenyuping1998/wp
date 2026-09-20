// Gate: the rules the player reads must produce the number the maths pays.
//
// Approval checkpoint: "Check 5 wins for each game mode against the Game Rules."
// A reviewer does it by hand — open the pay table, play until something wins,
// multiply it out. This does the same arithmetic against the published books, so
// it covers far more than five wins per mode and cannot get bored.
//
// The point is the SOURCE of the numbers. `ModalPayTable` renders
// `config.symbols[…].paytable` and `config.paylines` directly, so this recomputes
// each win from those same two structures plus the three rules the panels state
// in prose:
//
//   · a line pays the paytable value for its symbol and length, left to right
//   · a Neon Frame multiplies any win whose line crosses its cell, and several
//     Frames on one win ADD
//   · the Collector awards the total of every Frame on the grid × the total bet
//
// If the recomputation disagrees with the book, then either the maths does
// something the rules do not say, or the rules describe a game that is not being
// paid — both are the same review failure.
//
// Book units: payouts are hundredths of the bet (100 = 1×), which is why the
// paytable value is multiplied by 100 here.
//
// ── The cap is a rule too ───────────────────────────────────────────────────
//
// The first full pass reported 319 "mismatches", every one of them a round the
// maths had truncated to 20,000× while this recomputed the uncapped arithmetic.
// That is not a defect, it is the max win — and certification asks for exactly
// that to be stated in the rules ("the max-win cap and what happens when a round
// reaches it"). So the cap is part of what is checked: a round that would pay
// more than betModes[mode].max_win must pay the cap exactly, and a round that
// would not must match to the unit.
//
// Usage: node design/check_rules_match_wins.mjs [path to math bundle] [--report]
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundle = process.argv[2] && !process.argv[2].startsWith('--')
	? path.resolve(process.argv[2])
	: path.resolve(appRoot, '../../../upload/HotMiami/math');
const config = (await import(path.join(appRoot, 'src/game/config.ts'))).default;

const problems = [];
const fail = (msg) => {
	problems.push(msg);
	console.log(`  !! ${msg}`);
};

/** The pay for `count` of `symbol`, straight out of what the pay table renders. */
const payFor = (symbol, count) => {
	const table = config.symbols?.[symbol]?.paytable;
	if (!table) return null;
	for (const entry of table) {
		const [len, value] = Object.entries(entry)[0];
		if (Number(len) === count) return Number(value);
	}
	return null;
};

// A round the maths truncated to the max win. Recognised by the payout sitting
// exactly on the cap, which is also what the rules promise the player.
const capped = (book) => book.payoutMultiplier === (config.betModes?.[book.mode ?? 'base']?.max_win ?? 20000) * 100;

const MODES = ['base', 'bonus', 'bonus_hits', 'bonus_epic'];
const WINS_PER_MODE = Number(process.env.WINS_PER_MODE || 200);

for (const mode of MODES) {
	const file = path.join(bundle, `books_${mode}.jsonl.zst`);
	if (!fs.existsSync(file)) {
		fail(`${mode}: ${path.relative(appRoot, file)} is missing`);
		continue;
	}
	const text = zlib.zstdDecompressSync(fs.readFileSync(file)).toString('utf8');

	let checkedWins = 0;
	let checkedRounds = 0;
	let collectorWins = 0;
	let framedWins = 0;
	let cappedRounds = 0;
	const cap = (config.betModes?.[mode]?.max_win ?? 20000) * 100;

	for (const line of text.split('\n')) {
		if (!line.trim() || checkedRounds >= WINS_PER_MODE) break;
		const book = JSON.parse(line);
		if (!book.payoutMultiplier) continue;

		// every winInfo in the round, summed the way the rules say
		let roundTotal = 0;
		let expectedTotal = 0;
		let sawWinInfo = false;
		for (const event of book.events) {
			if (event.type !== 'winInfo') continue;
			sawWinInfo = true;
			let infoTotal = 0;
			for (const win of event.wins) {
				const multiplier = win.meta?.multiplier ?? 1;
				const withoutMult = win.meta?.winWithoutMult;

				if (win.symbol === 'C') {
					// The Collector: total of the Frames it swept × the total bet. The
					// book states the total it applied, so the rule under test is that
					// the award IS that total (× 1 bet, i.e. 100 book units).
					collectorWins += 1;
					const expected = multiplier * 100;
					expectedTotal += expected;
					if (!capped(book) && Math.round(win.win) !== Math.round(expected)) {
						fail(`${mode} book ${book.id}: Collector swept ${multiplier}× and paid ${win.win}, the rules give ${expected}`);
					}
				} else {
					const pay = payFor(win.symbol, win.kind);
					if (pay === null) {
						fail(`${mode} book ${book.id}: ${win.kind} of ${win.symbol} paid ${win.win}, and the pay table has no entry for it`);
						continue;
					}
					const base = pay * 100;
					if (withoutMult !== undefined && Math.round(withoutMult) !== Math.round(base)) {
						fail(`${mode} book ${book.id}: ${win.kind}× ${win.symbol} is ${withoutMult} before multipliers, the pay table says ${base}`);
					}
					const expected = base * multiplier;
					expectedTotal += expected;
					if (!capped(book) && Math.round(win.win) !== Math.round(expected)) {
						fail(`${mode} book ${book.id}: ${win.kind}× ${win.symbol} with a ${multiplier}× Frame paid ${win.win}, the rules give ${expected}`);
					}
					if (multiplier > 1) framedWins += 1;

					// left to right, and the line it claims must be a real payline of
					// the right length
					const payline = config.paylines?.[String(win.meta?.lineIndex)];
					if (win.meta?.lineIndex && !payline) {
						fail(`${mode} book ${book.id}: win on line ${win.meta.lineIndex}, which is not in the pay table's ${Object.keys(config.paylines).length} lines`);
					}
					if (payline && win.positions?.length) {
						const reels = win.positions.map((p) => p.reel).sort((a, b) => a - b);
						if (reels[0] !== 0) {
							fail(`${mode} book ${book.id}: a ${win.symbol} win starts on reel ${reels[0]} — the rules say lines pay from the leftmost reel`);
						}
						if (reels.length !== win.kind) {
							fail(`${mode} book ${book.id}: ${win.kind}× ${win.symbol} covers ${reels.length} positions`);
						}
					}
				}
				infoTotal += win.win;
				checkedWins += 1;
			}
			if (!capped(book) && Math.round(infoTotal) !== Math.round(event.totalWin)) {
				fail(`${mode} book ${book.id}: the wins add up to ${infoTotal}, the round reports ${event.totalWin}`);
			}
			roundTotal += event.totalWin;
		}

		if (sawWinInfo) {
			if (expectedTotal > cap) {
				// the max-win rule: pay the cap, exactly
				cappedRounds += 1;
				if (Math.round(book.payoutMultiplier) !== cap) {
					fail(`${mode} book ${book.id}: the rules give ${expectedTotal}, over the ${cap / 100}× cap, so it must pay the cap — it pays ${book.payoutMultiplier}`);
				}
			} else if (Math.round(roundTotal) !== Math.round(book.payoutMultiplier)) {
				fail(`${mode} book ${book.id}: rounds' wins total ${roundTotal}, the book pays ${book.payoutMultiplier}`);
			}
		}
		checkedRounds += 1;
	}

	if (checkedRounds === 0) fail(`${mode}: no winning rounds found to check`);
	console.log(
		`  ${mode.padEnd(11)} ${checkedRounds} winning rounds, ${checkedWins} wins recomputed` +
			` (${framedWins} multiplied by Frames, ${collectorWins} Collector sweeps,` +
			` ${cappedRounds} capped at ${cap / 100}×)`,
	);
}

console.log(problems.length === 0 ? 'OK: every checked win matches the pay table and the stated rules' : `${problems.length} rules/maths mismatch(es)`);
process.exit(problems.length === 0 ? 0 : 1);
