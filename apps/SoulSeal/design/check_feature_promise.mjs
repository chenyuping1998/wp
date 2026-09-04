// Buy-mode feature guard.
//
// A buy is a product, and the product is which free-game feature it opens. The
// two are genuinely different games: SEALING RITE (100x) is the rail - twelve
// sockets, milestones at 5, 9 and 12, a rising collect multiplier - and GRAND
// SEALING (300x) is the swarm, which guarantees a wild beside a spirit on every
// spin and has no rail at all.
//
// betModeMeta says so on the cards. The maths did not deliver it, in two ways
// that no existing check could see:
//
//   * announce_feature read `forced == "swarm" || scatter_count >= 5`, so a bet
//     mode forcing "sealing" was ignored. 6.87% of 100x buys drew five scatters
//     and opened the swarm - no rail, on the mode whose card promises one.
//   * the 300x's wincap distribution named no feature at all, so the 0.4% of its
//     rounds that take that branch fell through to sealing and drew a rail the
//     mode never awards.
//
// Both are invisible from inside a round: every event is well-formed, the RTP is
// on target, and the contract guard passes. What is wrong is only visible ACROSS
// rounds - the mode is not one product.
//
// So this checks constancy rather than correctness. It does not need to know
// which feature belongs to which buy; it asserts that each buy is ALWAYS THE SAME
// ONE, and that the rail appears if and only if the feature is sealing. Those two
// properties together are what a player is being sold.
//
// Usage: node design/check_feature_promise.mjs
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

// The BUY modes. The base and active modes deliberately let the scatter count
// decide - five scatters open the swarm there, and that is the reward for the
// harder trigger.
const BUY_MODES = ['bonus', 'bonus300'];

/** Yield the books in a .jsonl.zst one at a time, without ever holding the file as a string. */
function* readBooks(file) {
	let buf;
	if (typeof zlib.zstdDecompressSync === 'function') {
		buf = zlib.zstdDecompressSync(fs.readFileSync(file));
	} else {
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

let problems = 0;

for (const mode of BUY_MODES) {
	const file = path.join(PUBLISH, `books_${mode}.jsonl.zst`);
	if (!fs.existsSync(file)) {
		console.log(`SKIP ${mode}: no books`);
		continue;
	}

	const seen = new Map(); // feature -> count
	const railWithout = []; // rounds that advanced a rail outside sealing
	const noFeature = [];
	let rounds = 0;

	for (const book of readBooks(file)) {
		rounds += 1;
		let feature = null;
		let railed = false;
		for (const event of book.events ?? []) {
			if (event.type === 'featureSet') feature = event.feature;
			else if (event.type === 'railAdvance') railed = true;
		}
		if (feature === null) {
			if (noFeature.length < 3) noFeature.push(book.id);
			continue;
		}
		seen.set(feature, (seen.get(feature) ?? 0) + 1);
		if (railed && feature !== 'sealing' && railWithout.length < 3) railWithout.push(book.id);
	}

	const summary = [...seen.entries()]
		.sort((a, b) => b[1] - a[1])
		.map(([f, n]) => `${f} ${((100 * n) / rounds).toFixed(2)}%`)
		.join(', ');
	console.log(`  ${mode.padEnd(9)} ${rounds.toLocaleString()} rounds  ->  ${summary}`);

	if (seen.size > 1) {
		const [, minorCount] = [...seen.entries()].sort((a, b) => b[1] - a[1])[1];
		console.log(
			`  !! ${mode}: opens ${seen.size} different features. A buy is one product - ` +
				`${minorCount.toLocaleString()} of ${rounds.toLocaleString()} rounds give the player ` +
				`something other than what the card sold them.`,
		);
		problems += 1;
	}
	if (noFeature.length > 0) {
		console.log(`  !! ${mode}: rounds with no featureSet at all (e.g. book ${noFeature[0]})`);
		problems += 1;
	}
	if (railWithout.length > 0) {
		console.log(
			`  !! ${mode}: the rail advanced on a non-sealing round (e.g. book ${railWithout[0]}) - ` +
				`the rail belongs to sealing alone`,
		);
		problems += 1;
	}
}

if (problems > 0) {
	console.log(`\n${problems} problem(s) found`);
	process.exit(1);
}
console.log('OK: each buy opens exactly one feature, and only sealing carries a rail');
