// Anticipation tease length guard.
//
// An anticipated reel is slowed down by giving it a longer strip: it spins
// `reelLength * reelPaddingMultiplierAnticipated` extra symbols, and the padding
// ACCUMULATES along the board, so the last reel of a four-reel tease carries four
// times that. Nothing in the code says how long that takes in seconds - it falls
// out of five numbers in constants.ts, the row count, and how early the maths
// starts anticipating. All of them look harmless to edit.
//
// This is here because the numbers went wrong and it cost an upload. The feature
// reel is 7 symbols to the base game's 5, and the maths anticipates the FEATURE
// from the first scatter (`anticipation_triggers` is {basegame: 2, freegame: 1}),
// so the common feature shape is four chained anticipated reels where the base
// game gets three. At the base game's 10x padding that is ~10 SECONDS of reels
// turning - and every reel from the first anticipated one on is marked `noStop`,
// so for the whole of it the stop button does nothing. Review recorded it as the
// bonus round freezing partway through and being unable to continue.
//
// Two things are checked, and the second is the one that actually encodes the
// lesson:
//
//   1. no tease runs longer than its game type's ceiling;
//   2. the feature's tease is not longer than the base game's. The feature reel
//      is taller AND teases more often, so if the two share a multiplier the
//      feature is automatically the worse one - which is exactly the state this
//      game shipped in.
//
// The arithmetic mirrors createReelForSpinning: prepareToSpin's
// GET_PADDING_SIZE_MAP, addPadding's topY, and the two slideY calls in
// normalSpin/anticipatedSpin. If that code changes, this has to follow.
//
// Usage: node design/check_tease_length.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const constants = fs.readFileSync(path.join(appRoot, 'src/game/constants.ts'), 'utf8');

// The longest a tease may take, reels-start to reels-stopped, per game type.
//
// The two numbers are not the same kind of number.
//
// FEATURE_CEILING_MS is a budget: the feature teases on about one spin in five,
// so it has to stay short enough that a player who sees it twice in a ten-spin
// bonus does not read the second one as the round having died.
//
// BASE_CEILING_MS is a ratchet, not an endorsement. The base game inherited a 10x
// anticipation padding from Margin Call and every sibling game in this repo runs
// the same figure, so it is left alone rather than quietly redesigned - but it
// needs a 2-scatter board to fire at all, which is rare, and the stop button now
// cuts through it (getAnticipationIsStoppable in stateGame). The ceiling exists
// so nobody makes it LONGER without noticing.
const FEATURE_CEILING_MS = 4000;
const BASE_CEILING_MS = 6500;

// The other end of the same budget, and the one nobody thought to write down.
//
// A spin can fail by being too SHORT, and the failure mode is not "it felt
// rushed" - it is that the reels stop being reels. Padding is what staggers the
// reel stops, so a spin with no padding lands all five on the same frame and the
// board simply cuts from one arrangement to the next. Measured, the feature's
// turbo spin was 0.1s of that.
//
// The floor applies to the FEATURE only. In the base game a turbo spin is a
// transaction and cutting straight to the result is the point of the setting; in
// the feature every board carries multipliers the player is reading and a rail
// that may be one talisman from paying, and there has to be a spin to watch.
const FEATURE_PLAIN_FLOOR_MS = 800;

const num = (name) => {
	const m = constants.match(new RegExp(`${name}\\s*=\\s*([0-9.]+)`));
	if (!m) throw new Error(`could not read ${name} from constants.ts`);
	return Number(m[1]);
};

const SYMBOL_SIZE = num('SYMBOL_SIZE');
const NUM_REELS = num('NUM_REELS');
const BASE_ROWS = num('BASE_ROWS');

