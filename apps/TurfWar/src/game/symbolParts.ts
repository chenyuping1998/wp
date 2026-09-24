/**
 * Rigged symbols: the parts a symbol is cut into, and what each part does.
 *
 * Everything before this animated a symbol as ONE image — the whole PNG scaled,
 * rotated and offset. That is as far as a flat sprite can go, and it is why the
 * boombox could thump but its speakers could not move, and why the flamingo
 * could dip but could not peck.
 *
 * The art is now delivered cut into layers (design/source/parts/<symbol>/), so a
 * rigged symbol is drawn as a stack of full-canvas PNGs, each with its own
 * transform about its own pivot. `SymbolArt.svelte` draws the stack; a symbol
 * with no entry here keeps rendering exactly as before, as a single sprite.
 *
 * ── Composition ──────────────────────────────────────────────────────────────
 *
 * Part motion is ADDITIVE to the whole-symbol motion in symbolWinMotion.ts /
 * symbolLandMotion.ts. The symbol still leans, thumps and lands as a body; the
 * parts move ON it. Keeping the two separate means the existing gates keep
 * measuring what they always measured, and a symbol can be rigged without
 * rewriting its character motion.
 *
 * ── Pivots ───────────────────────────────────────────────────────────────────
 *
 * A pivot is given in the part's OWN BBOX fractions — [0.5, 1] is bottom centre
 * of that part, [0.5, 0.5] its middle — and resolved against the measured bbox
 * in partsManifest.ts, which is generated from the actual pixels. So "the handle
 * rotates about where it meets the case" survives the art being regenerated at a
 * slightly different size; a hand-copied cell coordinate would not.
 */

/**
 * ── Why this file imports nothing ────────────────────────────────────────────
 *
 * Same rule as symbolWinMotion.ts and symbolLandMotion.ts: the gates load these
 * tables in plain node, and node ESM cannot resolve an extensionless relative
 * import. So the two windows below are restated here rather than imported, and
 * `design/check_symbol_parts.mjs` asserts they still equal the real ones — a
 * copied constant that nothing checks is exactly how a beat drifts out of sync
 * with the body it is supposed to be playing against.
 */

/** mirrors HOLD_MS in symbolWinMotion.ts */
const HOLD_MS = 970;
/** mirrors LAND_MS in symbolLandMotion.ts */
const LAND_MS = 240;

export type PartFrame = {
	/** cell fractions, added to whatever the whole symbol is doing */
	dx: number;
	dy: number;
	rotation: number;
	scaleX: number;
	scaleY: number;
};

export type SymbolPart = {
	/** file stem under static/assets/sprites/hotMiamiParts/<symbol>/ */
	name: string;
	/** asset registry key — must exist in game/assets.ts */
	key: string;
	/** pivot in this part's own bbox fractions: [0.5, 1] is bottom centre */
	pivot: [number, number];
	/**
	 * This part turns through a large angle on purpose. Declared, not inferred:
	 * check_symbol_parts.mjs rejects big rotations because a part swinging past
	 * ~30 degrees has normally come loose from the body it belongs to — which is
	 * right for every part except the one whose identity is that it spins.
	 */
	spins?: boolean;
	/**
	 * How many times this part maps onto itself in a full turn — 5 for a
	 * five-spoke wheel. A landing may finish on any multiple of that angle: the
	 * part looks untouched there, so nothing snaps when the symbol goes static
	 * and swaps back to the flat sprite. Without it a rolling wheel has to end
	 * exactly where it started, which is not what a wheel does.
	 */
	symmetry?: number;
	/**
	 * Alternate drawings of this same part, swapped in for a beat.
	 *
	 * A transform can turn a head; it cannot change its expression. The only way
	 * to make a character act is to draw the face again and swap the image at the
	 * right moment — the standard 2D trick, and the reason the art brief asks for
	 * "the same head, only the mouth and eyes differ": if anything else moves, the
	 * head visibly jumps at the swap. `design/check_parts.py` measures that the
	 * difference from the base is small and concentrated, so "only the face
	 * changed" is enforced rather than trusted.
	 */
	variants?: {
		/** a slow blink while the board sits still */
		blink?: string;
		/** while this symbol is part of a win */
		win?: string;
		/** the rarer face, kept for big wins so it stays worth seeing */
		bigWin?: string;
	};
	/** what this part does while the symbol is winning; `t` is ms since the win */
	win?: (t: number) => Partial<PartFrame>;
	/** what it does as the symbol lands; `t` is ms since touchdown */
	land?: (t: number) => Partial<PartFrame>;
};

