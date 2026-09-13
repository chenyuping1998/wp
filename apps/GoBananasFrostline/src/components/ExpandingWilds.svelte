<script lang="ts" module>
	export type EmitterEventExpandingWilds =
		| { type: 'expandingWildNew'; reel: number; row: number; mult: number }
		| { type: 'expandingWildsUpdate'; wilds: { reel: number; row: number; mult: number }[] }
		| { type: 'expandingWildsRestore'; wilds: { reel: number; mult: number }[] }
		| { type: 'expandingWildsClear' };
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut, cubicIn, backOut } from 'svelte/easing';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_SIZES, BOARD_DIMENSIONS } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';
	import GoldText from './GoldText.svelte';
	import FxBurst from './FxBurst.svelte';
	import {
		FROST_TIMING,
		cellFrost,
		crystalGrowth,
		crystalSeed,
		CRYSTALS_PER_CELL,
		CRACK_AT,
		rimeAt,
		slabAt,
		clarifyAt,
	} from '../game/frostTakeover';

	// ── WHICH TAKEOVER RUNS ───────────────────────────────────────────────────
	//
	// Two complete versions of the moment a Wild takes over its reel live in this
	// file. They share the state machine, the multiplier badge, the win flash and
	// the locked panel; they differ in the three beats between the Wild landing
	// and the panel being there.
	//
	//   'grow'    v1. The Wild infects the reel cell by cell, the five Wilds are
	//             pulled into the middle, and the impact throws the banner open.
	//             Written for the jungle build and kept intact — nothing below is
	//             edited by the switch, so this is byte-for-byte what shipped.
	//
	//   'freeze'  v2, and what the game runs. Frost creeps out of the landed Wild
	//             and over the reel, the reel freezes into a slab of ice, and the
	//             ice clarifies into the WILD panel. Shapes and timing are in
	//             src/game/frostTakeover.ts, gated by design/check_frost_takeover.mjs.
	//
	// To go back: one word.
	// `as TakeoverVersion` rather than a type annotation on the const: svelte-check
	// narrows an annotated const back to its literal here, so every
	// `TAKEOVER === 'grow'` in the markup came back as "these types have no
	// overlap". The assertion keeps the union, and the switch stays one word.
	type TakeoverVersion = 'grow' | 'freeze';
	const TAKEOVER = 'freeze' as TakeoverVersion;

	// ── v1 ('grow'), in three readable beats ─────────────────────────────────
	//
	//   1. INFECT  a Wild lands, and the rest of the reel turns Wild — the
	//              change spreads outward from the landed cell, one cell at a
	//              time, each with a flash and a pop.
	//   2. MERGE   the five Wilds are pulled into the middle of the reel and
	//              collapse into one another.
	//   3. LOCK    the impact throws the full-reel WILD banner open, multiplier
	//              plaque included, and the reel stays locked.
	//
	// v2 ('freeze') reuses the same three phase names for the same three slots:
	// 'infect' is the frost creeping, 'merge' is the ice setting, and the banner
	// beat is the ice going clear.
	//
	// Everything here is drawn by this component. The previous version handed the
	// finished art off to a spine `idle` animation partway through, and when that
	// handoff slipped there was a window with nothing drawn at all — the reel went
	// blank behind the opaque backing. One owner, no handoff, no window.

	const ROWS = BOARD_DIMENSIONS.y;
	const INFECT_MS = 840;
	const MERGE_MS = 460;
	const BANNER_MS = 260;
	// fraction of the infect phase each cell takes to pop in
	const CELL_POP = 0.26;

	type Phase = 'infect' | 'merge' | 'idle';
	type WildEntry = {
		reel: number;
		row: number;
		mult: number;
		phase: Phase;
		infect: Tween<number>;
		merge: Tween<number>;
		banner: Tween<number>;
		badgeScale: Tween<number>;
		// What the badge actually prints. While the value is climbing it steps
		// through the integers between the old and new figure; every one of those is
		// a value the wild genuinely passed through, so the badge can never show a
		// number above what the book paid. Equal to `mult` at every other moment.
		displayMult: number;
		// 0..1 envelope for the upward surge drawn on the reel when the multiplier
		// grows — see chargeAndGrow.
		surge: Tween<number>;
		// Badge shake amplitude in px, spiked on landing and eased back to 0. The
		// jitter itself is derived from the pulse clock at render time.
		shake: Tween<number>;
		// Set when a win lands on this reel while its takeover is still running:
		// there is no panel to light yet, so runTakeover fires the flash on the way
		// out instead of the win being dropped.
		pendingWin: boolean;
		// Drives the whole win light-up on the card's gold frame. A Tween, not a
		// boolean, on purpose: a plain-boolean mutation on an array element is not
		// reliably reactive in Svelte 5, and a Tween also runs a fixed envelope that
		// stays visible even when the free-game volley hides the lines after ~0.5s.
		winFlash: Tween<number>;
	};

	const context = getContext();
	const REEL_CENTER_Y = BOARD_SIZES.height / 2;
	// padded row r (1..ROWS) is centred at r*SYMBOL_SIZE - SYMBOL_SIZE/2
	const rowCenterY = (row: number) => row * SYMBOL_SIZE - SYMBOL_SIZE / 2;
	const visibleRows = Array.from({ length: ROWS }, (_, i) => i + 1);

	let wilds = $state<WildEntry[]>([]);
	let bursts = $state<{ id: number; x: number }[]>([]);
	let sparks = $state<Spark[]>([]);
	// "+N" figures that float off the badge when a multiplier grows. Driven by the
	// `pulse` clock rather than their own rAF loop: that clock is already running
	// whenever any wild exists, which is the only time a gain can be created.
	let gains = $state<{ id: number; x: number; amount: number; born: number }[]>([]);
	let nextId = 0;
	let clock = $state(0);
	let pulse = $state(0);
	let rafId = 0;
	let sparksRunning = false;

	// ── conversion sparks (additive, texture-based) ──────────────────────────
	type Spark = {
		id: number;
		x: number;
		y: number;
		vx: number;
		vy: number;
		born: number;
		life: number;
		size: number;
		star: boolean;
		// px/s^2 pulling the spark down. Separate per spark so one integrator can
		// serve all three flavours: 'burst' arcs under gravity, 'implode' travels
		// straight to its target, 'rise' floats up against a weak pull.
		gravity: number;
		// 'implode' sparks brighten as they arrive instead of fading out — they are
		// energy being gathered, so they have to read as converging, not dying.
		converge: boolean;
	};

	const startSparkLoop = () => {
		if (sparksRunning) return;
		sparksRunning = true;
		const step = (now: number) => {
			clock = now;
			sparks = sparks.filter((s) => now - s.born < s.life);
			if (sparks.length > 0) rafId = requestAnimationFrame(step);
			else sparksRunning = false;
		};
		rafId = requestAnimationFrame(step);
	};

	type SparkMode = 'burst' | 'implode' | 'rise';

	const spawnSparks = (x: number, y: number, count = 8, mode: SparkMode = 'burst') => {
		const now = performance.now();
		sparks = [
			...sparks,
			...Array.from({ length: count }, (_, i) => {
				const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
				if (mode === 'implode') {
					// Born on a ring and aimed at the centre, arriving exactly as the
					// life expires — so the gather visibly completes on the beat the
					// burst starts rather than trailing into it.
					const life = 260 + Math.random() * 120;
					const radius = SYMBOL_SIZE * (0.9 + Math.random() * 0.8);
					return {
						id: nextId++,
						x: x + Math.cos(a) * radius,
						y: y + Math.sin(a) * radius,
						vx: (-Math.cos(a) * radius) / (life / 1000),
						vy: (-Math.sin(a) * radius) / (life / 1000),
						born: now,
						life,
						size: 9 + Math.random() * 11,
						star: i % 3 === 0,
						gravity: 0,
						converge: true,
					};
				}
				if (mode === 'rise') {
					// Narrow upward fan with a weak pull, so they climb the reel
					// instead of spraying — the value went UP and the sparks say so.
					return {
						id: nextId++,
						x,
						y,
						vx: (Math.random() - 0.5) * 90,
						vy: -(150 + Math.random() * 210),
						born: now,
						life: 420 + Math.random() * 280,
						size: 11 + Math.random() * 15,
						star: i % 3 === 0,
						gravity: 90,
						converge: false,
					};
				}
				const speed = 70 + Math.random() * 120;
				return {
					id: nextId++,
					x,
					y,
					vx: Math.cos(a) * speed,
					vy: Math.sin(a) * speed,
					born: now,
					life: 300 + Math.random() * 220,
					size: 12 + Math.random() * 16,
					star: i % 3 === 0,
					gravity: 260,
					converge: false,
				};
			}),
		];
		startSparkLoop();
	};

	const sparkState = (s: Spark) => {
		const t = Math.max(0, (clock - s.born) / 1000);
		const p = Math.min(1, (clock - s.born) / s.life);
		return {
			x: s.x + s.vx * t,
			y: s.y + s.vy * t + s.gravity * t * t,
			size: s.size * (s.converge ? 0.5 + 0.5 * p : 1 - p * 0.5),
			alpha: s.converge ? Math.min(1, p * 2.2) : (1 - p) ** 1.4,
		};
	};

	// Each locked reel breathes on its own phase and rate — sharing one made
	// several locked reels flare in lockstep, which reads as a single object.
	const auraPulse = (reel: number) => 0.5 + 0.5 * Math.sin(pulse / (540 + reel * 47) + reel * 1.7);

	// Plan B: a distinctly faster beat for a reel that is part of a win. The idle
	// aura breathes on a ~3.4s period; this runs ~2.5x quicker (~1.3s) so the
	// change from "locked" to "winning" reads as a shift in tempo, not just
	// brightness. Per-reel phase, same as auraPulse, so several winning reels do
	// not flare in lockstep.
	const winPulse = (reel: number) => 0.5 + 0.5 * Math.sin(pulse / (205 + reel * 17) + reel * 1.7);

	// ── beat 1: which cells have turned, and how far ─────────────────────────
	// Cells convert in order of distance from the landed one, so the change
	// visibly spreads out of it rather than appearing all at once.
	const cellOrder = (wild: WildEntry) =>
		visibleRows
			.filter((r) => r !== wild.row)
			.sort((a, b) => Math.abs(a - wild.row) - Math.abs(b - wild.row));

	const cellProgress = (wild: WildEntry, row: number) => {
		if (row === wild.row) return 1;
		const rank = cellOrder(wild).indexOf(row);
		if (rank < 0) return 0;
		const start = (rank / ROWS) * (1 - CELL_POP);
		return Math.min(1, Math.max(0, (wild.infect.current - start) / CELL_POP));
	};

	// opaque backing spans only the cells that have actually turned, so the
	// original symbols are hidden exactly as fast as they are replaced
	const backingRect = (wild: WildEntry) => {
		const turned = visibleRows.filter((r) => cellProgress(wild, r) > 0.35);
		if (turned.length === 0) return null;
		const top = rowCenterY(Math.min(...turned)) - SYMBOL_SIZE / 2;
		const bottom = rowCenterY(Math.max(...turned)) + SYMBOL_SIZE / 2;
		return { top: Math.max(0, top), bottom: Math.min(BOARD_SIZES.height, bottom) };
	};

	// ── v2 ('freeze'): drawing the frost ─────────────────────────────────────
	//
	// How far the frost has got, per cell. `infect` is the beat's own 0→1 clock,
	// so this reads the same tween v1 uses and needs no extra state.
	const frostSpan = (wild: WildEntry) =>
		Math.max(...visibleRows.map((r) => Math.abs(r - wild.row)), 1);
	const frostOf = (wild: WildEntry, row: number) =>
		cellFrost(wild.infect.current * FROST_TIMING.frostMs, Math.abs(row - wild.row), frostSpan(wild));

	/**
	 * One dendrite: six arms at 60°, each with two pairs of barbs swept back at
	 * 45°. The same geometry as the Buy Bonus plate's crystal, but grown rather
	 * than stamped — `arm` and `barb` come from frostTakeover.crystalGrowth and
	 * the barbs deliberately lag, so it forms outward the way ice does.
	 */
	const drawCrystal = (
		g: PixiGraphics,
		cx: number,
		cy: number,
		r: number,
		rot: number,
		growth: { arm: number; barb: number; alpha: number },
		width: number,
		color: number,
		alpha: number,
	) => {
		if (growth.arm <= 0.01 || alpha <= 0.01) return;
		const armLen = r * growth.arm;
		for (let i = 0; i < 6; i++) {
			const a = rot + (Math.PI / 3) * i;
			const dx = Math.cos(a);
			const dy = Math.sin(a);
			g.moveTo(cx, cy);
			g.lineTo(cx + dx * armLen, cy + dy * armLen);
			if (growth.barb <= 0.01) continue;
			for (const [at, len] of [
				[0.5, 0.34],
				[0.78, 0.22],
			] as const) {
				const bx = cx + dx * armLen * at;
				const by = cy + dy * armLen * at;
				for (const sweep of [-1, 1]) {
					const ba = a + sweep * (Math.PI / 4);
					g.moveTo(bx, by);
					g.lineTo(
						bx + Math.cos(ba) * armLen * len * growth.barb,
						by + Math.sin(ba) * armLen * len * growth.barb,
					);
				}
			}
		}
		g.stroke({ width, color, alpha: alpha * growth.alpha });
	};

	/** The frost lying on one cell: rime round the rim, then crystals on the face. */
	const drawCellFrost = (g: PixiGraphics, x: number, row: number, f: number, fade = 1) => {
		if (f <= 0.005 || fade <= 0.005) return;
		const cy = rowCenterY(row);
		const left = x - SYMBOL_SIZE / 2;
		const top = cy - SYMBOL_SIZE / 2;

		// 1. the haze — the surface going milky. Kept low: the symbol underneath
		//    has to stay readable until the slab arrives, or the reel appears to
		//    blank out a beat early.
		g.roundRect(left + 2, top + 2, SYMBOL_SIZE - 4, SYMBOL_SIZE - 4, 10);
		g.fill({ color: 0xdff1ff, alpha: 0.34 * f * fade });

		// 2. the rime — a furred crust creeping in from the edges, leading the
		//    crystals. This is what makes it read as frost forming ON something
		//    rather than a white square fading in.
		const rime = rimeAt(f);
		if (rime.depth > 0.002) {
			const d = rime.depth * SYMBOL_SIZE;
			// IRREGULAR, and that is the whole point. Evenly spaced spikes of similar
			// length drew a row of tick marks along every edge — the cells came out
			// looking like they had a ruler printed round them. Position and length
			// are both jittered off the same hash, and roughly a third of the slots
			// are left empty, so the crust breaks up the way a real one does.
			const EDGE_SPIKES = 22;
			for (let i = 0; i < EDGE_SPIKES; i++) {
				const j = Math.abs(Math.sin((i * 12.9898 + row * 7.13) * 1.0) * 43758.5453) % 1;
				const j2 = Math.abs(Math.sin((i * 4.53 + row * 19.7) * 1.0) * 24634.6345) % 1;
				if (j2 < 0.34) continue; // a gap, so the crust is not a comb
				const u = (i + 0.15 + j * 0.7) / EDGE_SPIKES;
				const spike = d * (0.25 + 0.75 * j);
				const px = left + u * SYMBOL_SIZE;
				const py = top + u * SYMBOL_SIZE;
				// leaning slightly along the edge rather than dead perpendicular
				const lean = (j - 0.5) * spike * 0.5;
				g.moveTo(px, top);
				g.lineTo(px + lean, top + spike);
				g.moveTo(px, top + SYMBOL_SIZE);
				g.lineTo(px + lean, top + SYMBOL_SIZE - spike);
				g.moveTo(left, py);
				g.lineTo(left + spike, py + lean);
				g.moveTo(left + SYMBOL_SIZE, py);
				g.lineTo(left + SYMBOL_SIZE - spike, py + lean);
			}
			g.stroke({ width: 1.4, color: 0xffffff, alpha: rime.alpha * 0.45 * fade });
		}

		// 3. the crystals, each on its own delay inside this cell's frosting
		for (let i = 0; i < CRYSTALS_PER_CELL; i++) {
			const seed = crystalSeed(row, i);
			const local = (f - seed.delay) / Math.max(0.05, 1 - seed.delay);
			const growth = crystalGrowth(local);
			const cx = x + seed.dx * SYMBOL_SIZE;
			const ccy = cy + seed.dy * SYMBOL_SIZE;
			const r = seed.radius * SYMBOL_SIZE;
			// drawn twice: a soft wide pass for the bloom, a fine one for the edges
			drawCrystal(g, cx, ccy, r, seed.rotation, growth, 3.4, 0x9fdcff, 0.3 * f * fade);
			drawCrystal(g, cx, ccy, r, seed.rotation, growth, 1.1, 0xffffff, 0.85 * f * fade);
		}
	};

	// ── beat 2: the five Wilds collapse toward the middle ────────────────────
	const mergedCell = (wild: WildEntry, row: number) => {
		const m = wild.merge.current;
		const from = rowCenterY(row);
		// The tween itself carries the acceleration (cubicIn below), so the
		// mapping stays linear — easing it twice cancelled out into a drift.
		const t = m;
		return {
			y: from + (REEL_CENTER_Y - from) * t,
			scale: 1 - 0.62 * t,
			alpha: 1 - Math.max(0, (m - 0.78) / 0.22),
		};
	};

	// ── multiplier growth (free game, once per spin per locked reel) ──────────
	//
	// Gen-2 changed what this presentation has to say. The multiplier used to be
	// re-rolled from 2x-50x every spin, so it was drawn as a slot wheel: digits
	// flickering through random values before landing. It now only ever GROWS —
	// an increment is added to what the wild already holds, capped at 100x — and
	// that wheel actively lied about it, flashing values BELOW the current one on
	// the way to a higher answer.
	//
	// So the beat is charge-and-release instead of spin-and-stop:
	//
	//   1. CHARGE   motes are pulled in off the reel and the badge tightens down
	//               on them. Nothing has happened yet; the reel is winding up.
	//   2. SURGE    the badge snaps open, a column of light runs UP the reel, and
	//               the number counts up through the values it passes through.
	//               Never random, never downward.
	//   3. SETTLE   scale eases home and a "+N" floats off the top.
	//
	// Intensity scales with the SIZE OF THE INCREMENT, not the absolute value:
	// what just happened is the gain, and a +1 on a 90x wild should feel like a
	// +1. The absolute figure is already legible in the badge itself.
	// The biggest single increment any distribution can draw (game_config.py
	// mult_increments). Used only to normalise the intensity ramp — the ceiling
	// itself (config.max_wild_multiplier, 100) is enforced by the maths and never
	// needs to be known here.
	const MAX_INCREMENT = 50;
	// Budget: this runs once per locked reel on every free spin, and by the end of
	// a feature four reels are locked across up to 18 spins. The sequence below is
	// ~700ms, staggered rather than sequential, so a four-reel group finishes in
	// about 1.2s — readable without adding 12s to a feature.
	const ROLL_STAGGER = 150;
	const CHARGE_MS = 200;
	// Dwell after the whole group has finished climbing — see expandingWildsUpdate.
	const HOLD_AFTER_GROW_MS = 340;
	const COUNT_MS = 260;
	const COUNT_STEPS = 9;

	const badgeY = BOARD_SIZES.height - SYMBOL_SIZE * 0.44;

	// The whole light-up, in one place so a wild that was mid-takeover when the
	// win arrived gets exactly the same treatment as the rest.
	//
	// Driven entirely by winFlash (a Tween). It used to be gated by a separate
	// winHold boolean, but (a) a plain-boolean mutation on an array element is not
	// reliably reactive in Svelte 5 — the badge animates only because a Tween
	// carries its own reactivity — and (b) winLinesHide cleared the boolean the
	// instant the volley ended, which in a fast free-game volley killed the frame
	// before it could register. A Tween is always reactive and runs its full
	// envelope regardless of when the lines are hidden.
	//
	// Envelope: snap to full, hold bright, then a long fade — ~1.1s of clearly-lit
	// frame, not a flash. winPulse adds the shimmer on top.
	const flashWin = (entry: WildEntry) => {
		entry.badgeScale.set(1.45, { duration: 200, easing: cubicOut }).then(() => {
			entry.badgeScale.set(1, { duration: 260, easing: cubicOut });
		});
		entry.winFlash.set(1, { duration: 120, easing: cubicOut }).then(() => {
			entry.winFlash.set(0.72, { duration: 520 }).then(() => {
				entry.winFlash.set(0, { duration: 480, easing: cubicOut });
			});
		});
	};

	const chargeAndGrow = async (entry: WildEntry, to: number) => {
		const from = entry.mult;
		const gained = to - from;
		const x = getSymbolX(entry.reel);

		// Already at the ceiling — the value is genuinely unchanged, so there is
		// nothing to count and faking a climb would be the same lie the old wheel
		// told. One steady acknowledging pulse and out.
		if (gained <= 0) {
			entry.displayMult = to;
			entry.mult = to;
			entry.badgeScale.set(1.16, { duration: 150, easing: cubicOut }).then(() => {
				entry.badgeScale.set(1, { duration: 280, easing: cubicOut });
			});
			await waitForTimeout(170);
			return;
		}

		const t = Math.min(1, gained / MAX_INCREMENT);

		// 1 — CHARGE
		spawnSparks(x, badgeY, 8 + Math.round(10 * t), 'implode');
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_landing' });
		entry.badgeScale.set(0.86, { duration: CHARGE_MS, easing: cubicIn });
		await waitForTimeout(CHARGE_MS);

		// 2 — SURGE
		entry.surge.set(1, { duration: 90, easing: cubicOut }).then(() => {
			entry.surge.set(0, { duration: 430, easing: cubicOut });
		});
		entry.badgeScale.set(1.45 + 0.5 * t, { duration: 120, easing: backOut });
		entry.shake.set(1.5 + 9 * t, { duration: 60 }).then(() => {
			entry.shake.set(0, { duration: 300 + 240 * t, easing: cubicOut });
		});
		spawnSparks(x, badgeY, 6 + Math.round(12 * t), 'rise');
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_update' });
		context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 0.1 + 0.6 * t });

		// Count through the integers, never more steps than there are values to
		// show: a +2 ticks twice, not nine times through repeated numbers.
		const steps = Math.max(1, Math.min(gained, COUNT_STEPS));
		for (let s = 1; s <= steps; s++) {
			entry.displayMult = Math.round(from + (gained * s) / steps);
			await waitForTimeout(COUNT_MS / steps);
		}
		entry.displayMult = to;
		entry.mult = to;

		// 3 — SETTLE
		const gain = { id: nextId++, x, amount: gained, born: Date.now() };
		gains = [...gains, gain];
		entry.badgeScale.set(1, { duration: 300, easing: cubicOut });
		await waitForTimeout(190);
		gains = gains.filter((g) => g.id !== gain.id);
	};

	// "+N" rises off the badge and fades. GAIN_MS also gates removal in
	// chargeAndGrow, so the figure is gone from state as soon as it is invisible.
	const GAIN_MS = 620;
	const gainState = (g: { born: number }) => {
		const p = Math.min(1, Math.max(0, (pulse - g.born) / GAIN_MS));
		return { y: badgeY - SYMBOL_SIZE * (0.32 + 0.5 * p), alpha: (1 - p) ** 1.3 };
	};

	onMount(() => () => cancelAnimationFrame(rafId));

	// The pulse clock only feeds auraPulse/winPulse, and both are called only from
	// inside the {#each wilds} block — so with no locked reels nothing reads it.
	// It used to run unconditionally from mount, updating $state ~42x a second for
	// the whole session even though base game never has an expanding wild. Tie it
	// to the list instead: the effect re-runs when wilds becomes empty or non-empty
	// and its cleanup stops the timer.
	$effect(() => {
		if (wilds.length === 0) return;
		const id = setInterval(() => (pulse = Date.now()), 24);
		return () => clearInterval(id);
	});

	/**
	 * v2 ('freeze'). Three beats, and they are one process rather than three
	 * events: the reel cools, sets, then clears.
	 *
	 *   1. FROST    frost creeps out of the landed Wild across the reel. The
	 *               symbols stay readable underneath — the reel is getting colder,
	 *               not being covered yet.
	 *   2. FREEZE   the frost sets into a slab. It cracks once, and THAT is where
	 *               the impact and the sound land, not at the end.
	 *   3. CLARIFY  the milky ice goes clear and what is left is the WILD panel.
	 *
	 * The cues are this game's own — frost_creep, ice_freeze and ice_crack,
	 * synthesised by design/generate_audio_frost.mjs. They replaced the jungle
	 * set's multiplier tick and wild explosion, which were the right shapes made
	 * of the wrong material.
	 */
	const runFreezeTakeover = async (entry: WildEntry, x: number) => {
		// 1 ── FROST
		//
		// Ticks are placed at the moment each cell's own frosting STARTS, not on a
		// flat cadence, so the sound tracks the front rather than running against
		// it. The landed cell gets none: it is where the frost is coming from and
		// it is already frosting as the beat opens.
		// the bed runs under the whole creep, so the beat has a floor rather than
		// being four ticks in silence
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ice_freeze' });
		const span = frostSpan(entry);
		for (const row of visibleRows) {
			const d = Math.abs(row - entry.row);
			if (d === 0) continue;
			const startsAt = (d / span) * FROST_TIMING.frostMs * 0.62;
			waitForTimeout(startsAt).then(() => {
				if (entry.phase !== 'infect') return;
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_frost_creep' });
			});
		}
		entry.infect.set(1, { duration: FROST_TIMING.frostMs });
		await waitForTimeout(FROST_TIMING.frostMs);

		// 2 ── FREEZE. `merge` is the beat's 0→1 clock; the v1 collapse it drives
		// is not rendered in this version.
		entry.phase = 'merge';
		entry.merge.set(1, { duration: FROST_TIMING.freezeMs });
		// the crack, at the instant slabAt says the ice sets
		waitForTimeout(FROST_TIMING.freezeMs * CRACK_AT).then(() => {
			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_ice_crack' });
			context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 1 });
			spawnSparks(x, REEL_CENTER_Y, 14);
		});
		await waitForTimeout(FROST_TIMING.freezeMs);

		// 3 ── CLARIFY. The panel comes up as the ice goes clear; `banner` drives
		// both, so they cannot drift apart.
		entry.banner.set(1, { duration: FROST_TIMING.clarifyMs });
		await waitForTimeout(FROST_TIMING.clarifyMs);

		entry.phase = 'idle';
		entry.badgeScale.set(1, { duration: 300, easing: backOut });
		if (entry.pendingWin) {
			entry.pendingWin = false;
			flashWin(entry);
		}
	};

	const runTakeover = async (created: WildEntry) => {
		// Mutate through the $state proxy, not the object the handler built.
		//
		// expandingWildNew creates a plain object literal and pushes it with
		// `wilds = [...]`. Svelte then proxies the array, but the caller's reference
		// still points at the RAW object — so `created.phase = 'idle'` writes past
		// the proxy's set trap and nothing is invalidated. The two blocks gated on
		// `{#if wild.phase !== 'idle'}` (the opaque backing and the individual W
		// sprites) therefore keep rendering with the stale phase until something
		// else reassigns the array — which is why the old W layer stayed visible
		// under the finished panel on later spins.
		//
		// Reading it back out of `wilds` yields the proxy, so every write below
		// invalidates properly. (expandingWildsUpdate already does this via
		// wilds.find, which is why its multiplier updates were never affected.)
		const entry = wilds.find((w) => w.reel === created.reel) ?? created;
		const x = getSymbolX(entry.reel);

		if (TAKEOVER === 'freeze') {
			await runFreezeTakeover(entry, x);
			return;
		}

		// The monkey hoots as he lands and eats his way across the reel. Fired here,
		// at the very start of the takeover, and the sound fades itself out as the
		// grow finishes (~1.5s of visual, the clip holds ~2s then fades) so it reads
		// as one continuous beat rather than a bark that stops before the panel does.
		//
		// INSIDE the 'grow' branch, and it was not always: the first version of the
		// freeze takeover left this above the branch, so a monkey hooted over a reel
		// icing over. Found by inventorying which jungle cues are still reachable,
		// which is the only reason to keep such an inventory.
		context.eventEmitter.broadcast({ type: 'soundMonkeyExpand' });

		// beat 1 — the reel turns Wild, cell by cell, out of the landed one
		spawnSparks(x, rowCenterY(entry.row), 10);
		const order = cellOrder(entry);
		order.forEach((row, rank) => {
			waitForTimeout(((rank + 0.6) / ROWS) * INFECT_MS).then(() => {
				if (entry.phase !== 'infect') return;
				spawnSparks(x, rowCenterY(row), 7);
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_landing' });
			});
		});
		entry.infect.set(1, { duration: INFECT_MS });
		await waitForTimeout(INFECT_MS + 90);

		// beat 2 — pull them together
		entry.phase = 'merge';
		// accelerate inward: they are being pulled, not drifting
		entry.merge.set(1, { duration: MERGE_MS, easing: cubicIn });
		await waitForTimeout(MERGE_MS * 0.78);

		// beat 3 — impact, and the banner is thrown open by it
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_wild_explode' });
		context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 1 });
		bursts = [...bursts, { id: nextId++, x }];
		spawnSparks(x, REEL_CENTER_Y, 16);
		entry.banner.set(1, { duration: BANNER_MS, easing: backOut });
		await waitForTimeout(BANNER_MS);

		entry.phase = 'idle';
		entry.badgeScale.set(1, { duration: 300, easing: backOut });
		if (entry.pendingWin) {
			entry.pendingWin = false;
			flashWin(entry);
		}
	};

	context.eventEmitter.subscribeOnMount({
		expandingWildNew: async ({ reel, row, mult }) => {
			const entry: WildEntry = {
				reel,
				// a Wild can land on a padding row; clamp so the spread has a real origin
				row: Math.min(ROWS, Math.max(1, row)),
				mult,
				displayMult: mult,
				shake: new Tween(0),
				phase: 'infect',
				infect: new Tween(0),
				merge: new Tween(0),
				banner: new Tween(0),
				badgeScale: new Tween(0),
				surge: new Tween(0),
				pendingWin: false,
				winFlash: new Tween(0),
			};
			wilds = [...wilds.filter((w) => w.reel !== reel), entry];
			await runTakeover(entry);
		},

		// Sticky wilds grow their multiplier on each reveal. Each one charges and
		// releases (see chargeAndGrow), with the force scaling to the size of the
		// gain — a +50 should feel like it hit the board harder than a +1.
		//
		// Reels are STAGGERED, not run one after another. Fully sequential reads
		// better in isolation but costs ~700ms per locked reel, and by the end of a
		// feature four reels are locked — that is 2.8s added to every one of up to
		// 18 spins. Starting each ROLL_STAGGER after the last keeps the
		// one-at-a-time reading while the whole group finishes in about 1.2s.
		expandingWildsUpdate: async ({ wilds: updated }) => {
			const targets = updated
				.map((update) => ({ update, entry: wilds.find((w) => w.reel === update.reel) }))
				.filter((t): t is { update: (typeof updated)[number]; entry: WildEntry } => !!t.entry);
			if (targets.length === 0) return;

			// Turbo gets the SAME climb as everything else.
			//
			// It used to take a compressed path — no charge wind-up, no sparks, no
			// sound, a three-step count, ~230ms for the whole group. That was written
			// to a budget that no longer applies: the accumulating multiplier is the
			// feature of this game, and the moment it grows is the one moment in a
			// free spin actually worth stopping for. Racing past it to save a fifth
			// of a second was saving time on the wrong thing.
			//
			// The staggered full sequence runs about 1.1s for a four-reel group.
			await Promise.all(
				targets.map(async ({ update, entry }, i) => {
					await waitForTimeout(i * ROLL_STAGGER);
					await chargeAndGrow(entry, update.mult);
				}),
			);
			// A beat with the new figures standing still, before the next spin takes
			// the board. Without it the last reel's count-up ends and the reels are
			// already moving again — the number is on screen but never at rest.
			await waitForTimeout(HOLD_AFTER_GROW_MS);
		},

		// Bet resume: rebuild locked reels instantly, no animation.
		expandingWildsRestore: ({ wilds: restored }) => {
			wilds = restored.map((wild) => ({
				reel: wild.reel,
				row: Math.ceil(ROWS / 2),
				mult: wild.mult,
				displayMult: wild.mult,
				shake: new Tween(0),
				phase: 'idle' as const,
				infect: new Tween(1),
				merge: new Tween(1),
				banner: new Tween(1),
				badgeScale: new Tween(1),
				surge: new Tween(0),
				pendingWin: false,
				winFlash: new Tween(0),
			}));
		},

		expandingWildsClear: () => {
			wilds = [];
		},

		// A win line crossing a locked reel. The individual W symbols underneath
		// deliberately do not animate (see WinLines.animatePositions), so the
		// panel itself has to carry the win.
		winLinesShow: ({ wins }) => {
			if (wilds.length === 0) return;
			const winningReels = new Set(wins.flatMap((win) => win.positions.map((p) => p.reel)));
			for (const entry of wilds) {
				if (!winningReels.has(entry.reel)) continue;
				// Its panel is not open yet, so there is no frame to light. Hand it to
				// runTakeover, which fires the flash the moment the panel locks —
				// skipping it outright is how a reel could be part of a winning line
				// and still sit there dark.
				if (entry.phase !== 'idle') {
					entry.pendingWin = true;
					continue;
				}
				flashWin(entry);
			}
		},
	});
