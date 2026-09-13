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
	// These are the beats AT FULL SIZE. Everything after the fuse is then scaled
	// to how many reels actually went up — see AFTERMATH_SCALE.
	const CHARGE_MS = 380;
	const SHATTER_MS = 340;
	const PUFF_MS = 240;
	const HOLD_MS = 200;
	const DISPERSE_MS = 700;
	const SETTLE_MS = 420;

	// A full board is what the whole feature climbs towards, so it is held longer.
	// Not a different animation — the same one, given room.
	const FULL_BOARD_HOLD_MS = 700;

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

	// SMOKE, PAINTED THE WAY THE REST OF THE GAME IS PAINTED.
	//
	// The first version was flat neutral-grey circles with one lighter grey blob
	// on each. It read as programmer art next to the symbols, and the reason is
	// specific rather than vague: this game's art has ONE lighting rule, stated in
	// design/SYMBOL_PROMPTS.md and followed by every symbol and every background —
	// a warm mine-lamp key from the upper left, deep shadow to the lower right,
	// and a lit rim separating every subject from its ground. The smoke obeyed
	// none of it. It was neutral where everything else is warm, perfectly circular
	// where everything else is hand-drawn, and it had a highlight blob instead of
	// a rim, which reads as a decal stuck on a disc rather than as a volume.
	//
	// So each lump is now painted in the same four steps a painter would use:
	// shadow offset down-right, body, lit plane offset up-left, and a warm rim arc
	// along the lit contour. And the silhouette is lobed rather than round —
	// cauliflower edges are what makes drawn smoke read as smoke.
	const SMOKE_SHADOW = 0x2a2016;
	const SMOKE_BODY = 0x5c4c3a;
	const SMOKE_LIT = 0x9b8a6e;
	const SMOKE_RIM = 0xe0a868;

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
				// jittered off the even spacing, or nine lumps in a column read as a
				// stack of discs rather than as one mass
				y:
					TOP +
					HEIGHT * (0.05 + 0.9 * (i / (PUFFS_PER_REEL - 1))) +
					(rand2 - 0.5) * SYMBOL_SIZE * 0.16,
				x: (rand - 0.5) * SYMBOL_SIZE * 0.72,
				// At least half a cell wide, so a single lump already spans the column
				// and the cluster cannot leave a gap down the edges for the old symbol
				// to show through — the cover has to be total or the swap is visible.
				r: SYMBOL_SIZE * (0.5 + 0.34 * rand2),
				// each lump grows at its own rate, so the cloud does not inflate as
				// one object
				lag: rand2 * 0.25,
				// Cauliflower silhouette. Two harmonics is enough to stop the lump
				// reading as a circle and cheap enough to run per frame; a third adds
				// noise the eye cannot resolve at this size.
				w3: 0.11 + 0.07 * rand,
				w5: 0.05 + 0.06 * rand2,
				ph3: rand * Math.PI * 2,
				ph5: rand2 * Math.PI * 2,
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

	// A lobed blob. Radius is modulated by two harmonics, so the outline bulges
	// and pinches the way drawn smoke does instead of being a circle.
	const LOBE_STEPS = 34;
	type Lobe = { w3: number; w5: number; ph3: number; ph5: number };
	const lobeR = (p: Lobe, th: number) =>
		1 + p.w3 * Math.sin(3 * th + p.ph3) + p.w5 * Math.sin(5 * th + p.ph5);

	// `skew` rotates the harmonics for one layer only. Without it every layer is a
	// scaled copy of the same outline, and the four of them stacked read as
	// contour rings on a topographic map instead of as one lump catching light.
	const skewed = (p: Lobe, skew: number): Lobe => ({
		...p,
		ph3: p.ph3 + skew,
		ph5: p.ph5 - skew * 1.7,
	});

	const lobe = (g: PixiGraphics, cx: number, cy: number, r: number, p: Lobe, skew = 0) => {
		const q = skew ? skewed(p, skew) : p;
		const pts: number[] = [];
		for (let i = 0; i < LOBE_STEPS; i++) {
			const th = (i / LOBE_STEPS) * Math.PI * 2;
			const rr = r * lobeR(q, th);
			pts.push(cx + Math.cos(th) * rr, cy + Math.sin(th) * rr);
		}
		g.poly(pts);
	};

	// The lit contour only. Screen y runs down, so the upper-left arc is the
	// sweep either side of 1.25pi — the same direction the key light comes from
	// in every symbol and background in this game.
	const rimArc = (g: PixiGraphics, cx: number, cy: number, r: number, p: Lobe) => {
		const from = Math.PI * 0.88;
		const to = Math.PI * 1.62;
		for (let i = 0; i <= 12; i++) {
			const th = from + ((to - from) * i) / 12;
			const rr = r * lobeR(p, th);
			const x = cx + Math.cos(th) * rr;
			const y = cy + Math.sin(th) * rr;
			if (i === 0) g.moveTo(x, y);
			else g.lineTo(x, y);
		}
	};

	// Embers. A dynamite blast in a lamp-lit mine throws burning specks, and the
	// B symbol already establishes a bright spark as this game's signature detail
	// — the smoke was the one place the blast produced no light at all.
	const EMBERS_PER_REEL = 14;
	const embersOf = (reel: number) =>
		Array.from({ length: EMBERS_PER_REEL }, (_, i) => {
			const a = hash(reel + 3.1, i + 7.7, 1);
			const b = hash(reel + 8.2, i + 2.3, 2);
			const c = hash(reel + 5.5, i + 9.9, 3);
			return {
				dir: a * Math.PI * 2,
				speed: 0.35 + 0.9 * b,
				y0: TOP + HEIGHT * (0.1 + 0.8 * c),
				size: 1.4 + 2.6 * b,
				// staggered so they do not all leave on the same frame
				lag: 0.25 * c,
				warm: b > 0.45,
			};
		});

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

			// Embers first, so the smoke closes over them rather than sitting under
			// them. They are the only light the blast puts into the scene.
			for (const e of embersOf(reel)) {
				const t = Math.min(1, Math.max(0, (puff - e.lag) / (1 - e.lag)));
				if (t <= 0) continue;
				const travel = (t + disperse * 1.6) * e.speed * SYMBOL_SIZE;
				const ex = cx + Math.cos(e.dir) * travel;
				// they rise, then gravity starts to win
				const ey = e.y0 + Math.sin(e.dir) * travel * 0.55 + disperse ** 2 * SYMBOL_SIZE * 0.6;
				const life = Math.max(0, 1 - disperse * 1.35);
				if (life <= 0.01) continue;
				const r = e.size * (0.6 + 0.4 * life);
				g.circle(ex, ey, r * 2.2);
				g.fill({ color: 0xff9a3c, alpha: 0.16 * life });
				g.circle(ex, ey, r);
				g.fill({ color: e.warm ? 0xffd489 : 0xffb257, alpha: 0.85 * life });
			}

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
				const px = cx + dx;
				const r = p.r * scale;

				// 1. shadow, pushed away from the key light
				lobe(g, px + r * 0.1, dy + r * 0.12, r * 1.02, p, -0.35);
				g.fill({ color: SMOKE_SHADOW, alpha: alpha * 0.55 });
				// 2. the mass itself
				lobe(g, px, dy, r, p);
				g.fill({ color: SMOKE_BODY, alpha });
				// 3. the plane facing the lamp, in two soft steps rather than one hard
				// edge — a single lit shape reads as a cut-out stuck on the lump
				lobe(g, px - r * 0.14, dy - r * 0.15, r * 0.78, p, 0.55);
				g.fill({ color: SMOKE_LIT, alpha: alpha * 0.3 });
				lobe(g, px - r * 0.24, dy - r * 0.26, r * 0.5, p, 1.05);
				g.fill({ color: SMOKE_LIT, alpha: alpha * 0.38 });
				// 4. and a hint of rim along the lit contour. Kept faint: at full
				// strength nine of these stacked read as ink outlines, not as light.
				rimArc(g, px, dy, r, p);
				g.stroke({ width: Math.max(1, r * 0.032), color: SMOKE_RIM, alpha: alpha ** 2 * 0.26 });
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
			if (clock < beats.total) raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
	};

	context.eventEmitter.subscribeOnMount({
		reelBlast: async ({ reels: covered, symbol, full: isFull }) => {
			const mine = ++generation;
			reels = covered;
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
			fillReels(covered, symbol);
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