/**
 * A light that comes on, drawn additively over the whole symbol.
 *
 * Not a part: it replaces nothing and pivots about nothing, it is the boombox's
 * equaliser lighting up and the car's headlamps switching on. Kept separate from
 * `parts` because it needs neither a pivot nor a motion — a light either is on or
 * is not, and what makes it read is that it appears exactly when the symbol pays.
 */
export type SymbolGlow = {
	/** asset registry key — must exist in game/assets.ts */
	key: string;
	/** peak alpha, 0..1 */
	alpha: number;
	/** ms per pulse; the light breathes rather than sitting flat */
	pulseMs: number;
};

/** Parts are listed BACK TO FRONT — first drawn is furthest away. */
export type SymbolRig = { parts: SymbolPart[]; glow?: SymbolGlow };

const rest = (over: Partial<PartFrame> = {}): PartFrame => ({
	dx: 0,
	dy: 0,
	rotation: 0,
	scaleX: 1,
	scaleY: 1,
	...over,
});

/** Sharp attack, exponential decay — a struck thing. */
const strike = (u: number, sharpness: number) => Math.exp(-sharpness * u);
/** Sawtooth 0→1 over `period` ms. */
const cycle = (t: number, period: number) => (t % period) / period;
/** Progress across the landing, clamped so anything past the end is at rest. */
const landP = (t: number) => Math.max(0, Math.min(1, t / LAND_MS));

// ── the rigs ─────────────────────────────────────────────────────────────────
//
// 空的。切片符號的動作定義在 2026-09-20 搬到 design 的 _legacy 資料夾
// （`symbol_part_rigs_hotmiami_20260920.ts.bak`）—— 它們早就停用了（見下面
// SYMBOL_RIGS 的註解），而唯一還在做的事是讓 assets.ts 留著指向 hotMiamiParts 的
// 條目，而 Vite 對 `new URL(..., import.meta.url)` 是無條件打包的：4.5MB 另一款
// 遊戲的美術每次出貨都在包裡。圖與條目一起刪了，動作留在那份 .bak。


/**
 * Raise every part until it is actually visible, and never shrink one.
 *
 * The rigs were written to give each part its own gesture, and
 * `check_symbol_parts.mjs` measures that — pairwise distance on normalised
 * shapes, blind to amplitude by design. Nothing measured whether a part moved
 * far enough to SEE, and measured in pixels most did not: H2's head turned 2.9
 * degrees and slid 0.9px on a 118px cell, H1's 2.5 degrees and 1.7px. At that
 * size a rigged symbol and a flat PNG are the same picture, and the rig reads as
 * the sprite quivering — 「動圖的樣子做得太不明顯了反而很怪」.
 *
 * A flat multiplier does not work here, unlike the whole-symbol tables: the
 * parts are already spread over two orders of magnitude (H3's peck is 19.5
 * degrees, H2's head turn is 2.9), so any gain big enough to rescue the small
 * ones tears the large ones off the body — and the gate's own bound, 0.5 rad,
 * says so.
 *
 * So each part is scaled by its LOUDEST channel: find the gain that would bring
 * that channel up to a floor of visibility, then take the smallest gain any
 * present channel asks for, which leaves a part that is already loud in one
 * channel exactly where it is. Clamped to [1, MAX] so nothing shrinks, and
 * clamped again against the gate's bounds so the boost can never be the thing
 * that fails the build.
 *
 * A spinner's rotation is left alone for the same reason as in the win table: a
 * wheel turning at a different speed is a different wheel, not a louder one.
 */
// 2026-08-25: raised after the third `poor animation`. 8 degrees and 6px was a
// floor for "can be noticed at all"; the instruction after that round was
// 大破大立, so it is now a floor for "reads as a gesture". A part is SECONDARY
// motion — the symbol's own motion and, once the art lands, its drawn poses are
// the primary — so this sits below the whole-symbol floor in symbolWinMotion.ts
// (0.26 rad / 0.10 cell / 0.15) rather than at it.
const VISIBLE = {
	/** ~13 degrees */
	rotation: 0.23,
	/** cell fractions — 0.085 is ~10px */
	offset: 0.085,
	/** 16% of the part's own size */
	scale: 0.16,
	maxGain: 6,
};

// The gate's limits, restated so the boost stops short of them rather than
// being caught by them. Kept a hair inside (0.46 against 0.5) because the boost
// is computed on a 5ms sample grid and the true peak can sit between samples.
const PART_BOUNDS = { rotation: 0.46, offset: 0.18, scale: 0.45 };

