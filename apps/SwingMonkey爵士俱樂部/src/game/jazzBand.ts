// THE SYMBOLS PLAY WITH THE BAND (2026-11-06).
//
// The H1–H4 instruments (and the W / S leaps) were authored on their own
// ~107 bpm grid — hits 280 ms apart, JAZZ_HITS in meshWin/phrase.ts — and each
// win played a whole pre-mixed phrase file over a 154 bpm bed. Now the act is
// re-timed onto the band's swung grid: the authored hits are kept as the
// act's keyframes, and a piecewise-linear time warp moves each one onto a
// beat position of the running music (JAZZ_BEATS below). The notes the
// instrument plays are scheduled on the SAME context times and pitched to
// the chord the band is on at that moment, so the sax honks a chord tone on
// the beat and the bass walks the bar it is in.
//
// One copy per symbol is heard per win presentation (claimPhrase): the first
// cell to start its act; the others play visibly, in time, in silence.
//
// Turbo, or no music running: the act keeps its authored timing (at the bet
// speed), and the notes go at the authored hits.

import { JAZZ_HITS } from './meshWin/phrase';
import {
	beatAtOrAfter,
	chordAt,
	chordRootRate,
	chordToneRate,
	ctxNow,
	heardPerf,
	musicBpm,
	musicLive,
	musicSwing,
} from './musicClock';

/** Where each authored hit sits in the band's time, in beats from the first. */
export const jazzBeats = (symbol: string, sw: number): number[] | null => {
	switch (symbol) {
		case 'H1': return [0, 1]; // two honks a beat apart
		case 'H2': return [0, sw, 1, 1 + sw]; // the bass walks swung eighths
		case 'H3': return [0, 1 / 3, 2 / 3, 1, 4 / 3, 4 / 3 + 0.1]; // triplets, ending on a flam
		case 'H4': return [0, sw, 1, 1 + sw]; // strum, down-up, down-up
		case 'W': return [0, sw]; // the two swing beats in the air
		case 'S': return [0, 1];
		default: return null;
	}
};

export type JazzNote = {
	name: 'inst_sax' | 'inst_bass' | 'inst_snare' | 'inst_banjo_maj6' | 'inst_banjo_dom7' | 'inst_banjo_min7';
	rate: number;
	gain: number;
	/** context time on the band's clock, when there is one */
	at: number | null;
	/** fallback: ms from now */
	delayMs: number;
};

export type PhrasePlan = {
	/** real ms since the act started → the act's authored ms */
	authored: (realMs: number) => number;
	/** real length of the act */
	totalMs: number;
	notes: JazzNote[];
};

// ─── one heard copy per symbol per presentation ─────────────────────────────
let phrasesOpen = false;
const claimed = new Set<string>();
/** WinWays, as a presentation starts: audible for the first showing, not for idle replays. */
export const openPhrases = (audible: boolean) => {
	phrasesOpen = audible;
	claimed.clear();
};
export const claimPhrase = (symbol: string) => {
	if (!phrasesOpen || claimed.has(symbol)) return false;
	claimed.add(symbol);
	return true;
};

const notesFor = (symbol: string, at: (number | null)[], delays: number[]): JazzNote[] => {
	const note = (i: number, name: JazzNote['name'], rate: number, gain: number): JazzNote => ({
		name, rate, gain, at: at[i], delayMs: delays[i],
	});
	return delays.map((_, i) => {
		const when = at[i] ?? undefined;
		switch (symbol) {
			case 'H1': return note(i, 'inst_sax', chordToneRate(i === 0 ? 1 : 3, when), 0.5);
			case 'H2': return note(i, 'inst_bass', chordToneRate(i, when), i === 0 ? 0.7 : 0.58);
			case 'H3': return note(i, 'inst_snare', 1, [0.75, 0.42, 0.5, 0.8, 0.6, 0.45][i] ?? 0.5);
			default: {
				const q = chordAt(when).quality;
				const name = q === 'maj6' ? 'inst_banjo_maj6' : q === 'dom7' ? 'inst_banjo_dom7' : 'inst_banjo_min7';
				return note(i, name, chordRootRate(when), i % 2 ? 0.36 : 0.5);
			}
		}
	});
};

export const INSTRUMENTS = ['H1', 'H2', 'H3', 'H4'];

/**
 * Plan one act. `startedPerf` is the act's performance.now() start, `speed`
 * the bet speed it would otherwise run at.
 */
export const planPhrase = (symbol: string, durationMs: number, speed: number, startedPerf: number): PhrasePlan => {
	const hits = JAZZ_HITS[symbol] ?? [];
	const beats = jazzBeats(symbol, musicSwing());
	const plain = (): PhrasePlan => ({
		authored: (r) => Math.min(durationMs, r * speed),
		totalMs: durationMs / speed,
		notes: INSTRUMENTS.includes(symbol)
			? notesFor(symbol, hits.map(() => null), hits.map((h) => Math.max(0, startedPerf + h / speed - performance.now())))
			: [],
	});
	if (!musicLive() || speed > 1.05 || !beats || beats.length !== hits.length || !hits.length) return plain();

	const nowCtx = ctxNow();
	const nowPerf = performance.now();
	const heardOffset = heardPerf(nowCtx) - nowPerf; // ms between scheduling and hearing
	// the first hit no earlier than 60% of its authored lead-in, then onto the beat
	const earliestPerf = startedPerf + 0.6 * hits[0];
	const g0 = beatAtOrAfter(nowCtx + (earliestPerf - nowPerf - heardOffset) / 1000);
	if (g0 === null) return plain();
	const beat = 60 / musicBpm();
	const hitsCtx = beats.map((b) => g0 + b * beat);
	const hitsReal = hitsCtx.map((t) => heardPerf(t) - startedPerf);

	// anchors (real ms, authored ms), strictly increasing in both
	const anchors: [number, number][] = [[0, 0]];
	hits.forEach((h, i) => anchors.push([hitsReal[i], h]));
	const last = anchors[anchors.length - 1];
	anchors.push([last[0] + (durationMs - last[1]), durationMs]);
	const authored = (r: number) => {
		if (r <= 0) return 0;
		for (let k = 1; k < anchors.length; k++) {
			const [r1, t1] = anchors[k];
			if (r <= r1) {
				const [r0, t0] = anchors[k - 1];
				return t0 + ((t1 - t0) * (r - r0)) / Math.max(1e-6, r1 - r0);
			}
		}
		return durationMs;
	};
	return {
		authored,
		totalMs: anchors[anchors.length - 1][0],
		notes: INSTRUMENTS.includes(symbol)
			? notesFor(symbol, hitsCtx, hitsCtx.map((t) => Math.max(0, heardPerf(t) - performance.now())))
			: [],
	};
};

// ─── the room hears the notes: lights and props answer each one ─────────────
/** performance.now() times the room should answer, from a soundJazzNotes event */
export const notesHeardAt = (notes: JazzNote[]) => {
	const now = performance.now();
	return notes.map((n) => now + n.delayMs);
};
/** 0..1: a soft attack and a decaying tail after each heard note */
export const noteEnergy = (now: number, heard: number[], life = 260) => {
	let energy = 0;
	for (const at of heard) {
		const age = (now - at) / life;
		if (age <= 0 || age >= 1) continue;
		energy += Math.min(1, age * 7) * (1 - age) ** 2;
	}
	return Math.min(1, energy);
};