// ── read the SPIN_OPTIONS objects ────────────────────────────────────────────
// Plain-text parsing rather than an import: constants.ts is TypeScript and pulls
// in the rest of the game, and every other guard here reads it the same way.
const readOptions = (name, seen = new Set()) => {
	if (seen.has(name)) throw new Error(`circular spread through ${name}`);
	seen.add(name);

	const m = constants.match(new RegExp(`(?:export )?const ${name} = \\{([\\s\\S]*?)\\n\\};`));
	if (!m) throw new Error(`could not read ${name} from constants.ts`);

	const options = {};
	for (const line of m[1].split('\n')) {
		const spread = line.match(/^\s*\.\.\.(\w+),/);
		if (spread) {
			Object.assign(options, readOptions(spread[1], seen));
			continue;
		}
		const entry = line.match(/^\s*(\w+):\s*([\w.]+),/);
		if (!entry) continue;
		// a value is either a literal or a named constant declared above
		options[entry[1]] = /^[0-9.]+$/.test(entry[2]) ? Number(entry[2]) : num(entry[2]);
	}
	return options;
};

const OPTIONS = {
	default: readOptions('SPIN_OPTIONS_DEFAULT'),
	fast: readOptions('SPIN_OPTIONS_FAST'),
	defaultFreegame: readOptions('SPIN_OPTIONS_DEFAULT_FREEGAME'),
	fastFreegame: readOptions('SPIN_OPTIONS_FAST_FREEGAME'),
};

// stateGame.svelte.ts picks the options by spin type in the BASE game and by the
// turbo flag in the FEATURE, and the split is not arbitrary: the feature passes
// isTurboOverride: false so its reels never take the zero-padding 'fast' type,
// which leaves the flag as the only thing that still knows the player asked for
// turbo. Reproduced here because getting it wrong is what let the tease ignore
// its own setting once already.
const spinOptions = ({ spinType, isFreegame, isTurbo }) => {
	if (spinType !== 'fast') {
		if (isFreegame) return isTurbo ? OPTIONS.fastFreegame : OPTIONS.defaultFreegame;
		return OPTIONS.default;
	}
	return isFreegame ? OPTIONS.fastFreegame : OPTIONS.fast;
};

// ── reproduce one spin ───────────────────────────────────────────────────────
/**
 * @param anticipation the maths' per-reel anticipation values
 * @returns ms from the reels starting to the last one settled
 */
const spinDurationMs = ({ anticipation, rows, isFreegame, isTurbo }) => {
	const reelLength = rows + 2; // paddedReelLength
	const firstAnticipated = anticipation.findIndex(Boolean);
	const hasAnticipation = firstAnticipated >= 0;

	let previousPaddingSize = 0;
	let slowest = 0;

	for (let reelIndex = 0; reelIndex < NUM_REELS; reelIndex++) {
		const isAnticipated = (anticipation[reelIndex] || 0) > 0;
		const noStop = hasAnticipation && reelIndex >= firstAnticipated;
		// The feature never goes 'fast' - it passes isTurboOverride: false, so turbo
		// there is a matter of options rather than of spin type.
		const spinType = isAnticipated
			? 'anticipated'
			: noStop
				? 'normal'
				: isTurbo && !isFreegame
					? 'fast'
					: 'normal';

		const options = spinOptions({ spinType, isFreegame, isTurbo });
		const basePadding = reelLength * options.reelPaddingMultiplierNormal;
		const extra =
			spinType === 'fast'
				? 0
				: spinType === 'anticipated'
					? reelLength * options.reelPaddingMultiplierAnticipated
					: basePadding;
		const paddingSize = previousPaddingSize + extra;
		previousPaddingSize = paddingSize;

		// addPadding: [...target, ...padding, ...prev], drawn from topY
		const stripLength = reelLength + Math.ceil(paddingSize) + reelLength;
		const defaultY = -SYMBOL_SIZE;
		const topY = defaultY - stripLength * SYMBOL_SIZE + reelLength * SYMBOL_SIZE;

		// slideDown, in two legs, then the bounce back
		const midY = defaultY * basePadding;
		const bounceY = defaultY + SYMBOL_SIZE * options.reelBounceSizeMulti;
		const legs =
			spinType === 'fast'
				? Math.abs(bounceY - topY) / options.reelSpinSpeed
				: Math.abs(midY - topY) / options.reelSpinSpeed +
					Math.abs(bounceY - midY) / options.reelSpinSpeedBeforeBounce;
		const bounceBack = Math.abs(defaultY - bounceY) / options.reelBounceBackSpeed;

		slowest = Math.max(slowest, legs + bounceBack);
	}

	return slowest;
};