/**
 * Returns the boosted gesture, or `undefined` if it cannot reach the floor.
 *
 * Dropping is the point, not a fallback. 「原本那個什麼鳥小小動一下那些幅度太小的
 * 都拿掉」— a part whose whole range is a couple of pixels does not become a
 * gesture at any gain the art can survive (the bounds below are where the part
 * visibly comes off the body), and leaving it in is what makes a rigged symbol
 * read as a quivering sprite. Six gestures are removed by this rule:
 * H1/head land, H1/torso win, H2/hair_back land, H2/torso win, H4/body win,
 * H5/wheel_rear land — every one of them a sub-2px bob or a sub-5% squash.
 *
 * Every symbol still has at least one part moving in both modes afterwards,
 * which check_symbol_parts.mjs enforces, and from the next round the drawn poses
 * carry the win beat outright.
 */
const boostFrame = (
	fn: (t: number) => Partial<PartFrame>,
	windowMs: number,
	spins: boolean,
): ((t: number) => Partial<PartFrame>) | undefined => {
	let peakRotation = 0;
	let peakOffset = 0;
	let peakScale = 0;
	for (let t = 0; t <= windowMs; t += 5) {
		const f = fn(t);
		peakRotation = Math.max(peakRotation, Math.abs(f.rotation ?? 0));
		peakOffset = Math.max(peakOffset, Math.abs(f.dx ?? 0), Math.abs(f.dy ?? 0));
		peakScale = Math.max(peakScale, Math.abs((f.scaleX ?? 1) - 1), Math.abs((f.scaleY ?? 1) - 1));
	}

	const wanted: number[] = [];
	const allowed: number[] = [VISIBLE.maxGain];
	if (peakRotation > 1e-6 && !spins) {
		wanted.push(VISIBLE.rotation / peakRotation);
		allowed.push(PART_BOUNDS.rotation / peakRotation);
	}
	if (peakOffset > 1e-6) {
		wanted.push(VISIBLE.offset / peakOffset);
		allowed.push(PART_BOUNDS.offset / peakOffset);
	}
	if (peakScale > 1e-6) {
		wanted.push(VISIBLE.scale / peakScale);
		allowed.push(PART_BOUNDS.scale / peakScale);
	}

	// Largest wanted, not smallest: stopping at the first channel to reach the
	// floor leaves a part that moves on two axes quieter than one that moves on
	// one, which is backwards. Same correction as symbolWinMotion.ts.
	// A part that asks for nothing is a spinner: `consider` skips a spinner's
	// rotation on purpose (a wheel turning at a different rate is a different
	// wheel), and its rotation is the only channel it has. Gain 1, and the floor
	// check below passes it on that rotation.
	const gain = wanted.length ? Math.max(1, Math.min(Math.max(...wanted), ...allowed)) : 1;

	// Does it clear the floor on ANY channel once boosted? A part only has to be
	// big on the axis it actually moves along — the flamingo's neck is rotation,
	// the speaker cones are scale — so this asks the question per channel and
	// keeps the part if any one of them passes. What gets dropped is the part
	// that is under the floor on every axis it uses, at every gain the bounds
	// allow: those are not gestures, they are trembles.
	// The 1e-6 is not cosmetic: a part that lands exactly ON the floor computes
	// its own gain as floor/peak and then fails `peak * gain >= floor` by one
	// ulp. H3's neck (0.2 rad against a 0.23 floor) was dropped by that, which
	// would have left the flamingo with no part moving on landing at all.
	const EPS = 1e-6;
	const clears =
		(!spins && peakRotation * gain >= VISIBLE.rotation - EPS) ||
		peakOffset * gain >= VISIBLE.offset - EPS ||
		peakScale * gain >= VISIBLE.scale - EPS ||
		(spins && peakRotation >= VISIBLE.rotation);
	if (!clears) return undefined;
	if (gain === 1) return fn;

	return (t: number) => {
		const f = fn(t);
		const out: Partial<PartFrame> = { ...f };
		if (f.rotation !== undefined && !spins) out.rotation = f.rotation * gain;
		if (f.dx !== undefined) out.dx = f.dx * gain;
		if (f.dy !== undefined) out.dy = f.dy * gain;
		if (f.scaleX !== undefined) out.scaleX = 1 + (f.scaleX - 1) * gain;
		if (f.scaleY !== undefined) out.scaleY = 1 + (f.scaleY - 1) * gain;
		return out;
	};
};

