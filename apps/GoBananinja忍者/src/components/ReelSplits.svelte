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

	// The finished cells already contain two complete diagonal motifs. A centre
	// divider would cover that artwork, so this component draws only the brief
	// cause of the change: M gathers ink, a diagonal slash visits each cell,
	// and a pair of sparks lands on the new two-motif tile. Nothing persists.
	const INK_RED = 0xb72f3d;
	const BLADE = 0xf5e9cf;
	const SPARK = 0xf5cc79;

	// Preserve the existing attack/impact/settle timings so the mascot, audio and
	// stateGame.splitCutReels still meet on the same frame.
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
		// 0..1 — M's gathering pulse
		up: Tween<number>;
		// 0..1 — diagonal slashes travel through the affected cells
		down: Tween<number>;
		// 0..1 — brief highlights on the two new motifs
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

	// Use the maths' own per-cell split flag, exactly as Symbol.svelte does.
	// M and Scatter are excluded by the feature rules.
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
	// Row r of the padded array occupies y = (r - 1) * SYMBOL_SIZE.
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
				context.eventEmitter.broadcast({ type: 'mascotSlash' });
				// The hand reaches the hilt before the blade starts moving. Keep the
				// draw cue on that extraction beat (including Turbo's 0.6x timing).
				window.setTimeout(
					() => context.eventEmitter.broadcast({ type: 'soundBladeDraw', finale }),
					170 * scale(),
				);
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
			// The hit lands when the artwork changes into the split symbol.
			if (lead) context.eventEmitter.broadcast({ type: 'soundBladeHit', finale });
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
		tick; // repaint every frame during the attack
		g.clear();
		for (const split of splits) {
			const up = split.up.current;
			if (up <= 0) continue;
			const down = split.down.current;
			const settle = split.settle.current;
			const x = reelX(split.reel);
			const left = reelLeft(split.reel);
			const rows = splitRowsOf(split.reel, split.sticky);
			const strength = split.finale ? 1.3 : 1;

			// M's red ink seal contracts before the strike. On an automatic finale
			// there may be no M in this reel, so gather at the reel centre instead.
			if (up < 1) {
				const symbols = stateGame.board[split.reel]?.reelState.symbols ?? [];
				const mRow = symbols.findIndex((symbol, index) =>
					index >= 1 && index <= BOARD_DIMENSIONS.y && symbol?.rawSymbol?.name === 'M',
				);
				const cy = mRow > 0 ? rowTop(mRow) + SYMBOL_SIZE / 2 : TOP + HEIGHT / 2;
				const pulse = Math.sin(Math.PI * up);
				g.circle(x, cy, SYMBOL_SIZE * (0.47 - up * 0.2));
				g.stroke({ width: 3 * strength, color: INK_RED, alpha: 0.75 * pulse });
				g.circle(x, cy, SYMBOL_SIZE * (0.27 - up * 0.1));
				g.stroke({ width: 1.5 * strength, color: SPARK, alpha: 0.8 * pulse });
			}

			// A travelling diagonal stroke visits each payable cell. It is visible
			// only during that cell's short turn, never left over the dual motif.
			if (down > 0 && down < 1) {
				for (const row of rows) {
					const local = Math.max(0, Math.min(1, down * BOARD_DIMENSIONS.y - (row - 1)));
					if (local <= 0 || local >= 1) continue;
					const alpha = Math.sin(Math.PI * local);
					const y0 = rowTop(row);
					const sx = left + SYMBOL_SIZE * 0.16;
					const sy = y0 + SYMBOL_SIZE * 0.15;
					const ex = left + SYMBOL_SIZE * (0.16 + 0.68 * local);
					const ey = y0 + SYMBOL_SIZE * (0.15 + 0.7 * local);
					g.moveTo(sx, sy);
					g.lineTo(ex, ey);
					g.stroke({ width: 10 * strength, color: INK_RED, alpha: 0.38 * alpha });
					g.moveTo(sx, sy);
					g.lineTo(ex, ey);
					g.stroke({ width: 2.5 * strength, color: BLADE, alpha: 0.92 * alpha });
					g.circle(ex, ey, 3.5 * strength);
					g.fill({ color: SPARK, alpha: 0.85 * alpha });
				}
			}

			// The reveal swaps to the dedicated two-motif tile at down=1. A short
			// glint on BOTH new motif positions makes that transformation legible.
			if (down >= 1 && settle < 1 && stateGame.splitCutReels.includes(split.reel)) {
				const alpha = (1 - settle) ** 2 * 0.9;
				for (const row of rows) {
					const y0 = rowTop(row);
					for (const [cx, cy] of [
						[left + SYMBOL_SIZE * 0.3, y0 + SYMBOL_SIZE * 0.3],
						[left + SYMBOL_SIZE * 0.7, y0 + SYMBOL_SIZE * 0.7],
					]) {
						g.circle(cx, cy, (3 + 6 * settle) * strength);
						g.stroke({ width: 2 * strength, color: SPARK, alpha });
						g.circle(cx, cy, 2 * strength);
						g.fill({ color: BLADE, alpha });
					}
				}
			}
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
