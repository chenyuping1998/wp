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

	// How long a SINGLE line holds. Long enough to trace one with your eye, short
	// enough that it is gone before the next spin can start.
	const HOLD_MS = 1200;
	// The lines draw on rather than appearing, left to right, so the eye follows
	// the direction the game pays in.
	const DRAW_MS = 260;

	// ── more than one line is shown ONE AT A TIME ────────────────────────────
	//
	// Every winning line used to be drawn at once and held together. On this board
	// the paylines cross - 4 and 6 are mirror zigzags, 8 and 9 are opposed
	// chevrons - so three wins at once is three hairlines crossing each other over
	// the symbols they are trying to point at, and the player cannot tell which
	// cells belong to which win.
	//
	// The cost of fixing that falls almost entirely on cases that barely happen.
	// Measured over 267,513 win events:
	//
	//     1 line    82.75%      4 lines   0.33%
	//     2 lines   14.63%      5 lines   0.07%
	//     3 lines    2.21%      6+       0.01%   (most ever seen: 7)
	//
	// So a single line - five wins in six - keeps exactly the presentation it had,
	// and nothing about the common spin gets slower. Only the 17% that are
	// genuinely crowded pay for the room to be read.
	//
	// NO OVERVIEW.
	//
	// The cycle opened with every line drawn together for a beat, on the reasoning
	// that it is the only thing that can say HOW MANY there are. That is true and
	// it is not worth what it costs: the overview is the crowded picture the
	// cycling exists to avoid, shown first, and it delays every line behind it.
	// The count is legible from the cycle itself.
	const PER_LINE_MS = 340;
	// The ceiling the whole cycle fits inside. At seven lines that is 243ms each.
	const CYCLE_CEILING_MS = 1700;

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
					if (elapsed >= totalMs) {
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


	/** How long one line gets, once the overview is over. */
	const perLine = $derived(
		lines.length < 2 ? 0 : Math.min(PER_LINE_MS, CYCLE_CEILING_MS / lines.length),
	);
	/** The whole presentation, however many lines there are. */
	const totalMs = $derived(lines.length < 2 ? HOLD_MS : perLine * lines.length);

	/**
	 * Which lines are on screen right now, and how far each has drawn on.
	 *
	 * During the overview every line is drawn together and shares one draw-on.
	 * After it, one line at a time, each drawing on from its own start - so the
	 * eye is led along each win separately rather than being handed a knot.
	 */
	const visible = $derived.by(() => {
		if (lines.length === 0) return [] as { line: WinLine; t: number }[];
		if (lines.length < 2) {
			return [{ line: lines[0], t: Math.max(0, Math.min(1, elapsed / DRAW_MS)) }];
		}
		const index = Math.min(lines.length - 1, Math.floor(elapsed / perLine));
		const within = elapsed - index * perLine;
		// Each line draws on over a fixed share of its own slot rather than over
		// DRAW_MS, so a crowded win does not end up with lines that never finish
		// arriving before they are replaced.
		return [{ line: lines[index], t: Math.max(0, Math.min(1, within / (perLine * 0.45))) }];
	});

	// Fade out over the last fifth, so the board is clear before the reels can
	// move again.
	const fade = $derived(Math.max(0, Math.min(1, (totalMs - elapsed) / (totalMs * 0.2))));

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

				for (const { line, t: drawT } of visible) {
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