const boostRig = (rig: SymbolRig): SymbolRig => ({
	...rig,
	parts: rig.parts.map((part) => ({
		...part,
		land: part.land && boostFrame(part.land, LAND_MS, !!part.spins),
		win: part.win && boostFrame(part.win, HOLD_MS, !!part.spins),
	})),
});

/**
 * Part-based rigs, currently DISABLED.
 *
 * The rig definitions above describe motion for Hot Miami's cast — the variable
 * names say so: hawaiianGuy, blonde, flamingo, boombox, convertible. Capo
 * Nostra's symbols are a signet ring, a skyline, a cash case, whiskey and a
 * sedan, and the part PNGs under sprites/hotMiamiParts/ were never redrawn.
 *
 * So the parts do not depict the symbols they are attached to. Landing H3 would
 * have swapped the cash case for a pink flamingo, H1 the signet ring for a man
 * in a Hawaiian shirt. design/run_check_parts.mjs measured the gap at 60-119
 * mean levels per symbol and says exactly this — "the symbol would change
 * appearance the moment it lands" — but it runs with --report, so the build
 * stayed green while the game was rendering another game's characters on every
 * landing.
 *
 * Emptying the map is the correct stopgap, not a hack: getSymbolRig returns null
 * for anything absent and SymbolArt falls back to animating the whole sprite,
 * which is the behaviour a symbol with no parts is meant to have. Nothing else
 * needs to change.
 *
 * To re-enable: draw Capo-themed parts into sprites/hotMiamiParts/<sym>/ matching
 * the part names each rig above declares, re-run design/build_parts_manifest.py,
 * put the entries back here, and confirm design/run_check_parts.mjs reports a
 * small mean-level difference for every symbol. The motion is worth keeping —
 * it is only the artwork that belongs to the other game.
 */
export const SYMBOL_RIGS: Record<string, SymbolRig> = Object.fromEntries(
	Object.entries({} as Record<string, SymbolRig>).map(([name, rig]) => [name, boostRig(rig)]),
);

/** Exposed so design/check_symbol_parts.mjs can prove the copies above match. */
export const PART_WINDOWS = { HOLD_MS, LAND_MS };

export const getSymbolRig = (name: string): SymbolRig | null => SYMBOL_RIGS[name] ?? null;

/**
 * Resolve a part's pivot to cell coordinates (fractions of the cell, origin at
 * its centre) against the part's measured bounding box. `bbox` comes from
 * partsManifest.ts — passed in rather than imported, see the note at the top.
 *
 * A part with no measurement pivots about the centre of the cell, which makes a
 * missing or unmeasured part behave like the flat sprite instead of flying off
 * to a corner.
 */
export const resolvePivot = (
	bbox: [number, number, number, number] | undefined,
	pivot: [number, number],
): [number, number] => {
	if (!bbox) return [0, 0];
	const [x0, y0, x1, y1] = bbox;
	return [x0 + (x1 - x0) * pivot[0], y0 + (y1 - y0) * pivot[1]];
};

/**
 * Which drawing of this part to use right now.
 *
 * Falls back to the base key at every step, so a rig can name a variant the art
 * has not been delivered for and the symbol simply keeps its usual face.
 */
export const partKey = (
	part: SymbolPart,
	state: { mode: 'win' | 'land' | 'none'; big?: boolean; blinking?: boolean },
): string => {
	if (state.mode === 'win') {
		if (state.big && part.variants?.bigWin) return part.variants.bigWin;
		if (part.variants?.win) return part.variants.win;
		return part.key;
	}
	if (state.blinking && part.variants?.blink) return part.variants.blink;
	return part.key;
};

/**
 * Does this symbol have anything to show on a settled board?
 *
 * Used to decide whether a resting cell needs the rigged stack at all: only the
 * symbols with a blink do, and only for the ~100ms the blink lasts.
 */
export const hasIdleVariant = (rig: SymbolRig | null) =>
	!!rig?.parts.some((part) => part.variants?.blink);

/**
 * The glow's alpha at time `t` into the win. Rises fast, then breathes — a light
 * switching on, not a light fading up.
 */
export const glowAlpha = (glow: SymbolGlow, t: number) => {
	const on = Math.min(1, t / 90);
	const breathe = 0.78 + 0.22 * Math.sin((t / glow.pulseMs) * Math.PI * 2);
	return glow.alpha * on * breathe;
};

export const partFrame = (
	part: SymbolPart,
	mode: 'win' | 'land',
	t: number,
): PartFrame => rest((mode === 'win' ? part.win?.(t) : part.land?.(t)) ?? {});
