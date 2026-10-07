// Every event type that appears in a book has a handler.
//
//   node design/check_book_events.mjs
//
// ── Why this is the flow check ─────────────────────────────────────────────
//
// The presentation is driven entirely by book events: the RGS hands over a list
// and createPlayBookUtils dispatches each one through bookEventHandlerMap. So
// "does the whole flow work" decomposes into "is every event that can arrive
// handled", and the books in src/stories/data are sampled from real math output
// across base, bonus and superspin — which makes them the closest thing to an
// end-to-end trace that runs without a browser or an RGS.
//
// A missing handler does NOT crash. createPlayBookUtils logs
// 'Missing bookEventHandler in "bookEventHandlerMap" for:' and carries on, so
// the failure mode is a spin that silently skips a beat — no error, nothing on
// screen, and nothing in the build output. That is precisely the class of bug
// that needs a guard rather than a play-through.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(APP, 'src/stories/data');
const read = (f) => fs.readFileSync(f, 'utf8');

/**
 * Declared in the event union, never emitted by this game's math, and never
 * handled — inherited wholesale from the GoBananas100 fork.
 *
 * Checked before adding it here: `grep -r update_global_mult
 * math-sdk/games/GoBananasFrostline` finds nothing (only the 0_0_scatter and
 * CrusherYard sample games call it), and every globalMult in this game's
 * event_config files is a literal 1. It reaches the books only because the
 * *_events.ts fixtures list one specimen of every type in typesBookEvent.ts,
 * not because a spin ever produces one.
 *
 * If the maths ever grows a global multiplier, delete this line first — the
 * guard failing is how the handler gets written.
 */
const KNOWN_UNEMITTED = new Set(['updateGlobalMult']);

// ── the handlers ───────────────────────────────────────────────────────────
const map = read(path.join(APP, 'src/game/bookEventHandlerMap.ts'));
const body = map.slice(map.indexOf('export const bookEventHandlerMap'));
const handlers = new Set([...body.matchAll(/^\t([A-Za-z][A-Za-z0-9_]*):\s/gm)].map((m) => m[1]));
if (handlers.size < 5) {
	console.error(
		`only ${handlers.size} handlers parsed out of bookEventHandlerMap.ts — the object's shape ` +
			`has changed and this guard is no longer reading it. Fix the guard before trusting it.`,
	);
	process.exit(1);
}

// ── the events that actually occur ─────────────────────────────────────────
//
// Two spellings on purpose: base_books/bonus_books are pasted JSON ("type":
// "reveal") while the *_events fixtures are TS literals (type: 'reveal').
// Matching only the TS form found 6 event types instead of 15 and reported a
// clean pass, which is how this guard nearly shipped useless.
const seen = new Map();
for (const f of fs.readdirSync(DATA).filter((f) => f.endsWith('.ts'))) {
	for (const m of read(path.join(DATA, f)).matchAll(
		/["']?type["']?:\s*["']([A-Za-z0-9_]+)["']/g,
	)) {
		if (!seen.has(m[1])) seen.set(m[1], new Set());
		seen.get(m[1]).add(f);
	}
}
if (seen.size < 10) {
	console.error(`only ${seen.size} event types found in ${DATA} — the books are not being read.`);
	process.exit(1);
}

const missing = [...seen.keys()].filter((t) => !handlers.has(t) && !KNOWN_UNEMITTED.has(t)).sort();
const stale = [...KNOWN_UNEMITTED].filter((t) => handlers.has(t));

for (const t of missing) {
	console.error(`no handler for '${t}' (in ${[...seen.get(t)].join(', ')})`);
}
for (const t of stale) {
	console.error(`'${t}' is listed as unemitted but now HAS a handler — drop it from KNOWN_UNEMITTED.`);
}
if (missing.length || stale.length) process.exit(1);

const uncovered = [...handlers].filter((h) => !seen.has(h)).sort();
console.log(
	`OK: ${seen.size} event types across ${fs.readdirSync(DATA).length} book files, all handled` +
		(KNOWN_UNEMITTED.size ? ` (${[...KNOWN_UNEMITTED].join(', ')} knowingly unemitted)` : ''),
);
if (uncovered.length) {
	console.log(`  note: handlers with no book to exercise them: ${uncovered.join(', ')}`);
}