</script>

<BoardContainer>
	{#each wilds as wild (wild.reel)}
		{@const x = getSymbolX(wild.reel)}

		<!-- v1 opaque backing: covers the original symbols exactly as far as the
		     conversion has actually reached. v2 has no equivalent — the frost lies
		     ON the symbols and the slab is what eventually hides them. -->
		{#if TAKEOVER === 'grow' && wild.phase !== 'idle'}
			{@const rect = backingRect(wild)}
			{#if rect}
				<Graphics
					draw={(g: PixiGraphics) => {
						const h = rect.bottom - rect.top;
						g.clear();
						if (h <= 0) return;
						g.beginFill(0x0a1508, 1);
						g.drawRect(x - SYMBOL_SIZE / 2, rect.top, SYMBOL_SIZE, h);
						g.endFill();
						g.lineStyle(3, 0xffd43b, 0.7);
						g.drawRoundedRect(x - SYMBOL_SIZE / 2 + 3, rect.top + 3, SYMBOL_SIZE - 6, h - 6, 10);
					}}
				/>
			{/if}
		{/if}

		<!-- v1 beat 1 + 2: the individual Wilds -->
		{#if TAKEOVER === 'grow' && wild.phase !== 'idle'}
			{#each visibleRows as row (row)}
				{@const p = cellProgress(wild, row)}
				{#if p > 0}
					{@const m = mergedCell(wild, row)}
					{@const pop = wild.phase === 'merge' ? 1 : backOut(p)}
					<Sprite
						key="gbW"
						anchor={0.5}
						{x}
						y={wild.phase === 'merge' ? m.y : rowCenterY(row)}
						width={SYMBOL_SIZE * pop * (wild.phase === 'merge' ? m.scale : 1)}
						height={SYMBOL_SIZE * pop * (wild.phase === 'merge' ? m.scale : 1)}
						alpha={wild.phase === 'merge' ? m.alpha : 1}
					/>
					<!-- conversion flash: brightest at the instant the cell turns -->
					{#if wild.phase === 'infect' && p < 1}
						<Sprite
							key="fxGlow"
							anchor={0.5}
							{x}
							y={rowCenterY(row)}
							width={SYMBOL_SIZE * 1.5}
							height={SYMBOL_SIZE * 1.5}
							tint={0xfff3bd}
							blendMode="add"
							alpha={0.85 * (1 - p)}
						/>
					{/if}
				{/if}
			{/each}
		{/if}

		<!-- v1 beat 2: streaks converging on the middle as they are pulled in -->
		{#if TAKEOVER === 'grow' && wild.phase === 'merge'}
			{@const mp = wild.merge.current}
			{#each [-1, 1] as dir (dir)}
				<Sprite
					key="fxStreak"
					anchor={0.5}
					{x}
					y={REEL_CENTER_Y + dir * BOARD_SIZES.height * 0.26 * (1 - mp)}
					width={BOARD_SIZES.height * 0.42 * (1 - mp)}
					height={SYMBOL_SIZE * 0.24}
					rotation={Math.PI / 2}
					tint={0xffe98a}
					blendMode="add"
					alpha={0.6 * mp}
				/>
			{/each}
		{/if}

		<!--
			v2 beats 1-3: frost, then the slab, then the ice clearing.

			One Graphics for the whole reel rather than one per cell: the rime and
			the crystals are strokes, and a stroke costs a draw call, so five cells
			times three crystals times two passes is thirty of them per frame if
			each cell owns its own node.
		-->
		{#if TAKEOVER === 'freeze' && wild.phase !== 'idle'}
			<Graphics
				draw={(g: PixiGraphics) => {
					g.clear();

					// Once the banner beat starts the ice is clearing, so EVERYTHING
					// below — the frost as well as the slab — fades on the same clock
					// the panel is opening on. The first version faded only the slab
					// and left the crystals at full strength until the phase flipped to
					// 'idle', at which point the whole block stopped rendering and they
					// vanished on one frame. An offline filmstrip caught it: the last
					// frame still had six crisp crystals per cell on it.
					const clear =
						wild.banner.current > 0
							? clarifyAt(wild.banner.current * FROST_TIMING.clarifyMs)
							: 1;
					if (clear <= 0.005) return;

					// ── beat 1: frost lying on each cell ───────────────────────────
					for (const row of visibleRows) drawCellFrost(g, x, row, frostOf(wild, row), clear);

					// ── beat 2: the slab ───────────────────────────────────────────
					if (wild.phase !== 'merge' && wild.banner.current <= 0) return;
					const slab = slabAt(wild.merge.current * FROST_TIMING.freezeMs);

					const left = x - SYMBOL_SIZE / 2;
					const h = BOARD_SIZES.height;

					// the body of the ice
					g.roundRect(left, 0, SYMBOL_SIZE, h, 12);
					g.fill({ color: 0xcfe9ff, alpha: slab.haze * clear });

					// flow lines down the slab: ice that set in a column has grain,
					// and without it the slab reads as a pane of frosted glass laid
					// over the reel rather than as the reel itself frozen
					if (slab.striation > 0.02) {
						for (let i = 0; i < 7; i++) {
							const u = (i + 0.5) / 7;
							const lx = left + u * SYMBOL_SIZE;
							const bow = Math.sin(i * 2.3) * SYMBOL_SIZE * 0.06;
							g.moveTo(lx, 4);
							g.bezierCurveTo(lx + bow, h * 0.33, lx - bow, h * 0.66, lx, h - 4);
						}
						g.stroke({
							width: 2,
							color: 0xffffff,
							alpha: 0.16 * slab.striation * clear,
						});
					}

					// the lit rim: an edge is what tells the eye the slab has a
					// thickness rather than being a tint
					g.roundRect(left + 2, 2, SYMBOL_SIZE - 4, h - 4, 11);
					g.stroke({ width: 3, color: 0xffffff, alpha: 0.5 * slab.rim * clear });
					g.roundRect(left + 6, 6, SYMBOL_SIZE - 12, h - 12, 9);
					g.stroke({ width: 1.5, color: 0x9fdcff, alpha: 0.45 * slab.rim * clear });

					// ── the crack ──────────────────────────────────────────────────
					// Three fractures from the middle outward, drawn only while the
					// flash lasts. Deterministic angles, because a crack that lands
					// somewhere new every spin reads as noise on the fifteenth one.
					if (slab.crack > 0.01) {
						const cy = h / 2;
						for (const [a, len] of [
							[-0.4, 0.46],
							[2.5, 0.4],
							[1.2, 0.3],
						] as const) {
							let px = x;
							let py = cy;
							g.moveTo(px, py);
							for (let seg = 1; seg <= 4; seg++) {
								const jitter = Math.sin(seg * 7.7 + a * 3) * 0.22;
								const step = (len * h) / 4;
								px += Math.cos(a + jitter) * step * 0.4;
								py += Math.sin(a + jitter) * step;
								g.lineTo(px, py);
							}
						}
						g.stroke({ width: 2.5, color: 0xffffff, alpha: 0.9 * slab.crack * clear });
						// and the flash of the moment it sets
						g.roundRect(left, 0, SYMBOL_SIZE, h, 12);
						g.fill({ color: 0xffffff, alpha: 0.5 * slab.crack * clear });
					}
				}}
			/>
		{/if}

		<!-- beat 3: the locked banner. Height is driven by `banner`, so it is
		     thrown open by the impact rather than fading in. -->
		{#if wild.banner.current > 0}
			{@const b = Math.min(1, wild.banner.current)}
			<Sprite
				key="gbWxPanel"
				anchor={0.5}
				{x}
				y={REEL_CENTER_Y}
				width={SYMBOL_SIZE}
				height={BOARD_SIZES.height * b}
			/>
		{/if}

		{@const winGlow = wild.winFlash.current}
		{#if wild.phase === 'idle' && winGlow <= 0.01}
			<!-- breathing aura so the locked reel keeps reading alive. Suppressed
			     while the reel is winning, so the brighter win frame stands alone. -->
			<Graphics
				draw={(g: PixiGraphics) => {
					const glow = auraPulse(wild.reel);
					g.clear();
					g.lineStyle(9, 0xffd75e, 0.08 + 0.1 * glow);
					g.drawRoundedRect(x - SYMBOL_SIZE / 2 - 3, -3, SYMBOL_SIZE + 6, BOARD_SIZES.height + 6, 16);
					g.lineStyle(4, 0xffe98a, 0.16 + 0.18 * glow);
					g.drawRoundedRect(x - SYMBOL_SIZE / 2, 0, SYMBOL_SIZE, BOARD_SIZES.height, 14);
				}}
			/>
		{/if}

		<!--
			Win light-up — on the wild CARD's own gold frame, not a halo around the
			reel.

			INSET IS MEASURED FROM THE ART, and the art has already changed once. The
			original wx card carried its gold frame ~14px in from the edge, so this was
			drawn at 14/256. The delivered gen-2 panel puts its frame 1-3px from the
			edge instead — measured by scanning inward for gold at seven heights — which
			left the highlight tracing a rectangle of jungle background 6.5 screen px
			INSIDE the frame. It lit up perfectly and looked like nothing had happened.
			Re-measure if the panel art is replaced again.

			Driven entirely by winFlash (a Tween, so always reactive and running its
			full ~1.1s envelope) — see the winLinesShow handler for why the old winHold
			boolean was dropped. Every alpha is scaled by winGlow so the frame is
			plainly lit at the peak and fully gone at the end; winPulse only shimmers on
			top of it.
		-->
		{#if winGlow > 0.01}
			{@const p = winPulse(wild.reel)}
			{@const left = x - SYMBOL_SIZE / 2}
			{@const inset = SYMBOL_SIZE * (3 / 256)}
			{@const fx0 = left + inset}
			{@const fy0 = inset}
			{@const fw = SYMBOL_SIZE - inset * 2}
			{@const fh = BOARD_SIZES.height - inset * 2}
			{@const rad = SYMBOL_SIZE * (14 / 256)}
			<Graphics
				draw={(g: PixiGraphics) => {
					g.clear();
					// soft bloom hugging the frame, so the gold reads as glowing metal
					g.roundRect(fx0, fy0, fw, fh, rad);
					g.stroke({ width: 13, color: 0xffe050, alpha: winGlow * (0.3 + 0.18 * p) });
					// the frame line itself, bright — this is what "lights up"
					g.roundRect(fx0, fy0, fw, fh, rad);
					g.stroke({ width: 5, color: 0xfff3bd, alpha: winGlow * (0.85 + 0.15 * p) });
					// crisp white highlight riding on top of the frame line
					g.roundRect(fx0, fy0, fw, fh, rad);
					g.stroke({ width: 2, color: 0xffffff, alpha: winGlow * (0.65 + 0.35 * p) });
				}}
			/>
		{/if}

		<!--
			Multiplier. Deliberately NOT a filled plate any more: the opaque banner
			was as wide as the reel and tall enough to sit on the housing's gold
			frame. It is now a compact ring — brass outline, no fill — pulled up off
			the bottom rail, and the WILD lettering behind it was shrunk (see
			design/generate_symbols_realistic.mjs) to leave it clear space.
		-->
		<!--
			The surge: a column of light that runs UP the reel out of the badge when
			the multiplier grows. Direction is the whole point — the value can only
			increase now, so the one unmistakable cue is upward motion. Additive and
			drawn as a direct sibling of the panel with no mask or filter between
			them, because additive blending inside a masked container composites
			against an empty render target and disappears.
		-->
		{#if wild.surge.current > 0.01}
			{@const s = wild.surge.current}
			<Sprite
				key="fxStreak"
				anchor={0.5}
				{x}
				y={badgeY - BOARD_SIZES.height * 0.42 * s}
				width={BOARD_SIZES.height * 0.78 * s}
				height={SYMBOL_SIZE * 0.5}
				rotation={Math.PI / 2}
				tint={0xffe98a}
				blendMode="add"
				alpha={0.55 * s}
			/>
			<Sprite
				key="fxGlow"
				anchor={0.5}
				{x}
				y={badgeY}
				width={SYMBOL_SIZE * 1.9 * s}
				height={SYMBOL_SIZE * 1.9 * s}
				tint={0xfff3bd}
				blendMode="add"
				alpha={0.5 * s}
			/>
		{/if}

		{#if wild.badgeScale.current > 0}
			{@const r = SYMBOL_SIZE * 0.26}
			{@const sh = wild.shake.current}
			<!-- Shake jitter is read off the pulse clock rather than kept in state:
			     that clock already ticks at 24ms whenever any wild exists, so the
			     rattle costs nothing extra. Two different divisors keep x and y out
			     of phase, otherwise the badge just slides on a diagonal. -->
			<Container
				x={x + (sh > 0.05 ? Math.sin(pulse / 7) * sh : 0)}
				y={badgeY + (sh > 0.05 ? Math.cos(pulse / 5.5) * sh : 0)}
				scale={wild.badgeScale.current}
			>
				<Graphics
					draw={(g: PixiGraphics) => {
						const glow = auraPulse(wild.reel);
						g.clear();
						// soft halo only — enough to lift the number off the art behind
						// it without boxing it in
						g.lineStyle(10, 0xffd75e, 0.1 + 0.1 * glow);
						g.drawCircle(0, 0, r);
						g.lineStyle(3.5, 0xd8a334, 1);
						g.drawCircle(0, 0, r);
						g.lineStyle(1.5, 0xfff3bd, 0.7);
						g.drawCircle(0, 0, r - 5);
					}}
				/>
				<GoldText text={`${wild.displayMult}X`} fontSize={SYMBOL_SIZE * 0.27} maxWidth={r * 1.7} />
			</Container>
		{/if}
	{/each}

	{#each sparks as spark (spark.id)}
		{@const s = sparkState(spark)}
		<Sprite
			key={spark.star ? 'fxStar' : 'fxGlow'}
			anchor={0.5}
			x={s.x}
			y={s.y}
			width={s.size}
			height={s.size}
			tint={0xfff2b0}
			blendMode="add"
			alpha={s.alpha}
		/>
	{/each}

	<!-- "+N" rising off a badge that just grew -->
	{#each gains as gain (gain.id)}
		{@const g = gainState(gain)}
		{#if g.alpha > 0.01}
			<Container x={gain.x} y={g.y} alpha={g.alpha}>
				<GoldText
					text={`+${gain.amount}`}
					fontSize={SYMBOL_SIZE * 0.22}
					maxWidth={SYMBOL_SIZE * 0.9}
				/>
			</Container>
		{/if}
	{/each}

	{#each bursts as burst (burst.id)}
		<FxBurst
			x={burst.x}
			y={REEL_CENTER_Y}
			scale={1.5}
			flavour="frost"
			oncomplete={() => (bursts = bursts.filter((b) => b.id !== burst.id))}
		/>
	{/each}
</BoardContainer>
