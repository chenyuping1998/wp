<script lang="ts" module>
	export type EmitterEventWinLines =
		| { type: 'winLinesShow'; wins: WinLineData[]; fast?: boolean }
		| { type: 'winLinesHide' }
		| { type: 'winLinesClear' };

	export type WinLineData = {
		lineIndex: number;
		positions: { reel: number; row: number }[];
		symbolCount: number;
	};
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Graphics, Container, Sprite } from 'pixi-svelte';
	import { waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, REEL_PADDING } from '../game/constants';
	import config from '../game/config';

	const context = getContext();

	const LINE_COLORS = [
		0xff2288, 0x00eeff, 0xffee00, 0xff6600, 0x00ff88,
		0xcc44ff, 0x44aaff, 0xffaa00, 0xff44aa, 0x22ffcc,
		0xff4444, 0x88ff44, 0x4488ff, 0xff88ff, 0xaaff22,
		0xff6688, 0x66ffee, 0xffcc44, 0xaa66ff, 0x44ff66,
		0xff3366, 0x3399ff, 0xffff66, 0xff9944, 0x66ff99,
		0xdd44ff, 0x44ddff, 0xff6633, 0x99ff44, 0xff44dd,
		0x44ffbb, 0xffbb44, 0x7744ff, 0x44ff44, 0xff4477,
	];

	type DrawnLine = {
		lineIndex: number;
		color: number;
		points: { x: number; y: number }[];
	};

	const WIN_LINE_STEP_DELAY_FAST = 70;
	const WIN_LINE_STEP_DELAY_NORMAL = 140;
	const WIN_LINE_END_DELAY = 80;

	let drawnLines = $state<DrawnLine[]>([]);
	let show = $state(false);

	// Symbol center X: same formula as getSymbolX in utils.ts
	function symbolCenterX(reel: number) {
		return SYMBOL_SIZE * (reel + REEL_PADDING);
	}

	// Symbol center Y accounts for the reel default offset (-SYMBOL_SIZE)
	// Actual render: reelY(-120) + (arrayIndex + 0.5) * 120
	// Payline rows (0,1,2) map to padded array indices (1,2,3)
	function symbolCenterYFromPayline(paylineRow: number) {
		return -SYMBOL_SIZE + (paylineRow + 1 + 0.5) * SYMBOL_SIZE;
	}

	// walk the payline polyline up to `p` (0..1 of total length) and return the
	// points that make up the drawn portion, with the partial last segment
	const pathAt = (points: { x: number; y: number }[], p: number) => {
		if (p >= 1) return points;
		const segLengths = points.slice(1).map((pt, i) => Math.hypot(pt.x - points[i].x, pt.y - points[i].y));
		const total = segLengths.reduce((sum, l) => sum + l, 0);
		let want = total * Math.max(0, p);
		const out = [points[0]];
		for (let i = 0; i < segLengths.length; i++) {
			if (want >= segLengths[i]) {
				out.push(points[i + 1]);
				want -= segLengths[i];
				continue;
			}
			const f = segLengths[i] === 0 ? 0 : want / segLengths[i];
			out.push({
				x: points[i].x + (points[i + 1].x - points[i].x) * f,
				y: points[i].y + (points[i + 1].y - points[i].y) * f,
			});
			break;
		}
		return out;
	};

	// 0 → 1 while the current line draws itself on
	let drawProgress = $state(1);
	let drawRaf = 0;
	const runDrawOn = (durationMs: number) => {
		cancelAnimationFrame(drawRaf);
		const start = performance.now();
		const step = (now: number) => {
			const p = (now - start) / durationMs;
			drawProgress = Math.min(1, p);
			if (p < 1) drawRaf = requestAnimationFrame(step);
		};
		drawProgress = 0;
		drawRaf = requestAnimationFrame(step);
	};
	onDestroy(() => cancelAnimationFrame(drawRaf));

	context.eventEmitter.subscribeOnMount({
		winLinesShow: async ({ wins, fast }) => {
			drawnLines = [];
			show = true;

			const allLines: DrawnLine[] = [];

			for (const win of wins) {
				const lineIdx = win.lineIndex;
				const color = LINE_COLORS[(lineIdx - 1) % LINE_COLORS.length];

				// Full payline path
				const paylineRows: number[] =
					(config.paylines as Record<string, number[]>)[String(lineIdx)];
				if (!paylineRows) continue;

				const points: { x: number; y: number }[] = [];
				for (let reel = 0; reel < paylineRows.length; reel++) {
					points.push({
						x: symbolCenterX(reel),
						y: symbolCenterYFromPayline(paylineRows[reel]),
					});
				}
				allLines.push({ lineIndex: lineIdx, color, points });
			}

			const stepDelay = fast ? WIN_LINE_STEP_DELAY_FAST : WIN_LINE_STEP_DELAY_NORMAL;
			for (let i = 0; i < allLines.length; i++) {
				drawnLines = [allLines[i]];
				// spend the first ~60% of the slot racing the stroke across, then
				// let it sit so the eye can read the shape
				runDrawOn(stepDelay * 0.6);
				await waitForTimeout(stepDelay);
			}
			await waitForTimeout(WIN_LINE_END_DELAY);
		},
		winLinesHide: () => {
			show = false;
			drawnLines = [];
		},
		winLinesClear: () => {
			drawnLines = [];
		},
	});
</script>

{#if show && drawnLines.length > 0}
	<BoardContainer>
		<Container zIndex={10}>
			{#each drawnLines as line (line.lineIndex)}
				<Graphics
					draw={(g) => {
						if (!line.points || line.points.length < 2) return;
						g.clear();
						// draw-on: the line races left→right across the reels instead of
						// blinking in whole, and a bright head leads the stroke
						const drawn = pathAt(line.points, drawProgress);
						if (drawn.length < 2) return;
						const stroke = (width: number, color: number, alpha: number) => {
							g.lineStyle(width, color, alpha);
							g.moveTo(drawn[0].x, drawn[0].y);
							for (let i = 1; i < drawn.length; i++) g.lineTo(drawn[i].x, drawn[i].y);
						};
						stroke(7, line.color, 0.22);
						stroke(3, line.color, 0.95);
						stroke(1.2, 0xffffff, 0.5);
					}}
				/>
				{#if drawProgress < 1}
					{@const head = pathAt(line.points, drawProgress).at(-1)}
					{#if head}
						<Sprite
							key="fxGlow"
							anchor={0.5}
							x={head.x}
							y={head.y}
							tint={line.color}
							blendMode="add"
							width={46}
							height={46}
							alpha={0.9}
						/>
					{/if}
				{/if}
			{/each}
		</Container>
	</BoardContainer>
{/if}