// ── the shapes the maths can actually send ───────────────────────────────────
// board.py starts numbering anticipated reels from the one AFTER the Nth scatter,
// with N from game_config.anticipation_triggers - 2 in the base game, 1 in the
// feature. So the earliest a tease can start is reel 2 in the base game and reel
// 1 in the feature, and the worst case in both is "and every reel after it".
const worstShape = (firstAnticipated) =>
	Array.from({ length: NUM_REELS }, (_, i) =>
		i < firstAnticipated ? 0 : i - firstAnticipated + 1,
	);

// Both boards are 3 rows - the scaffold grew its feature board to 5 and that is
// gone. What still differs is where the tease can START: the maths anticipates
// from the 2nd scatter in the base game and the 1st in the feature, so the
// feature's worst shape is one reel longer even on an identical strip.
const noTease = Array.from({ length: NUM_REELS }, () => 0);

const CASES = [
	{ label: 'base game, worst tease', anticipation: worstShape(2), rows: BASE_ROWS, isFreegame: false },
	{ label: 'feature, worst tease', anticipation: worstShape(1), rows: BASE_ROWS, isFreegame: true },
	// The ordinary spin, which is most of them and which nothing here used to
	// measure. A ceiling on the worst tease says nothing about the case where the
	// reels barely move: under turbo the base game's 'fast' type sets padding to
	// zero, and since the stagger between reels comes entirely FROM the padding,
	// every reel lands on the same frame. In the feature that read as the board
	// cutting from one arrangement to the next.
	{ label: 'base game, plain spin', anticipation: noTease, rows: BASE_ROWS, isFreegame: false },
	{ label: 'feature, plain spin', anticipation: noTease, rows: BASE_ROWS, isFreegame: true },
];

let problems = 0;
const rows = [];

for (const testCase of CASES) {
	for (const isTurbo of [false, true]) {
		const ms = spinDurationMs({ ...testCase, isTurbo });
		const label = `${testCase.label}${isTurbo ? ', turbo' : ''}`;
		const ceiling = testCase.isFreegame ? FEATURE_CEILING_MS : BASE_CEILING_MS;
		rows.push({ label, ms, isFreegame: testCase.isFreegame, isTurbo });
		if (ms > ceiling) {
			console.log(
				`  !! ${label}: ${(ms / 1000).toFixed(1)}s of unbroken reel spin` +
					` (ceiling ${(ceiling / 1000).toFixed(1)}s)`,
			);
			problems++;
		}
		const isPlain = !testCase.anticipation.some(Boolean);
		if (testCase.isFreegame && isPlain && ms < FEATURE_PLAIN_FLOOR_MS) {
			console.log(
				`  !! ${label}: only ${(ms / 1000).toFixed(1)}s - too short to read as a spin` +
					` (floor ${(FEATURE_PLAIN_FLOOR_MS / 1000).toFixed(1)}s)`,
			);
			problems++;
		}
	}
}

for (const isTurbo of [false, true]) {
	const base = rows.find((row) => !row.isFreegame && row.isTurbo === isTurbo);
	const feature = rows
		.filter((row) => row.isFreegame && row.isTurbo === isTurbo)
		.reduce((worst, row) => (row.ms > worst.ms ? row : worst));
	if (feature.ms > base.ms) {
		console.log(
			`  !! the feature teases longer than the base game${isTurbo ? ' in turbo' : ''}` +
				` (${(feature.ms / 1000).toFixed(1)}s vs ${(base.ms / 1000).toFixed(1)}s)` +
				` - the feature reel is taller and teases far more often, so it has to be the shorter one`,
		);
		problems++;
	}
}

for (const row of rows) console.log(`  ${row.label}: ${(row.ms / 1000).toFixed(1)}s`);

if (problems > 0) {
	console.log(`${problems} tease-length problem(s) found`);
	process.exit(1);
}
console.log('OK: every anticipation tease is within budget');
