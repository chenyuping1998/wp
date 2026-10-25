<script lang="ts" module>
	export type EmitterEventReelBlast =
		| {
				type: 'reelBlast';
				reels: number[];
				symbols: SymbolName[];
				level: number;
				maxLevel: number;
				/** the whole board went up — the thing the feature is a chase for */
				full: boolean;
		  }
		| { type: 'reelBlastClear' };
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Graphics, Container } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import BlastSwell from './BlastSwell.svelte';
	import BlastFx, { type BlastPlan } from './BlastFx.svelte';
	import {
		CHARGE_MS,
		COLUMN_FLASH_DELAY_MS,
		blastLook,
		blastBeats,
		blastEndAt,
		cellRevealAt,
		impactAt,
		copyArriveAt,
		phasesAt,
		pillarAt,
		type BlastLook,
	} from '../game/blastTimeline';
	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { getSymbolX, getSymbolInfo } from '../game/utils';
	import type { SymbolName } from '../game/types';

	const context = getContext();

	// THE DETONATION, IN FOUR BEATS.
	//
	// The reveal has already landed the board the reels stopped on. This turns it
	// into the board that was scored, and the order is the whole point: the player
	// must see what was there BEFORE it goes, because what was there is what
	// decides the fill symbol.
	//
	//   CHARGE    the covered reels dim and lightning crawls out of the bomb
	//   SHATTER   the bang lands: each symbol glitches into flying neon pixels
	//   PUFF      a pillar of plasma erupts and covers the reel completely
	//   HOLD      fully hidden — the symbols are swapped in here, unseen
	//   DISPERSE  the pillar collapses like a CRT switching off, revealing what
	//             it left behind (the drawing is described at draw() below)
	//   SETTLE    the new board is simply held, with nothing moving on it
	//
	// SETTLE earns its place by being empty. The reveal is the payload of the
	// whole feature and it used to run straight into the win evaluation, so the
	// board the dynamite produced was already being counted before the player had
	// finished reading it. A beat of stillness is what turns "symbols changed"
	// into "look what it left".
	//
	// SHATTER is what makes the blast destructive rather than decorative. Without
	// it the old symbols simply stop existing behind a cloud; with it the player
	// watches them be destroyed, which is the thing the dynamite is FOR. It also
	// buys the cover honestly — by the time the smoke arrives the cells are
	// already empty, so the cloud is hiding a hole rather than hiding a swap.
	//
	// The swap happens UNDER THE COVER, which is the whole reason for the cloud.
	// The previous version swapped behind a white flash, and a flash is
	// transparent for most of its life — the change was visible happening, which
	// makes it read as a graphic replacing another graphic rather than as an
	// explosion leaving something behind.
	// The shared timeline also drives sprite release and the audio cues. Keeping
	// one-reel hits shorter lets the widening feature earn its larger ceremony.
	let beats = $state(blastBeats(5));

	let reels = $state<number[]>([]);
	let clock = $state(-1);
	// what this blast shows on BlastFx's sprite layer, and its rung's look
	let plan = $state<BlastPlan | null>(null);
	let look = $state<BlastLook>(blastLook(1, false));
	let planId = 0;
	// cells the blast leaves standing (the Scatter): no void over them, no shards
	let survivors = $state<Set<string>>(new Set());
	// when each refilled cell's copy lands, by cellKey: its void clears then
	let arrivals = new Map<string, number>();
	const cellKey = (reel: number, row: number) => reel + ':' + row;
	let landTimers: ReturnType<typeof setTimeout>[] = [];
	const clearLandTimers = () => {
		for (const id of landTimers) clearTimeout(id);
		landTimers = [];
	};
	let raf = 0;

	// A cleared blast must not be able to write to the board afterwards.
	//
	// This handler awaits across four phases and only THEN rewrites symbols. If a
	// clear lands in one of those gaps — the round ending, a resume, the next
	// spin's reveal — the promise still wakes up and fills reels on a board that
	// has moved on, stamping the previous spin's fill symbol onto the current one.
	//
	// gen-3 shipped three separate fixes for exactly this shape of bug in its
	// split animation before the cause was understood, so it is guarded here by
	// construction rather than waited for.
	let generation = 0;

	onDestroy(() => {
		generation += 1;
		cancelAnimationFrame(raf);
		clearLandTimers();
	});

	const TOP = 0;
	const HEIGHT = SYMBOL_SIZE * BOARD_DIMENSIONS.y;

	// A neon plasma discharge: fast pressure fronts and real symbol debris,
	// followed by soft illuminated vapour and a controlled result reveal.
	//
	//   CHARGE    the reel dims to night-violet and lightning crawls out of the
	//             bomb across the covered cells, faster as it builds
	//   SHATTER   each symbol GLITCHES APART: it breaks into a grid of glowing
	//             pixels that fly outward and burn out, in the neon colours
	//   PUFF      a pillar of plasma erupts over the reel: white-hot core, pink
	//             and violet sheath, scanlines racing up it
	//   HOLD      the cells under it are opaque night (the swap is made unseen)
	//   DISPERSE  the pillar collapses to a thin line and blinks out like an old
	//             CRT switching off, scan-rings rippling out of the cells
	//
	// The cover is still honest: the void under the pillar is drawn opaque from
	// SHATTER until DISPERSE, exactly as the smoke version did, so a gap in the
	// light can never flash the pre-blast board.
	const VIOLET = 0xb143ec;
	const PINK = 0xff3fd0;
	const CYAN = 0x59e3ff;
	const NIGHT = 0x0c0620;
	const NEONS = [PINK, CYAN, VIOLET, 0xffffff];

	const hash = (a: number, b: number, c: number) => {
		const v = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453;
		return v - Math.floor(v);
	};

	// Each cell breaks into a PIXEL GRID (4 x 4 tiles). Hashed from
	// (reel, row, index), so a cell's pixels are identical on every frame.
	const PIX = 4;
	const pixelCache = new Map<string, { ox: number; oy: number; dir: number; speed: number; lag: number; color: number }[]>();
	const pixelsOf = (reel: number, row: number) => {
		const key = cellKey(reel, row);
		const cached = pixelCache.get(key);
		if (cached) return cached;
		const pixels = Array.from({ length: PIX * PIX }, (_, i) => {
			const gx = i % PIX;
			const gy = Math.floor(i / PIX);
			const r1 = hash(reel + 1, row + 1, i + 1);
			const r2 = hash(reel + 5.3, row + 2.7, i + 9.1);
			// offset from the cell centre, -0.5..0.5 of a cell
			const ox = (gx + 0.5) / PIX - 0.5;
			const oy = (gy + 0.5) / PIX - 0.5;
			return {
				ox,
				oy,
				// out from the centre, with a kick of its own
				dir: Math.atan2(oy, ox) + (r1 - 0.5) * 0.9,
				speed: 0.35 + 0.9 * r2,
				// staggered: the glitch eats the cell in a ragged order
				lag: r1 * 0.35,
				color: NEONS[Math.floor(r2 * NEONS.length) % NEONS.length],
			};
		});
		pixelCache.set(key, pixels);
		return pixels;
	};

	/** a jagged bolt from a to b, re-struck with `strike` */
	const bolt = (
		g: PixiGraphics,
		ax: number,
		ay: number,
		bx: number,
		by: number,
		strike: number,
		seed: number,
		alpha: number,
		outer: number = VIOLET,
	) => {
		if (alpha <= 0.01) return;
		const n = 7;
		const len = Math.hypot(bx - ax, by - ay) || 1;
		const nx = -(by - ay) / len;
		const ny = (bx - ax) / len;
		const pts: number[] = [];
		for (let k = 0; k <= n; k++) {
			const u = k / n;
			const jag = k === 0 || k === n ? 0 : (hash(strike, seed, k) - 0.5) * len * 0.22;
			pts.push(ax + (bx - ax) * u + nx * jag, ay + (by - ay) * u + ny * jag);
		}
		for (const [w, color, al] of [
			[9, outer, 0.3],
			[4, 0xd98bff, 0.65],
			[1.6, 0xffffff, 0.95],
		] as const) {
			g.moveTo(pts[0], pts[1]);
			for (let k = 2; k < pts.length; k += 2) g.lineTo(pts[k], pts[k + 1]);
			g.stroke({ width: w, color, alpha: al * alpha, cap: 'round', join: 'round' });
		}
	};

	// SPARKS OUT OF THE BOMB: streaks of light thrown from the bomb's cell at the
	// bang, fading by the swap. A burst with a source, not a shower.
	const SPARKS_PER_BOMB = 22;
	const sparkCache = new Map<number, { dir: number; speed: number; lag: number; color: number }[]>();
	const sparksOf = (origin: number) => {
		const cached = sparkCache.get(origin);
		if (cached) return cached;
		const sparks = Array.from({ length: SPARKS_PER_BOMB }, (_, i) => ({
			dir: hash(origin + 3.1, i + 7.7, 1) * Math.PI * 2,
			speed: 2.6 + 3.4 * hash(origin + 8.2, i + 2.3, 2),
			lag: 50 * hash(origin + 5.5, i + 9.9, 3),
			color: NEONS[i % NEONS.length],
		}));
		sparkCache.set(origin, sparks);
		return sparks;
	};

	// where the bomb(s) are, captured when the blast starts - by the swap the
	// board no longer has them. In board coordinates, centre of the cell.
	let origins = $state<{ x: number; y: number }[]>([]);
	const findDynamite = (covered: number[]) => {
		const found: { x: number; y: number }[] = [];
		for (let reel = 0; reel < BOARD_DIMENSIONS.x; reel++) {
			const symbols = stateGame.board[reel]?.reelState.symbols;
			if (!symbols) continue;
			for (let row = 1; row <= BOARD_DIMENSIONS.y; row++) {
				if (symbols[row]?.rawSymbol?.name === 'B') {
					found.push({ x: getSymbolX(reel), y: (row - 0.5) * SYMBOL_SIZE });
				}
			}
		}
		// a resumed or replayed blast may no longer show the bomb: discharge from
		// the middle of the first covered reel instead of from nowhere
		if (found.length === 0 && covered.length > 0) {
			found.push({ x: getSymbolX(covered[0]), y: HEIGHT / 2 });
		}
		return found;
	};

	const draw = (g: PixiGraphics) => {
		g.clear();
		if (clock < 0 || reels.length === 0) return;

		const t = clock;
		const { charge, shatter, puff, disperse, PUFF_AT } = phasesAt(t, beats);
		const strike = Math.floor(t / 50);

		// Pressure draws inward before the hit; the fast outward front below
		// then reads as a release of stored energy rather than another glow.
		if (t < CHARGE_MS) {
			const q = Math.max(0, t / CHARGE_MS);
			for (const o of origins) {
				const radius = SYMBOL_SIZE * (1.05 - 0.83 * q * q);
				g.circle(o.x, o.y, radius).stroke({ width: 2 + 2 * q, color: look.sheath, alpha: 0.65 * q });
				for (let i = 0; i < 8; i++) {
					const angle = i * Math.PI / 4 + q * 0.8;
					const inner = radius + SYMBOL_SIZE * 0.08;
					const outer = inner + SYMBOL_SIZE * (0.08 + 0.12 * q);
					g.moveTo(o.x + Math.cos(angle) * inner, o.y + Math.sin(angle) * inner)
						.lineTo(o.x + Math.cos(angle) * outer, o.y + Math.sin(angle) * outer)
						.stroke({ width: 2, color: CYAN, alpha: q * 0.72, cap: 'round' });
				}
			}
		}

		for (const reel of reels) {
			const cx = getSymbolX(reel);
			const left = cx - SYMBOL_SIZE / 2;

			// CHARGE: the reel dims to night-violet, its edges start to glow
			if (charge > 0 && disperse === 0) {
				g.rect(left, TOP, SYMBOL_SIZE, HEIGHT).fill({ color: NIGHT, alpha: 0.45 * charge });
				g.rect(left + 2, TOP + 2, SYMBOL_SIZE - 4, HEIGHT - 4).stroke({
					width: 10,
					color: VIOLET,
					alpha: 0.18 * charge * (1 - puff),
				});
				g.rect(left + 2, TOP + 2, SYMBOL_SIZE - 4, HEIGHT - 4).stroke({
					width: 3,
					color: VIOLET,
					alpha: 0.6 * charge * (1 - puff),
				});
			}

			// the void, opaque from SHATTER until the pillar starts to collapse
			// per cell, so the Scatter — which survives a blast — stays in view.
			// Each refilled cell stays dark until ITS copy lands (BlastFx), then
			// clears in a blink: the new symbols arrive one by one rather than
			// all showing at once as the pillar thins.
			if (shatter > 0) {
				for (let row = 1; row <= BOARD_DIMENSIONS.y; row++) {
					const key = cellKey(reel, row);
					if (survivors.has(key)) continue;
					const lift = arrivals.get(key) ?? phasesAt(0, beats).DISPERSE_AT;
					const cleared = cellRevealAt(t, lift);
					const a = Math.min(1, shatter * 2.4);
					const y = TOP + SYMBOL_SIZE * (row - 1) + SYMBOL_SIZE * cleared;
					if (cleared < 1)
						g.rect(left, y, SYMBOL_SIZE, SYMBOL_SIZE * (1 - cleared)).fill({ color: NIGHT, alpha: a });
					if (cleared > 0 && cleared < 1) {
						// A bright leading edge makes the reveal deliberate; it never
						// uncovers any part of a cell before its copy has landed.
						const edge = Math.sin(Math.PI * cleared);
						g.rect(left + 3, y - 6, SYMBOL_SIZE - 6, 12).fill({ color: look.sheath, alpha: 0.3 * edge });
						g.rect(left + 3, y - 1, SYMBOL_SIZE - 6, 2).fill({ color: 0xffffff, alpha: 0.9 * edge });
					}
				}
			}

			// SHATTER: every cell glitches into flying pixels
			if (shatter > 0 && shatter < 1) {
				const tile = SYMBOL_SIZE / PIX;
				for (let row = 1; row <= BOARD_DIMENSIONS.y; row++) {
					if (survivors.has(cellKey(reel, row))) continue;
					const cy = TOP + SYMBOL_SIZE * (row - 0.5);
					for (const px of pixelsOf(reel, row)) {
						const u = Math.max(0, Math.min(1, (shatter - px.lag) / (1 - px.lag)));
						if (u <= 0) continue;
						const fly = 1 - (1 - u) ** 2;
						const x = cx + px.ox * SYMBOL_SIZE + Math.cos(px.dir) * px.speed * SYMBOL_SIZE * fly;
						const y = cy + px.oy * SYMBOL_SIZE + Math.sin(px.dir) * px.speed * SYMBOL_SIZE * fly;
						// small glitch bits now: the real art's shards are BlastFx's
						const size = tile * 0.32 * (1 - 0.6 * u);
						const alpha = (1 - u) ** 1.3;
						if (alpha <= 0.01) continue;
						g.rect(x - size, y - size, size * 2, size * 2).fill({ color: px.color, alpha: 0.18 * alpha });
						g.rect(x - size / 2, y - size / 2, size, size).fill({ color: px.color, alpha: 0.9 * alpha });
					}
				}
			}

			// PUFF -> HOLD -> DISPERSE: the plasma pillar
			if (puff > 0) {
				// bursts out past the reel, holds, then collapses to a line and
				// shrinks to its middle (game/blastTimeline.ts pillarAt). The glow
				// itself is soft additive light in BlastFx; drawn here is only the
				// crisp hot spine, the scanlines and the lightning.
				const { half, top, h, alpha } = pillarAt(puff, disperse, SYMBOL_SIZE, HEIGHT);
				if (alpha > 0 && h > 0) {
					g.rect(cx - half * 0.12, TOP + top, half * 0.24, h).fill({ color: 0xffffff, alpha: 0.85 * alpha });
					// scanlines racing upward
					if (disperse < 0.55) {
						for (let k = 0; k < 9; k++) {
							const y = TOP + HEIGHT - ((t / 600 + k / 9) % 1) * HEIGHT;
							g.rect(cx - half * 1.4, y, half * 2.8, 2.5).fill({ color: CYAN, alpha: 0.4 * alpha });
						}
					}
					// lightning crawling up the outside of the pillar
					if (disperse < 0.4) {
						for (const side of [-1, 1]) {
							const x = cx + side * half * 1.2;
							bolt(g, x, TOP, x, TOP + HEIGHT, strike, reel * 7 + side, 0.8 * (1 - disperse / 0.4), look.bolt);
						}
					}
				}
				// scan-rings rippling out of each cell as the pillar collapses
				if (disperse > 0 && disperse < 1) {
					for (let row = 1; row <= BOARD_DIMENSIONS.y; row++) {
						const cy = TOP + SYMBOL_SIZE * (row - 0.5);
						const r = SYMBOL_SIZE * (0.15 + 0.5 * disperse);
						g.rect(cx - r, cy - r, r * 2, r * 2).stroke({
							width: 3,
							color: row % 2 ? CYAN : PINK,
							alpha: 0.7 * (1 - disperse) ** 1.5,
						});
					}
				}
			}
		}

		// CHARGE: lightning from each bomb out to the cells it covers, faster
		// and brighter as the charge builds
		if (charge > 0 && shatter === 0) {
			const strikeFast = Math.floor(t / (70 - 35 * charge));
			origins.forEach((o, oi) => {
				let n = 0;
				for (const reel of reels) {
					for (let row = 1; row <= BOARD_DIMENSIONS.y; row++) {
						if (n > 7 + 3 * look.level) return;
						if (hash(strikeFast, reel * 10 + row, oi) > 0.25 + 0.5 * charge) continue;
						const tx = getSymbolX(reel) + (hash(strikeFast, row, 2) - 0.5) * SYMBOL_SIZE * 0.6;
						const ty = TOP + SYMBOL_SIZE * (row - 0.5) + (hash(strikeFast, reel, 3) - 0.5) * SYMBOL_SIZE * 0.6;
						bolt(g, o.x, o.y, tx, ty, strikeFast, reel * 31 + row + oi, 0.35 + 0.65 * charge, look.bolt);
						n++;
					}
				}
			});
			// the bomb reaching for the symbol it will spread: one steady bolt to
			// each source, re-struck fast
			for (const [oi, o] of origins.entries())
				for (const [si, src] of (plan?.sources ?? []).entries())
					if (Math.hypot(src.x - o.x, src.y - o.y) > SYMBOL_SIZE * 0.5)
						bolt(g, o.x, o.y, src.x, src.y, strikeFast, 900 + oi * 7 + si, 0.5 + 0.5 * charge, look.bolt);
			// the bomb's own cell swells with light
			for (const o of origins) {
				const r = SYMBOL_SIZE * (0.35 + 0.25 * charge);
				g.circle(o.x, o.y, r * 1.6).fill({ color: VIOLET, alpha: 0.25 * charge });
				g.circle(o.x, o.y, r).fill({ color: 0xe6c8ff, alpha: 0.35 * charge });
				for (let band = 0; band < 2; band++) {
					const pull = Math.min(1, Math.max(0, (charge - band * 0.15) / 0.85));
					const radius = SYMBOL_SIZE * (1.3 - 1.02 * pull ** 2);
					g.ellipse(o.x, o.y, radius, radius * 0.8).stroke({
						width: 1.3 + 1.8 * pull,
						color: band ? look.core : look.sheath,
						alpha: Math.sin(Math.PI * pull) * (band ? 0.45 : 0.7),
					});
				}
			}
		}

		// The compression front holds for a few frames before release. Three
		// staggered fronts separate the initial crack, the pressure wave and the
		// softer air ring. The full-board hit also lifts the whole stage briefly.
		const hitAge = t - CHARGE_MS;
		const hit = impactAt(hitAge, look.hitStop);
		if (hitAge >= 0 && hitAge < 760) {
			if (reels.length === BOARD_DIMENSIONS.x && hit.flash > 0)
				g.rect(0, TOP, SYMBOL_SIZE * BOARD_DIMENSIONS.x, HEIGHT).fill({ color: look.core, alpha: 0.09 * hit.flash });
			for (const [oi, o] of origins.entries()) {
				if (hit.flash > 0) {
					g.ellipse(o.x, o.y, SYMBOL_SIZE * (0.34 + 0.4 * hit.expand), SYMBOL_SIZE * (0.24 + 0.3 * hit.expand))
						.fill({ color: 0xffffff, alpha: 0.92 * hit.flash });
					g.rect(o.x - SYMBOL_SIZE * 1.3, o.y - 2, SYMBOL_SIZE * 2.6, 4)
						.fill({ color: look.core, alpha: 0.85 * hit.flash });
				}
				for (let layer = 0; layer < 3; layer++) {
					const ringAge = hitAge - layer * (look.level >= 4 ? 66 : 48);
					const ring = impactAt(ringAge, look.hitStop * (layer === 0 ? 1 : 0.35));
					if (ringAge < 0 || ring.shock < 0.005) continue;
					const r = SYMBOL_SIZE * (0.22 + (2.1 - layer * 0.24) * look.power * ring.expand);
					const color = layer === 1 ? look.sheath : look.outer;
					// A stable broken contour has more force than a perfect vector circle.
					for (const [width, alpha] of [[12 - layer * 2, 0.24], [2.5 - layer * 0.4, 0.78]]) {
						for (let k = 0; k <= 32; k++) {
							const a = (k % 32) / 32 * Math.PI * 2;
							const jag = 0.95 + 0.1 * hash(oi + 1, k % 32, layer + 11);
							const x = o.x + Math.cos(a) * r * jag;
							const y = o.y + Math.sin(a) * r * jag * (0.78 + layer * 0.08);
							if (k === 0) g.moveTo(x, y); else g.lineTo(x, y);
						}
						g.stroke({ width, color: width < 3 ? look.core : color, alpha: alpha * ring.shock, join: 'round' });
					}
				}
			}
		}

		// SPARKS from the bomb, from the bang until the swap
		const SWAP_AT = PUFF_AT + beats.puff;
		const FADE_MS = 200;
		if (t >= CHARGE_MS && t < SWAP_AT + FADE_MS) {
			const fadeOut = t <= SWAP_AT ? 1 : 1 - (t - SWAP_AT) / FADE_MS;
			origins.forEach((o, oi) => {
				for (const e of sparksOf(oi)) {
					const tau = (t - CHARGE_MS - e.lag) / 1000;
					if (tau <= 0) continue;
					const d = (e.speed * SYMBOL_SIZE * look.power * (1 - Math.exp(-tau * 3))) / 3;
					const x = o.x + Math.cos(e.dir) * d;
					const y = o.y + Math.sin(e.dir) * d;
					const tail = SYMBOL_SIZE * 0.25 * look.power * Math.exp(-tau * 4);
					g.moveTo(x - Math.cos(e.dir) * tail, y - Math.sin(e.dir) * tail)
						.lineTo(x, y)
						.stroke({ width: 3, color: e.color, alpha: 0.9 * fadeOut * Math.exp(-tau * 1.5), cap: 'round' });
				}
			});
		}
	};

	/**
	 * What BlastFx draws for this blast: the cells that break (their art), the
	 * cells holding the fill (the source each copy flies out of) and, per
	 * refilled cell, when its copy lands. Read off the board BEFORE the swap.
	 *
	 * The source: the bomb picks the best symbol on its OWN reel, so the copy
	 * comes from a cell on a bomb's reel holding the fill; failing that (a
	 * resumed blast), any covered cell holding it; failing that, it drops in
	 * from above the reel.
	 */
	const artOf = (name: SymbolName) => {
		const info = getSymbolInfo({ rawSymbol: { name } as never, state: 'static' });
		return { key: info.assetKey, size: SYMBOL_SIZE * info.sizeRatios.height };
	};
	const buildPlan = (covered: number[], fills: SymbolName[]): BlastPlan => {
		const at = (reel: number, row: number) => ({ x: getSymbolX(reel), y: TOP + SYMBOL_SIZE * (row - 0.5) });
		const nameAt = (reel: number, row: number) => stateGame.board[reel]?.reelState.symbols[row]?.rawSymbol?.name;
		const bombReels: number[] = [];
		const keep = new Set<string>();
		const shardCells: BlastPlan['shardCells'] = [];
		for (let reel = 0; reel < BOARD_DIMENSIONS.x; reel++)
			for (let row = 1; row <= BOARD_DIMENSIONS.y; row++)
				if (nameAt(reel, row) === 'B' && !bombReels.includes(reel)) bombReels.push(reel);
		for (const reel of covered)
			for (let row = 1; row <= BOARD_DIMENSIONS.y; row++) {
				const name = nameAt(reel, row);
				if (!name) continue;
				if (name === 'S') {
					keep.add(cellKey(reel, row));
					continue;
				}
				shardCells.push({ ...at(reel, row), ...artOf(name as SymbolName) });
			}
		survivors = keep;
		arrivals = new Map();
		const sourceOf = (fill: SymbolName) => {
			for (const pool of [bombReels, covered])
				for (const reel of pool)
					for (let row = 1; row <= BOARD_DIMENSIONS.y; row++) if (nameAt(reel, row) === fill) return at(reel, row);
			return null;
		};
		const sources: BlastPlan['sources'] = [];
		const copies: BlastPlan['copies'] = [];
		const reelDone: Record<number, number> = {};
		const { DISPERSE_AT } = phasesAt(0, beats);
		covered.forEach((reel, order) => {
			const fill = fills[order];
			if (!fill) return;
			const src = sourceOf(fill);
			const art = artOf(fill);
			if (src && !sources.some((s) => s.x === src.x && s.y === src.y)) sources.push({ ...src, ...art });
			for (let row = 1; row <= BOARD_DIMENSIONS.y; row++) {
				if (keep.has(cellKey(reel, row))) continue;
				const to = at(reel, row);
				const arriveAt = copyArriveAt(DISPERSE_AT, beats.disperse, order, row);
				copies.push({ from: src ?? { x: to.x, y: TOP - SYMBOL_SIZE * 0.8 }, to, ...art, arriveAt, reel, row });
				arrivals.set(cellKey(reel, row), arriveAt);
				reelDone[reel] = Math.max(reelDone[reel] ?? 0, arriveAt + COLUMN_FLASH_DELAY_MS);
			}
		});
		return { id: ++planId, look, reels: covered, origins, shardCells, sources, copies, reelDone };
	};

	/** Rewrite the covered cells. This is what actually applies the blast. */
	const fillReels = (covered: number[], fills: SymbolName[]) => {
		for (const [index, reel] of covered.entries()) {
			const symbol = fills[index];
			if (!symbol) continue;
			const symbols = stateGame.board[reel]?.reelState.symbols;
			if (!symbols) continue;
			for (let row = 1; row <= BOARD_DIMENSIONS.y; row++) {
				const cell = symbols[row];
				// The scatter survives a blast in the maths, so it has to survive it
				// here too — writing over it would show the player a board the round
				// was not scored on.
				if (!cell || cell.rawSymbol?.name === 'S') continue;
				cell.rawSymbol = { ...cell.rawSymbol, name: symbol };
			}
		}
	};

	const runClock = (until: number) => {
		cancelAnimationFrame(raf);
		const t0 = performance.now();
		const step = (now: number) => {
			clock = now - t0;
			if (clock < until) raf = requestAnimationFrame(step);
			else plan = null;
		};
		raf = requestAnimationFrame(step);
	};

	context.eventEmitter.subscribeOnMount({
		reelBlast: async ({ reels: covered, symbols, full: isFull, level }) => {
			const mine = ++generation;
			reels = covered;
			origins = findDynamite(covered);
			// sized before the clock starts, because draw() reads these
			beats = blastBeats(covered.length);
			look = blastLook(level, isFull);
			clearLandTimers();
			const built = buildPlan(covered, symbols);
			plan = built;
			clock = 0;
			const finishAt = blastEndAt(beats, Object.values(built.reelDone));
			runClock(finishAt);
			// THE REFILL LANDS. Each refilled cell plays its own landing
			// (Symbol -> SymbolSprite's landMotion) the moment its copy arrives, so
			// the new symbols slam in one after another instead of simply being
			// there when the light goes. Board state, so guarded like the fill.
			for (const c of built.copies) {
				landTimers.push(
					setTimeout(() => {
						if (mine !== generation) return;
						const cell = stateGame.board[c.reel]?.reelState.symbols[c.row];
						if (cell && cell.rawSymbol?.name !== 'S') cell.symbolState = 'land' as typeof cell.symbolState;
					}, c.arriveAt),
				);
			}
			// Mark the completion of each column, not every cell: the visual
			// copies already arrive in a cascade, while a note per cell would turn
			// the reveal into a noisy trill. This follows the same reelDone clock as
			// BlastFx's column flash.
			const finished = Object.entries(built.reelDone).sort((a, b) => a[1] - b[1]);
			finished.forEach(([, at], order) => {
				landTimers.push(setTimeout(() => {
					if (mine === generation)
						context.eventEmitter.broadcast({ type: 'soundBlastColumn', order, total: finished.length });
				}, at));
			});

			// The fuse burns for exactly the CHARGE beat, so it runs out on the bang.
			context.eventEmitter.broadcast({ type: 'soundBlastFuse' });
			await waitForTimeout(CHARGE_MS);
			// A blast cancelled mid-fuse must not still go bang.
			if (mine !== generation) return;

			// THE BANG LANDS WHERE THE CRACKS GIVE WAY - the first frame of
			// SHATTER, when the crazed symbols burst and the pieces start to fly -
			// and the fuse, which burns for exactly CHARGE_MS, runs out on it.
			// The separate smoke cue belongs to the expanding pillar below;
			// moving the impact sound there would leave the fracture silent.
			context.eventEmitter.broadcast({ type: 'soundBlastDetonate', full: isFull, width: covered.length });
			// the housing takes the bang, harder up the ladder
			context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: look.impact });
			context.eventEmitter.broadcast({ type: 'soundBlastShatter' });
			await waitForTimeout(beats.shatter);
			if (mine !== generation) return;

			// the cloud bursting out: the air the explosion pushed
			context.eventEmitter.broadcast({ type: 'soundBlastSmoke' });

			// The cloud is opening. Wait for it to close over the reel before
			// touching the board.
			await waitForTimeout(beats.puff);
			if (mine !== generation) return;

			// Fully hidden. Swap here and the player never sees it happen.
			fillReels(covered, symbols);
			await waitForTimeout(beats.hold);
			if (mine !== generation) return;

			// The cloud starts thinning here and the swapped symbols come out from
			// behind it. The rising marimba tells the ear the board just improved,
			// ahead of the win evaluation that confirms it.
			context.eventEmitter.broadcast({ type: 'soundBlastReveal' });
			await waitForTimeout(beats.disperse);
			if (mine !== generation) return;

			// Let every column frame finish, then hold the readable result before
			// the next win evaluation can animate those symbols.
			await waitForTimeout(finishAt - beats.total);
			if (mine !== generation) return;
			context.eventEmitter.broadcast({ type: 'soundBlastEnd' });
		},
		reelBlastClear: () => {
			generation += 1;
			cancelAnimationFrame(raf);
			clearLandTimers();
			reels = [];
			clock = -1;
			plan = null;
			context.eventEmitter.broadcast({ type: 'soundBlastEnd' });
		},
	});
</script>

<BoardContainer>
	<!-- the covered tiles swelling during CHARGE, under the darkening and cracks -->
	<BlastSwell />
	<Container>
		<Graphics {draw} />
		<!-- the sprites over it: real-art shards, the soft pillar, the source
		     lock and the copies flying into the refilled cells -->
		<BlastFx {plan} {clock} {beats} />
	</Container>
</BoardContainer>
