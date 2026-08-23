<script lang="ts" module>
	import type { Position } from '../game/types';

	export type WinLine = { positions: Position[]; win: number };

	// Line wins, presented the way the reference title does it: a thin gold
	// polyline through the paying cells, with the paying SYMBOLS carrying the
	// movement.
	//
	// The line itself is flat and still. An earlier version drew it thick, with a
	// dark under-stroke and a node dot on every cell, from a single still frame of
	// the reference - the frames either side show a hairline and no dots, and the
	// rhythm coming from the symbols pulsing rather than from anything the line
	// does. See Board/SymbolWinAnim for that half.
	export type EmitterEventWinLines =
		| { type: 'winLinesShow'; lines: WinLine[]; totalWin: number }
		| { type: 'winLinesHide' };
</script>

<script lang="ts">
	import { Container, Graphics } from 'pixi-svelte';
	import { onDestroy } from 'svelte';

	import { getContext } from '../game/context';
	import { getSymbolX, getSymbolY } from '../game/utils';
	import { SYMBOL_SIZE } from '../game/constants';

	const context = getContext();

	// Sampled off the reference footage: a warm orange-gold, not the talisman's
	// yellow-green. On a dark teal board it reads at hairline weight, which the
	// yellow did not.
	const LINE = 0xefb938;

	// How long the lines hold. Long enough to trace one with your eye, short
	// enough that it is gone before the next spin can start.
	const HOLD_MS = 1200;
	// The lines draw on rather than appearing, left to right, so the eye follows
	// the direction the game pays in.
	const DRAW_MS = 260;

	let lines = $state<WinLine[]>([]);
	let elapsed = $state(0);
	let raf = 0;

	const stop = () => {
		cancelAnimationFrame(raf);
		raf = 0;
	};

	context.eventEmitter.subscribeOnMount({
		// `totalWin` still rides in the payload for the bet bar's WIN field; nothing
		// here needs it any more.
		winLinesShow: ({ lines: next }) =>
			new Promise<void>((resolve) => {
				stop();
				lines = next;
				elapsed = 0;
				const t0 = performance.now();
				const step = (now: number) => {
					elapsed = now - t0;
					if (elapsed >= HOLD_MS) {
						stop();
						resolve();
						return;
					}
					raf = requestAnimationFrame(step);
				};
				raf = requestAnimationFrame(step);
			}),
		winLinesHide: () => {
			stop();
			lines = [];
			elapsed = 0;
		},
	});

	onDestroy(stop);


	const drawT = $derived(Math.max(0, Math.min(1, elapsed / DRAW_MS)));
	// Fade out over the last fifth of the hold, so the board is clear before the
	// reels can move again.
	const fade = $derived(Math.max(0, Math.min(1, (HOLD_MS - elapsed) / (HOLD_MS * 0.2))));

	/**
	 * The polyline for one win, clipped to `t` of its total length.
	 *
	 * Only the cells the maths said paid. Extending a line across the full board
	 * because "that is where the payline runs" would show the player five cells
	 * paying when three did.
	 */
	const pointsFor = (positions: Position[]) =>
		positions.map((p) => ({ x: getSymbolX(p.reel), y: getSymbolY(p.row) }));

	// A hairline, in BOARD units so it holds its weight at every layout scale.
	// The reference draws roughly 3px on a 210px cell; this is the same fraction.
	const LINE_WIDTH = SYMBOL_SIZE * 0.018;
</script>

{#if lines.length > 0}
	<Container alpha={fade}>
		<Graphics
			draw={(g) => {
				g.clear();

				for (const line of lines) {
					const pts = pointsFor(line.positions);
					if (pts.length < 2) continue;

					// total length, so the draw-on advances at a constant speed
					// regardless of how many cells the win covers
					const segLengths = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
					const totalLen = segLengths.reduce((a, b) => a + b, 0);
					let left = totalLen * drawT;

					g.moveTo(pts[0].x, pts[0].y);
					for (let i = 1; i < pts.length; i++) {
						const seg = segLengths[i - 1];
						if (left <= 0) break;
						if (left >= seg) {
							g.lineTo(pts[i].x, pts[i].y);
							left -= seg;
						} else {
							const k = left / seg;
							g.lineTo(pts[i - 1].x + (pts[i].x - pts[i - 1].x) * k, pts[i - 1].y + (pts[i].y - pts[i - 1].y) * k);
							left = 0;
						}
					}
					// stroke(), never fill(). An open polyline handed to the v7
					// compat API (beginFill/lineStyle) is implicitly closed and
					// filled, which drew each win as a solid block instead of a
					// line. design/check_graphics_paths.mjs guards this now.
					g.stroke({ width: LINE_WIDTH, color: LINE, alpha: 1, cap: 'round', join: 'round' });
				}
			}}
		/>

		<!--
			No total drawn on the board.

			There was one - the amount in white in the middle of the reels, big
			enough to sit over two cells. Two things were wrong with it. The bet bar
			already carries a WIN field that counts the same number up, so the board
			copy was the second place saying it; and it landed dead centre, which on
			a 5x3 board is on top of the middle cell of reel 3 - so a win whose line
			ran through the centre had its own paying symbol covered by its own
			total.
		-->
	</Container>
{/if}
