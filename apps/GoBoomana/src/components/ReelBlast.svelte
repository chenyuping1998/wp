<script lang="ts" module>
	export type EmitterEventReelBlast =
		| {
				type: 'reelBlast';
				reels: number[];
				symbol: SymbolName;
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
	//   CHARGE    the covered reels darken and craze with cracks under the fuse
	//   SHATTER   the bang lands: each symbol breaks apart and the shards fly out
	//   PUFF      a comic smoke cloud bursts out and covers the reel completely
	//   HOLD      fully hidden — the symbols are swapped in here, unseen
	//   DISPERSE  the cloud billows out and thins, revealing what it left behind
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
	const CHARGE_MS = 380;
	const SHATTER_MS = 340;
	const PUFF_MS = 240;
	const HOLD_MS = 200;
	const DISPERSE_MS = 700;
	const SETTLE_MS = 420;
	const TOTAL_MS = CHARGE_MS + SHATTER_MS + PUFF_MS + HOLD_MS + DISPERSE_MS;

	// A full board is what the whole feature climbs towards, so it is held longer.
	// Not a different animation — the same one, given room.
	const FULL_BOARD_HOLD_MS = 700;

	// TURBO DOES NOT SHORTEN THIS. There is no turbo branch anywhere below — the
	// waits are absolute, so every number here applies at both speeds.
	//
	// Every other part of a turbo spin is the player skipping something they have
	// already understood. This is the one moment that is not routine, and it is
	// the moment the game is named after — a detonation the player cannot see
	// happen is a detonation that did not happen. Turbo still skips the pre-spin,
	// the win-line volley and the reel wind-up, so a turbo round is still much
	// faster; it just does not take this away.

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

	// Smoke is drawn as overlapping circles, which is what a comic explosion is.
	// The cluster is generated from the reel index rather than from Math.random,
	// so a reel's cloud is the same shape every frame of one blast — a cloud that
	// re-rolls its lumps each frame boils instead of billowing.
	const PUFFS_PER_REEL = 9;
	const puffsOf = (reel: number) =>
		Array.from({ length: PUFFS_PER_REEL }, (_, i) => {
			const seed = Math.sin(reel * 12.9898 + i * 78.233) * 43758.5453;
			const rand = seed - Math.floor(seed);
			const seed2 = Math.sin(reel * 39.3468 + i * 11.135) * 24634.6345;
			const rand2 = seed2 - Math.floor(seed2);
			return {
				// spread down the column, with the ends pulled slightly inside so the
				// cloud has a silhouette rather than square corners
				y: TOP + HEIGHT * (0.06 + 0.88 * (i / (PUFFS_PER_REEL - 1))),
				x: (rand - 0.5) * SYMBOL_SIZE * 0.5,
				// At least half a cell wide, so a single lump already spans the column
				// and the cluster cannot leave a gap down the edges for the old symbol
				// to show through — the cover has to be total or the swap is visible.
				r: SYMBOL_SIZE * (0.52 + 0.20 * rand2),
				// each lump grows at its own rate, so the cloud does not inflate as
				// one object
				lag: rand2 * 0.25,
			};
		});

	// Each cell breaks into wedges radiating from its centre. Same trick as the
	// smoke: the shape is hashed from (reel, row, index) rather than rolled from
	// Math.random, so one cell's debris is identical on every frame of a blast —
	// re-rolling per frame would make the pieces jitter in place instead of fly.
	const SHARDS_PER_CELL = 7;
	const hash = (a: number, b: number, c: number) => {
		const v = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453;
		return v - Math.floor(v);
	};
	const shardsOf = (reel: number, row: number) =>
		Array.from({ length: SHARDS_PER_CELL }, (_, i) => {
			const r1 = hash(reel + 1, row + 1, i + 1);
			const r2 = hash(reel + 5.3, row + 2.7, i + 9.1);
			const r3 = hash(reel + 11.7, row + 4.1, i + 21.3);
			// wedges tile the full circle, so the pieces account for the whole cell
			// rather than leaving it looking nibbled at the edges
			const a0 = (i / SHARDS_PER_CELL) * Math.PI * 2;
			const a1 = ((i + 1) / SHARDS_PER_CELL) * Math.PI * 2;
			return {
				// the direction this piece leaves in — the wedge's own bearing, so
				// pieces separate outward instead of crossing through each other
				dir: (a0 + a1) / 2,
				a0,
				a1,
				// an irregular radius per wedge: stone does not break into a fan of
				// identical slices
				rIn: SYMBOL_SIZE * (0.13 + 0.10 * r1),
				rOut: SYMBOL_SIZE * (0.34 + 0.14 * r2),
				speed: 0.55 + 0.65 * r2,
				spin: (r3 - 0.5) * 3.4,
				// heavier pieces fall further within the same beat
				weight: 0.5 + r1,
			};
		});

	const draw = (g: PixiGraphics) => {
		g.clear();
		if (clock < 0 || reels.length === 0) return;

		const t = clock;
		const charge = Math.min(1, t / CHARGE_MS);
		const shatter = t < CHARGE_MS ? 0 : Math.min(1, (t - CHARGE_MS) / SHATTER_MS);
		const PUFF_AT = CHARGE_MS + SHATTER_MS;
		const puff = t < PUFF_AT ? 0 : Math.min(1, (t - PUFF_AT) / PUFF_MS);
		const DISPERSE_AT = PUFF_AT + PUFF_MS + HOLD_MS;
		const disperse = t < DISPERSE_AT ? 0 : Math.min(1, (t - DISPERSE_AT) / DISPERSE_MS);

		for (const reel of reels) {
			const cx = getSymbolX(reel);
			const left = cx - SYMBOL_SIZE / 2;

			// The charge reads as pressure building in the rock: the column darkens
			// rather than brightening, so the cloud has somewhere to come from.
			if (charge > 0 && disperse === 0) {
				g.rect(left, TOP, SYMBOL_SIZE, HEIGHT);
				g.fill({ color: 0x140d05, alpha: 0.5 * charge });
			}

			// The void the symbols leave. It opens across SHATTER so they appear to
			// crumble away rather than being switched off, and it is then HELD until
			// the cloud starts to thin. Holding it is what makes the swap safe: the
			// old symbols are covered by an opaque cell, not merely by smoke that
			// happens to be dense enough, so a gap between two lumps can never flash
			// the pre-blast board back at the player.
			if (shatter > 0 && disperse === 0) {
				for (let row = 1; row <= BOARD_DIMENSIONS.y; row++) {
					const cy = TOP + SYMBOL_SIZE * (row - 0.5);
					g.rect(left, cy - SYMBOL_SIZE / 2, SYMBOL_SIZE, SYMBOL_SIZE);
					g.fill({ color: 0x0d0805, alpha: Math.min(1, shatter * 1.6) });
				}
			}

			// CRACKS and FLYING SHARDS. Both stop once the smoke has closed over the
			// column — there is nothing to see under an opaque cloud, and drawing it
			// anyway costs a polygon per shard per frame for the rest of the beat.
			if (charge > 0 && puff < 1) {
				for (let row = 1; row <= BOARD_DIMENSIONS.y; row++) {
					const cy = TOP + SYMBOL_SIZE * (row - 0.5);
					const pieces = shardsOf(reel, row);

					// Cracks craze outward across the still-intact symbol during CHARGE.
					// They are drawn along the seams the shards will break along, so the
					// break reads as the cracks giving way rather than as a new event.
					if (shatter < 1) {
						const reach = charge * SYMBOL_SIZE * 0.46;
						for (const sh of pieces) {
							const kink = sh.spin * 0.06;
							g.moveTo(cx, cy);
							g.lineTo(
								cx + Math.cos(sh.a0 + kink) * reach * 0.55,
								cy + Math.sin(sh.a0 + kink) * reach * 0.55,
							);
							g.lineTo(cx + Math.cos(sh.a0) * reach, cy + Math.sin(sh.a0) * reach);
							g.stroke({
								width: 2.2,
								color: 0xffd8a2,
								alpha: 0.75 * charge * (1 - shatter),
							});
						}
					}

					if (shatter <= 0) continue;

					// …and the pieces of it, thrown outward and tumbling. Eased so they
					// leave fast and slow as they go, which is what debris does.
					const flight = 1 - (1 - shatter) ** 2;
					for (const sh of pieces) {
						const dist = flight * sh.speed * SYMBOL_SIZE * 0.85;
						const px = cx + Math.cos(sh.dir) * dist;
						// gravity is quadratic in the beat, so the arc droops late
						const py = cy + Math.sin(sh.dir) * dist + sh.weight * flight ** 2 * SYMBOL_SIZE * 0.5;
						const rot = sh.spin * flight;
						const alpha = (1 - shatter) ** 1.5;
						if (alpha <= 0.01) continue;
						// a wedge, rotated about its own centre as it flies
						const pts: number[] = [];
						for (const [ang, rad] of [
							[sh.a0, sh.rIn],
							[sh.a0, sh.rOut],
							[sh.a1, sh.rOut],
							[sh.a1, sh.rIn],
						] as const) {
							pts.push(px + Math.cos(ang + rot) * rad, py + Math.sin(ang + rot) * rad);
						}
						g.poly(pts);
						g.fill({ color: 0x5a4c3c, alpha });
						// a lit top edge, so a flat wedge reads as a chip of stone
						g.moveTo(pts[2], pts[3]);
						g.lineTo(pts[4], pts[5]);
						g.stroke({ width: 1.6, color: 0xc9a978, alpha: alpha * 0.9 });
					}
				}
			}

			if (puff <= 0) continue;

			for (const p of puffsOf(reel)) {
				// grow in, then keep growing as it thins — smoke does not shrink away,
				// it spreads out until it is gone
				const grow = Math.min(1, Math.max(0, (puff - p.lag) / (1 - p.lag)));
				const scale = grow * (1 + 0.45 * disperse);
				if (scale <= 0) continue;
				// drift up and outward as it clears
				const dx = p.x + (p.x >= 0 ? 1 : -1) * disperse * SYMBOL_SIZE * 0.22;
				const dy = p.y - disperse * SYMBOL_SIZE * 0.35;
				const alpha = (1 - disperse) ** 1.4;
				g.circle(cx + dx, dy, p.r * scale);
				g.fill({ color: 0x6b6055, alpha: alpha });
				// a lighter core on the upper-left of each lump, which is what makes a
				// flat circle read as a volume
				g.circle(cx + dx - p.r * scale * 0.22, dy - p.r * scale * 0.22, p.r * scale * 0.6);
				g.fill({ color: 0x9a8d7d, alpha: alpha * 0.75 });
			}
		}
	};

	/** Rewrite the covered cells. This is what actually applies the blast. */
	const fillReels = (covered: number[], symbol: SymbolName) => {
		for (const reel of covered) {
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
			if (clock < TOTAL_MS) raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
	};

	context.eventEmitter.subscribeOnMount({
		reelBlast: async ({ reels: covered, symbol, full: isFull }) => {
			const mine = ++generation;
			reels = covered;
			clock = 0;
			runClock();

			// The fuse burns for exactly the CHARGE beat, so it runs out on the bang.
			context.eventEmitter.broadcast({ type: 'soundBlastFuse' });
			await waitForTimeout(CHARGE_MS);
			// A blast cancelled mid-fuse must not still go bang.
			if (mine !== generation) return;

			// The bang and the breakage are the same instant — the dynamite is what
			// destroys the symbols, so they must not be two separate events.
			context.eventEmitter.broadcast({ type: 'soundBlastDetonate', full: isFull });
			context.eventEmitter.broadcast({ type: 'soundBlastShatter' });
			await waitForTimeout(SHATTER_MS);
			if (mine !== generation) return;

			// The cloud is opening. Wait for it to close over the reel before
			// touching the board.
			await waitForTimeout(PUFF_MS);
			if (mine !== generation) return;

			// Fully hidden. Swap here and the player never sees it happen.
			fillReels(covered, symbol);
			await waitForTimeout(HOLD_MS);
			if (mine !== generation) return;

			// The cloud starts thinning here and the swapped symbols come out from
			// behind it. The rising marimba tells the ear the board just improved,
			// ahead of the win evaluation that confirms it.
			context.eventEmitter.broadcast({ type: 'soundBlastReveal' });
			await waitForTimeout(DISPERSE_MS);
			if (mine !== generation) return;

			// The smoke is gone and the new board is standing there. Hold it before
			// the win evaluation starts moving things again — this wait draws
			// nothing, which is the point of it.
			await waitForTimeout(SETTLE_MS);
			if (mine !== generation) return;
			if (isFull) await waitForTimeout(FULL_BOARD_HOLD_MS);
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
	<Container>
		<Graphics {draw} />
	</Container>
</BoardContainer>
