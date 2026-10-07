<script lang="ts" module>
	export type EmitterEventReelSplits =
		// `lead` marks ONE reel out of a simultaneous batch as the one that carries
		// the audio. The reels of a batch are cut at the same instant, so without it
		// a three-reel split fires the cue three times on the same frame — which is
		// not three times as loud, it is a flam.
		| { type: 'reelSplit'; reel: number; finale: boolean; lead: boolean }
		| { type: 'reelSplitAge' }
		| { type: 'reelSplitRestore'; reels: number[] }
		| { type: 'reelSplitClear' };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut, backOut, quintOut } from 'svelte/easing';
	import { Graphics, Container } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, REEL_PADDING, BOARD_DIMENSIONS } from '../game/constants';

	const context = getContext();

	// WHAT THIS DRAWS, AND WHAT IT DELIBERATELY DOES NOT
	//
	// This replaces gen-2's expanding-wild panel, and the two are opposites. An
	// expanded wild REPLACED its reel: one gold plate covering four hidden
	// symbols, which is why that component had to draw the symbol art itself.
	//
	// A split reel replaces nothing. The symbols on it are the real symbols, they
	// land normally, and only their COUNT toward the ways is doubled. So the job
	// here is decoration over a board that is already correct — and emphatically
	// NOT drawing symbols. Anything that covered the reel would be lying about
	// what is on it.
	//
	// WHY THE CUT IS VERTICAL
	//
	// A reel is a column, and the rule the player is told is "the Machete splits
	// its reel in two". A cut down the column's centre line is that sentence: two
	// half-width columns where there was one, which is also why each cell then
	// counts twice. A horizontal cut would read as slicing the symbols rather
	// than the reel, and would fight the reel's own direction of travel.
	//
	// The maths expresses the same thing as multiplier=2 on each cell (see
	// game_executables.apply_splits), so the reveal already carries the state per
	// cell. This component takes the REEL list instead, because the decoration is
	// per reel — reading 4 cells to discover a fact about their column would just
	// be a slower way to learn the same thing.

	const CUT = 0xffd75e;
	const CUT_HOT = 0xfff3c4;
	const CUT_DARK = 0x140d02;

	// THE CHOP IS TWO STROKES, NOT ONE.
	//
	// A single top-to-bottom sweep reads as a line being drawn. A machete cutting
	// a column does not do that — it goes IN and then back through. So the blade
	// runs up first, then down, and only after the second pass do the halves come
	// apart. Three stages, because the eye needs the return stroke to understand
	// the first one as a cut rather than a wipe.
	const UP_MS = 150;
	const DOWN_MS = 170;
	const SETTLE_MS = 260;

	// Turbo shortens the chop but never removes it.
	//
	// Everything else in turbo is allowed to be instant because it is a spin the
	// player has chosen to skip. The cut is not that: it is the moment the game's
	// one mechanic happens, and a split reel that simply appears already split
	// tells the player nothing about why. 0.6 keeps it around 290ms end to end —
	// brisk, and still a chop.
	const FAST = 0.6;

	// A cut made in the free game STAYS for the rest of the feature. That is a
	// different event from a base-game cut, which is gone next spin, and it was
	// getting the same 150ms of presentation. So the permanent one holds after the
	// halves come apart, and it lands on an impact rather than a tick.
	//
	// The dwell is deliberately after the settle rather than inside it: the point
	// is not a slower animation, it is a beat of stillness with the split board on
	// screen, which is the thing the player is meant to remember.
	const STICKY_DWELL_MS = 560;

	type Split = {
		reel: number;
		// true once this reel has survived a spin already cut — see splitRowsOf
		sticky: boolean;
		// 0..1 — the blade travelling UP, bottom to top
		up: Tween<number>;
		// 0..1 — the blade coming back DOWN, which is what opens the cut
		down: Tween<number>;
		// 0..1 — the halves easing apart and the badge arriving
		settle: Tween<number>;
		// the finale cut is the feature's last spin, not another machete landing
		finale: boolean;
	};

	let splits = $state<Split[]>([]);

	// A frame ticker, read by draw() so the Graphics repaints while the blade
	// moves. The win-line renderer this file replaces needed the same thing; a
	// draw callback that only re-runs when a tracked value changes is a fragile
	// thing to hang an animation on, and the cost here is one integer per frame
	// and only while something is actually animating.
	let tick = $state(0);
	let raf = 0;
	const animating = $derived(
		splits.some((s) => s.up.current < 1 || s.down.current < 1 || s.settle.current < 1),
	);
	$effect(() => {
		if (!animating) {
			cancelAnimationFrame(raf);
			return;
		}
		const step = () => {
			tick += 1;
			raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
		return () => cancelAnimationFrame(raf);
	});

	const scale = () => (stateBet.isTurbo ? FAST : 1);
	const upMs = () => UP_MS * scale();
	const downMs = () => DOWN_MS * scale();
	const settleMs = () => SETTLE_MS * scale();

	const reelX = (reel: number) => SYMBOL_SIZE * (reel + REEL_PADDING);
	const reelLeft = (reel: number) => reelX(reel) - SYMBOL_SIZE / 2;

	// WHICH CELLS THE LINE RUNS THROUGH.
	//
	// Per cell, from multiplier===2 — the same flag Symbol.svelte splits on, so
	// the score and the line can never disagree about which cells were cut. The
	// maths does not split the Machete itself or a Scatter (apply_splits skips
	// both: doubling the count of a symbol that does not pay would mean nothing),
	// so those cells have no flag and the line breaks around them.
	//
	// EXCEPT on a reel that was ALREADY cut before this spin. There the reel is
	// standing open, and a Machete landing into it is a symbol sitting in a cut
	// column, not the thing doing the cutting — a gap at that one cell reads as
	// the cut having healed around it. So on a sticky reel the line is drawn
	// unbroken, and only the spin that OPENS a reel leaves its Machete unmarked.
	const splitRowsOf = (reel: number, sticky: boolean) => {
		const symbols = stateGame.board[reel]?.reelState.symbols ?? [];
		const rows: number[] = [];
		for (let row = 1; row <= BOARD_DIMENSIONS.y; row++) {
			const sym = symbols[row]?.rawSymbol;
			if (!sym) continue;
			if (sym.multiplier === 2 || (sticky && sym.name !== 'S')) rows.push(row);
		}
		return rows;
	};
	// Row r of the padded array occupies y = (r - 1) * SYMBOL_SIZE upward.
	const rowTop = (row: number) => TOP + (row - 1) * SYMBOL_SIZE;
	// Visible rows are 1..numRows in the padded board array, which puts the top of
	// row 1 at y = 0. Same convention as WinWays.
	const TOP = 0;
	const HEIGHT = SYMBOL_SIZE * BOARD_DIMENSIONS.y;

	const add = (reel: number, finale: boolean, instant = false) => {
		if (splits.some((s) => s.reel === reel)) return null;
		const split: Split = {
			reel,
			sticky: instant,
			up: new Tween(instant ? 1 : 0, { duration: upMs(), easing: cubicOut }),
			down: new Tween(instant ? 1 : 0, { duration: downMs(), easing: quintOut }),
			settle: new Tween(instant ? 1 : 0, { duration: settleMs(), easing: backOut }),
			finale,
		};
		splits = [...splits, split];
		return split;
	};

	context.eventEmitter.subscribeOnMount({
		reelSplit: async ({ reel, finale, lead }) => {
			// The cue is raised BEFORE the early return, not after it.
			//
			// `lead` names one reel out of the batch as the one carrying the audio,
			// and add() returns null for a reel that is somehow already cut. Put
			// together the wrong way round, a batch whose lead reel was already cut
			// plays no sound at all and no other reel covers for it — the whole
			// split goes silent. That state is not supposed to happen, but "not
			// supposed to happen" is exactly the case that reaches a player.
			if (lead) {
				context.eventEmitter.broadcast({
					type: 'soundOnce',
					name: finale ? 'sfx_wild_explode' : 'sfx_multiplier_landing',
				});
			}
			const split = add(reel, finale);
			if (!split) return;
			// Permanent from here to the end of the feature. gameType, not the bet
			// mode: a bought round is in the free game too.
			const permanent = stateGame.gameType === 'freegame';
			// Up, down, then apart. Each stage has its own curve because they are
			// different motions: the entry decelerates into the top, the return
			// stroke is the fast one, and the settle overshoots slightly and comes
			// back. One tween across all three would make every part of it a lie.
			split.up.set(1, { duration: upMs(), easing: cubicOut });
			await waitForTimeout(upMs());
			split.down.set(1, { duration: downMs(), easing: quintOut });
			await waitForTimeout(downMs());
			// The blade is through: NOW the cell may show itself as two.
			stateGame.splitCutReels = [...new Set([...stateGame.splitCutReels, reel])];
			// On the strike, not on the wind-up. The cue at the top of this handler
			// announces the blade; this one is the cut landing, and it only exists
			// for the cut that is going to stay.
			if (lead && permanent && !finale) {
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_explosion_b' });
			}
			split.settle.set(1, { duration: settleMs(), easing: backOut });
			await waitForTimeout(settleMs() * (permanent ? 1 : 0.6));
			if (permanent) await waitForTimeout(STICKY_DWELL_MS * scale());
		},
		// Rebuilding a resumed round: the cuts are already there, so they appear
		// fully settled rather than animating in. A restored state that plays its
		// entrance reads as "this just happened", which is the one thing it did not.
		reelSplitRestore: ({ reels }) => {
			splits = [];
			for (const reel of reels) add(reel, false, true);
			stateGame.splitCutReels = [...reels];
		},
		// Every reveal that arrives while a cut is standing makes it sticky: it was
		// opened on an earlier spin, so from here on it is a cut reel that symbols
		// land INTO rather than a reel being cut.
		reelSplitAge: () => {
			for (const split of splits) split.sticky = true;
		},
		reelSplitClear: () => {
			splits = [];
			stateGame.splitCutReels = [];
		},
	});

	const draw = (g: PixiGraphics) => {
		tick; // repaint every frame while a blade is travelling
		g.clear();
		for (const split of splits) {
			const up = split.up.current;
			if (up <= 0) continue;
			const down = split.down.current;
			const settle = split.settle.current;
			const x = reelX(split.reel);
			const left = reelLeft(split.reel);
			const w = split.finale ? 1.5 : 1;
			const cutTo = TOP + HEIGHT * down;

			// Only the cells that were actually split. The Machete's own cell is
			// skipped, so the line breaks around it rather than running the length
			// of the reel and claiming a cut that did not happen there.
			const rows = splitRowsOf(split.reel, split.sticky);

			// How far the two halves have parted. Small on purpose: a hint that the
			// cell is now two, not a layout change — the symbols under it have not
			// moved and must not look as though they have.
			const part = 3 * settle;

			// Faint warm wash over the split cells only.
			if (down > 0) {
				for (const row of rows) {
					const y0 = rowTop(row);
					const y1 = Math.min(y0 + SYMBOL_SIZE, cutTo);
					if (y1 <= y0) continue;
					g.rect(left, y0, SYMBOL_SIZE, y1 - y0);
				}
				g.fill({ color: CUT, alpha: 0.06 * settle + 0.04 * down });
			}

			// Inner shadows facing the cut. This is what sells two surfaces rather
			// than one line painted on top of the symbols.
			if (part > 0) {
				for (const row of rows) {
					const y0 = rowTop(row);
					g.rect(x - part - 5, y0, 5, SYMBOL_SIZE);
					g.rect(x + part, y0, 5, SYMBOL_SIZE);
				}
				g.fill({ color: CUT_DARK, alpha: 0.34 * settle });
			}

			// The cut itself, one segment per split cell. Dark score for weight,
			// bright core for the edge — a single bright stroke has no mass on a
			// dark board, and a single dark one disappears over the gold symbols.
			//
			// No end ticks: they were there to terminate a full-reel line, and a
			// line that already stops at each cell's own edge does not need them.
			if (down > 0) {
				const segments: [number, number][] = [];
				for (const row of rows) {
					const y0 = rowTop(row);
					const y1 = Math.min(y0 + SYMBOL_SIZE, cutTo);
					if (y1 > y0) segments.push([y0, y1]);
				}
				for (const [y0, y1] of segments) {
					g.moveTo(x, y0);
					g.lineTo(x, y1);
				}
				g.stroke({ width: 7 * w, color: CUT_DARK, alpha: 0.7 });
				for (const [y0, y1] of segments) {
					g.moveTo(x, y0);
					g.lineTo(x, y1);
				}
				g.stroke({ width: 2.6 * w, color: CUT, alpha: 0.95 });
			}

			// The blade. Up stroke first (bottom to top), then back down. Drawn as a
			// short bright streak with a head, so the eye tracks a moving object
			// rather than a line changing length.
			//
			// It travels the WHOLE reel even though the line does not: the machete
			// passes through every cell, it simply leaves no mark on its own.
			const blade = (y: number, dir: -1 | 1) => {
				const tail = SYMBOL_SIZE * 0.55;
				g.moveTo(x, y + tail * dir);
				g.lineTo(x, y);
				g.stroke({ width: 5 * w, color: CUT_HOT, alpha: 0.9 });
				g.circle(x, y, 5.5 * w);
				g.fill({ color: CUT_HOT, alpha: 0.9 });
			};
			if (up < 1) {
				blade(TOP + HEIGHT * (1 - up), 1);
			} else if (down < 1) {
				blade(cutTo, -1);
			}

			// NO "x2" MARKER HERE, DELIBERATELY.
			//
			// There was one, and it was wrong: x2 reads as a win multiplier, and the
			// split is not one. It doubles the reel's contribution to the WAYS
			// COUNT, which then multiplies across reels — a cell on a split reel
			// pays the same as any other cell, there are simply more ways through
			// it. Printing x2 on the board would have players expecting double
			// money and reading the paytable as broken when it did not arrive.
		}
	};
</script>

<BoardContainer>
	<!-- zIndex 6: above the symbols, below WinWays at 10. A win highlight has to
	     be able to dim a split reel like any other, or a winning line through an
	     uncut reel would read as dimmer than the losing cut one beside it. -->
	<Container zIndex={6}>
		<Graphics {draw} />
	</Container>
</BoardContainer>
