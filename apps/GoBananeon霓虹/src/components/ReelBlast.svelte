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
	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';
	import { getSymbolX } from '../game/utils';
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
	// These are the beats AT FULL SIZE. Everything after the fuse is then scaled
	// to how many reels actually went up — see AFTERMATH_SCALE.
	// BlastSwell's tiles swell for exactly this long (meshWin/swell.ts SWELL_MS)
	const CHARGE_MS = 380;
	const SHATTER_MS = 340;
	const PUFF_MS = 240;
	const HOLD_MS = 200;
	const DISPERSE_MS = 700;
	const SETTLE_MS = 420;

	// A full board used to be held 700ms longer here and was otherwise the same
	// blast. It now gets its own beats either side instead — the chain of fuses
	// before and the stamp after — in FullBoard.svelte, so no hold is needed here.

	// THE CEREMONY IS SIZED TO THE BLAST. Indexed by reels covered, 1-5.
	//
	// Every blast used to take the same 2.28s whatever it did, and measured on the
	// published books that is the wrong shape twice over:
	//
	//   66% of base blasts and 50% of bonus100's cover ONE reel — the smallest
	//   thing the feature can do was getting the payoff's full ceremony;
	//
	//   54% of a feature's blasts are repeats within the same round (#2, #3, #4),
	//   so a four-blast feature spent ~9s on the identical animation.
	//
	// The feature's whole escalation is the ladder widening 1 -> 5 reels, and at
	// one fixed length that escalation was invisible: the one-reel opener and the
	// five-reel payoff took exactly as long. Now a full board runs nearly twice
	// the length of a single reel, which is the difference the player is chasing.
	//
	// THE FUSE IS NOT SCALED. It is the same fuse every time, it is the
	// anticipation rather than the event, and fuse_sizzle.wav is exactly 380ms so
	// that it runs out ON the bang — scaling CHARGE would either cut the cue off
	// or leave a gap of silence before the explosion.
	const AFTERMATH_SCALE = [0, 0.62, 0.75, 0.88, 1, 1];

	// TURBO DOES NOT SHORTEN THIS. There is no turbo branch anywhere below — the
	// waits are absolute, so every number here applies at both speeds.
	//
	// Every other part of a turbo spin is the player skipping something they have
	// already understood. This is the one moment that is not routine, and it is
	// the moment the game is named after — a detonation the player cannot see
	// happen is a detonation that did not happen. Turbo still skips the pre-spin,
	// the win-line volley and the reel wind-up, so a turbo round is still much
	// faster; it just does not take this away.

	// The beats this blast is actually running, set from its width before the
	// clock starts. draw() reads these, not the constants above.
	let beats = $state({
		shatter: SHATTER_MS,
		puff: PUFF_MS,
		hold: HOLD_MS,
		disperse: DISPERSE_MS,
		settle: SETTLE_MS,
		total: CHARGE_MS + SHATTER_MS + PUFF_MS + HOLD_MS + DISPERSE_MS,
	});

	const beatsFor = (width: number) => {
		const k = AFTERMATH_SCALE[Math.min(Math.max(1, width), 5)];
		// HOLD has a floor: it is the window the symbols are swapped in, unseen,
		// and it must stay long enough to cover a dropped frame or two.
		const hold = Math.max(120, Math.round(HOLD_MS * k));
		const shatter = Math.round(SHATTER_MS * k);
		const puff = Math.round(PUFF_MS * k);
		const disperse = Math.round(DISPERSE_MS * k);
		return {
			shatter,
			puff,
			hold,
			disperse,
			settle: Math.round(SETTLE_MS * k),
			total: CHARGE_MS + shatter + puff + hold + disperse,
		};
	};

	let reels = $state<number[]>([]);
	let clock = $state(-1);
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

	onDestroy(() => cancelAnimationFrame(raf));

	const TOP = 0;
	const HEIGHT = SYMBOL_SIZE * BOARD_DIMENSIONS.y;

	// THE PULSE BOMB'S DISCHARGE, IN NEON. (GoBoomana drew a painted smoke
	// cloud and chips of rock here; this game's bomb is a plasma orb, so the
	// blast is light and electricity, not smoke and stone.)
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
	const pixelsOf = (reel: number, row: number) =>
		Array.from({ length: PIX * PIX }, (_, i) => {
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
			[9, VIOLET, 0.3],
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
	const sparksOf = (origin: number) =>
		Array.from({ length: SPARKS_PER_BOMB }, (_, i) => ({
			dir: hash(origin + 3.1, i + 7.7, 1) * Math.PI * 2,
			speed: 2.6 + 3.4 * hash(origin + 8.2, i + 2.3, 2),
			lag: 50 * hash(origin + 5.5, i + 9.9, 3),
			color: NEONS[i % NEONS.length],
		}));

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
		const charge = Math.min(1, t / CHARGE_MS);
		const shatter = t < CHARGE_MS ? 0 : Math.min(1, (t - CHARGE_MS) / beats.shatter);
		const PUFF_AT = CHARGE_MS + beats.shatter;
		const puff = t < PUFF_AT ? 0 : Math.min(1, (t - PUFF_AT) / beats.puff);
		const DISPERSE_AT = PUFF_AT + beats.puff + beats.hold;
		const disperse = t < DISPERSE_AT ? 0 : Math.min(1, (t - DISPERSE_AT) / beats.disperse);
		const strike = Math.floor(t / 50);

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
			if (shatter > 0 && disperse === 0) {
				g.rect(left, TOP, SYMBOL_SIZE, HEIGHT).fill({ color: NIGHT, alpha: Math.min(1, shatter * 1.6) });
			}

			// SHATTER: every cell glitches into flying pixels
			if (shatter > 0 && shatter < 1) {
				const tile = SYMBOL_SIZE / PIX;
				for (let row = 1; row <= BOARD_DIMENSIONS.y; row++) {
					const cy = TOP + SYMBOL_SIZE * (row - 0.5);
					for (const px of pixelsOf(reel, row)) {
						const u = Math.max(0, Math.min(1, (shatter - px.lag) / (1 - px.lag)));
						if (u <= 0) continue;
						const fly = 1 - (1 - u) ** 2;
						const x = cx + px.ox * SYMBOL_SIZE + Math.cos(px.dir) * px.speed * SYMBOL_SIZE * fly;
						const y = cy + px.oy * SYMBOL_SIZE + Math.sin(px.dir) * px.speed * SYMBOL_SIZE * fly;
						const size = tile * (0.92 - 0.6 * u);
						const alpha = (1 - u) ** 1.3;
						if (alpha <= 0.01) continue;
						g.rect(x - size, y - size, size * 2, size * 2).fill({ color: px.color, alpha: 0.18 * alpha });
						g.rect(x - size / 2, y - size / 2, size, size).fill({ color: px.color, alpha: 0.9 * alpha });
					}
				}
			}

			// PUFF -> HOLD -> DISPERSE: the plasma pillar
			if (puff > 0) {
				// bursts out past the reel, holds, then collapses to a line
				const open = 1 - (1 - puff) ** 3;
				const collapse =
					disperse < 0.55 ? 1 - (disperse / 0.55) ** 2 * 0.96 : 0.04 * (1 - (disperse - 0.55) / 0.45);
				const half = (SYMBOL_SIZE / 2) * (0.35 + 0.85 * open) * collapse;
				// the CRT line also shrinks to its middle at the very end
				const vEnd = disperse < 0.55 ? 1 : 1 - (disperse - 0.55) / 0.45;
				const top = TOP + (HEIGHT / 2) * (1 - vEnd);
				const h = HEIGHT * vEnd;
				const alpha = disperse < 0.85 ? 1 : 1 - (disperse - 0.85) / 0.15;
				if (alpha > 0 && h > 0) {
					// sheath, sheath, core, hot spine
					g.rect(cx - half * 1.5, top, half * 3, h).fill({ color: VIOLET, alpha: 0.28 * alpha });
					g.rect(cx - half, top, half * 2, h).fill({ color: PINK, alpha: 0.55 * alpha });
					g.rect(cx - half * 0.55, top, half * 1.1, h).fill({ color: 0xf2d8ff, alpha: 0.85 * alpha });
					g.rect(cx - half * 0.18, top, half * 0.36, h).fill({ color: 0xffffff, alpha });
					// scanlines racing upward
					if (disperse < 0.55) {
						for (let k = 0; k < 9; k++) {
							const y = TOP + HEIGHT - ((t / 600 + k / 9) % 1) * HEIGHT;
							g.rect(cx - half * 1.4, y, half * 2.8, 2.5).fill({ color: CYAN, alpha: 0.5 * alpha });
						}
					}
					// lightning crawling up the outside of the pillar
					if (disperse < 0.4) {
						for (const side of [-1, 1]) {
							const x = cx + side * half * 1.2;
							bolt(g, x, TOP, x, TOP + HEIGHT, strike, reel * 7 + side, 0.8 * (1 - disperse / 0.4));
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
						if (n > 10) return;
						if (hash(strikeFast, reel * 10 + row, oi) > 0.25 + 0.5 * charge) continue;
						const tx = getSymbolX(reel) + (hash(strikeFast, row, 2) - 0.5) * SYMBOL_SIZE * 0.6;
						const ty = TOP + SYMBOL_SIZE * (row - 0.5) + (hash(strikeFast, reel, 3) - 0.5) * SYMBOL_SIZE * 0.6;
						bolt(g, o.x, o.y, tx, ty, strikeFast, reel * 31 + row + oi, 0.35 + 0.65 * charge);
						n++;
					}
				}
			});
			// the bomb's own cell swells with light
			for (const o of origins) {
				const r = SYMBOL_SIZE * (0.35 + 0.25 * charge);
				g.circle(o.x, o.y, r * 1.6).fill({ color: VIOLET, alpha: 0.25 * charge });
				g.circle(o.x, o.y, r).fill({ color: 0xe6c8ff, alpha: 0.35 * charge });
			}
		}

		// the bang: a white-violet ring out of each bomb
		if (shatter > 0 && shatter < 1) {
			for (const o of origins) {
				const r = SYMBOL_SIZE * (0.3 + 2.2 * (1 - (1 - shatter) ** 3));
				const a = (1 - shatter) ** 1.5;
				g.circle(o.x, o.y, r).stroke({ width: 14, color: VIOLET, alpha: 0.3 * a });
				g.circle(o.x, o.y, r).stroke({ width: 4, color: 0xffffff, alpha: 0.9 * a });
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
					const d = (e.speed * SYMBOL_SIZE * (1 - Math.exp(-tau * 3))) / 3;
					const x = o.x + Math.cos(e.dir) * d;
					const y = o.y + Math.sin(e.dir) * d;
					const tail = SYMBOL_SIZE * 0.25 * Math.exp(-tau * 4);
					g.moveTo(x - Math.cos(e.dir) * tail, y - Math.sin(e.dir) * tail)
						.lineTo(x, y)
						.stroke({ width: 3, color: e.color, alpha: 0.9 * fadeOut * Math.exp(-tau * 1.5), cap: 'round' });
				}
			});
		}
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

	const runClock = () => {
		cancelAnimationFrame(raf);
		const t0 = performance.now();
		const step = (now: number) => {
			clock = now - t0;
			if (clock < beats.total) raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
	};

	context.eventEmitter.subscribeOnMount({
		reelBlast: async ({ reels: covered, symbols, full: isFull }) => {
			const mine = ++generation;
			reels = covered;
			origins = findDynamite(covered);
			// sized before the clock starts, because draw() reads these
			beats = beatsFor(covered.length);
			clock = 0;
			runClock();

			// The fuse burns for exactly the CHARGE beat, so it runs out on the bang.
			context.eventEmitter.broadcast({ type: 'soundBlastFuse' });
			await waitForTimeout(CHARGE_MS);
			// A blast cancelled mid-fuse must not still go bang.
			if (mine !== generation) return;

			// THE BANG LANDS WHERE THE CRACKS GIVE WAY - the first frame of
			// SHATTER, when the crazed symbols burst and the pieces start to fly -
			// and the fuse, which burns for exactly CHARGE_MS, runs out on it.
			//
			// This has moved twice, and both moves are worth keeping in mind before
			// moving it a third time. It began here, and the smoke then arrived 340ms
			// later in silence, which read as the sound being early. So it was moved
			// to the cloud - and then the stone broke silently for 340ms, which read
			// as the sound being late. The fix for both was a second sound, not a
			// different time: the bang belongs to the breakage, and the cloud now has
			// a soft puff of its own below.
			context.eventEmitter.broadcast({ type: 'soundBlastDetonate', full: isFull });
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

			// The smoke is gone and the new board is standing there. Hold it before
			// the win evaluation starts moving things again — this wait draws
			// nothing, which is the point of it.
			await waitForTimeout(beats.settle);
			if (mine !== generation) return;
		},
		reelBlastClear: () => {
			generation += 1;
			cancelAnimationFrame(raf);
			reels = [];
			clock = -1;
		},
	});
</script>

<BoardContainer>
	<!-- the covered tiles swelling during CHARGE, under the darkening and cracks -->
	<BlastSwell />
	<Container>
		<Graphics {draw} />
	</Container>
</BoardContainer>
