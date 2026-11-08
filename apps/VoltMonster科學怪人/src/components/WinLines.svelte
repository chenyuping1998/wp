<script lang="ts" module>
	export type EmitterEventWinLines =
		| { type: 'winLinesShow'; wins: WinLineData[]; fast?: boolean }
		| { type: 'winLinesHide' }
		| { type: 'winLinesClear' };

	// One winning PAYLINE. `win` is in book units (hundredths of the bet).
	export type WinLineData = {
		lineIndex: number;
		symbol: string;
		kind: number;
		win: number;
		positions: { reel: number; row: number }[];
		symbolCount: number;
	};
</script>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Container, Graphics, Text } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { featureTimeScale } from '../game/timeScale';
	import { stateGame } from '../game/stateGame.svelte';
	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { SYMBOL_SIZE, REEL_PADDING, BOARD_DIMENSIONS } from '../game/constants';
	import config from '../game/config';

	const context = getContext();

	// The reference (2026-11-06 recording) draws every paying line at once,
	// dims the rest of the board, and prints each line's amount on the cell the
	// line starts from. Volt uses narrow cyan conductors, copper contact nodes
	// and a steel amount pill; the symbol artwork remains readable underneath.
	const REVEAL_STAGGER = { normal: 90, fast: 40 };
	const HOLD_AFTER_MS = 220;
	const WIN_ANIM_VISIBLE_MS = 950;

	let wins = $state<WinLineData[]>([]);
	// the glint's clock, from the moment the lines start
	let glint = $state(-1);
	let glintTimer: ReturnType<typeof setInterval> | undefined;
	const startGlint = () => {
		clearInterval(glintTimer);
		const t0 = performance.now();
		glint = 0;
		glintTimer = setInterval(() => {
			glint = (performance.now() - t0) / 1000;
			if (glint > 1.6) {
				clearInterval(glintTimer);
				glint = -1;
			}
		}, 33);
	};
	onDestroy(() => clearInterval(glintTimer));
	let labelWidths = $state<Record<string, number>>({});
	let revealedReels = $state(0);
	let show = $state(false);

	// payline rows are 0..rows-1; the padded board puts them at 1..rows
	const cx = (reel: number) => SYMBOL_SIZE * (reel + REEL_PADDING);
	const cy = (paylineRow: number) => -SYMBOL_SIZE + (paylineRow + 1 + 0.5) * SYMBOL_SIZE;
	const paylines = (config as unknown as { paylines: Record<string, number[]> }).paylines;

	const litCells = $derived.by(() => {
		const set = new Set<string>();
		for (const win of wins) {
			for (const p of win.positions) {
				if (p.row >= 1 && p.row <= BOARD_DIMENSIONS.y && p.reel < revealedReels) {
					set.add(`${p.reel},${p.row}`);
				}
			}
		}
		return set;
	});

	// The amount label sits on the line's first cell; two lines starting on the
	// same cell share one label with their sum, so labels never stack.
	const labels = $derived.by(() => {
		const byCell = new Map<string, { x: number; y: number; win: number }>();
		for (const w of wins) {
			const first = w.positions[0];
			if (!first) continue;
			const key = `${first.reel},${first.row}`;
			const prev = byCell.get(key);
			if (prev) prev.win += w.win;
			else byCell.set(key, { x: cx(first.reel), y: -SYMBOL_SIZE + (first.row + 0.5) * SYMBOL_SIZE, win: w.win });
		}
		return [...byCell.values()];
	});

	let animatedKeys = new Set<string>();
	const posKey = (p: { reel: number; row: number }) => `${p.reel},${p.row}`;
	let generation = 0;

	const animatePositions = (positions: { reel: number; row: number }[]) => {
		const fresh = positions.filter(
			(p) => p.row >= 1 && p.row <= BOARD_DIMENSIONS.y && !animatedKeys.has(posKey(p)),
		);
		if (fresh.length === 0) return;
		for (const p of fresh) animatedKeys.add(posKey(p));
		context.eventEmitter.broadcast({ type: 'boardWithAnimateSymbols', symbolPositions: fresh });
	};

	const reset = () => {
		generation += 1;
		show = false;
		wins = [];
		revealedReels = 0;
	};

	context.eventEmitter.subscribeOnMount({
		winLinesShow: async ({ wins: incoming, fast }) => {
			const mine = ++generation;
			animatedKeys = new Set();
			revealedReels = 0;

			const usable = incoming.filter((w) => w.positions.length > 0);
			if (usable.length === 0) return;

			wins = usable;
			show = true;
			startGlint();
			context.eventEmitter.broadcast({ type: 'boardShow' });

			const stagger = fast || stateBet.isTurbo ? REVEAL_STAGGER.fast : REVEAL_STAGGER.normal;
			const lastReel = Math.max(...usable.flatMap((w) => w.positions.map((p) => p.reel)));

			for (let reel = 0; reel <= lastReel; reel++) {
				revealedReels = reel + 1;
				animatePositions(usable.flatMap((w) => w.positions.filter((p) => p.reel === reel)));
				await waitForTimeout(stagger);
				if (mine !== generation) return;
			}
			animatePositions(usable.flatMap((w) => w.positions));

			const elapsed = (lastReel + 1) * stagger;
			const hold = !stateBet.isTurbo
				? Math.max(HOLD_AFTER_MS, WIN_ANIM_VISIBLE_MS - elapsed)
				: context.stateGame.gameType === 'freegame'
					? Math.max(HOLD_AFTER_MS, WIN_ANIM_VISIBLE_MS / featureTimeScale() - elapsed)
					: HOLD_AFTER_MS;
			await waitForTimeout(hold);
			if (mine !== generation) return;
		},
		winLinesHide: reset,
		boardWinAnimCancel: reset,
		winLinesClear: () => {
			generation += 1;
			wins = [];
			revealedReels = 0;
		},
	});

	$effect(() => {
		stateGame.winLitCells = show && wins.length > 0 ? [...litCells] : null;
	});

	// Lines grow left to right with the wake, so they arrive with the symbols.
	const K = SYMBOL_SIZE / 118; // sizes below are for the 118 px cell
	const TURQ = 0x4ff0c8;
	const CREAM = 0xeafff9;
	const SCORCH = 0x1b2430;
	const SAND = 0xc47a3a;

	const linePoints = (w: WinLineData) => {
		const rows = paylines[String(w.lineIndex)];
		if (!rows) return [];
		const upto = Math.min(rows.length, Math.max(revealedReels, 1));
		const pts = rows.slice(0, upto).map((row, reel) => ({ x: cx(reel), y: cy(row) }));
		if (upto < rows.length && upto >= 1) {
			// half a step towards the next reel, so the line visibly travels
			pts.push({ x: (cx(upto - 1) + cx(upto)) / 2, y: (cy(rows[upto - 1]) + cy(rows[upto])) / 2 });
		}
		return pts;
	};

	/** points every `step` px along a polyline, with the local direction */
	const along = (pts: { x: number; y: number }[], step: number, from = 0) => {
		const out: { x: number; y: number; ux: number; uy: number; s: number }[] = [];
		let walked = 0;
		let next = from;
		for (let i = 0; i < pts.length - 1; i++) {
			const dx = pts[i + 1].x - pts[i].x;
			const dy = pts[i + 1].y - pts[i].y;
			const len = Math.hypot(dx, dy) || 1;
			while (next <= walked + len) {
				const k = (next - walked) / len;
				out.push({ x: pts[i].x + dx * k, y: pts[i].y + dy * k, ux: dx / len, uy: dy / len, s: next });
				next += step;
			}
			walked += len;
		}
		return out;
	};
	const pathLength = (pts: { x: number; y: number }[]) =>
		pts.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0);

	const drawLines = (g: PixiGraphics) => {
		g.clear();
		const thin = (wins.length >= 6 ? 0.75 : 1) * K;
		const stroke = (pts: { x: number; y: number }[], width: number, color: number, alpha: number) => {
			g.moveTo(pts[0].x, pts[0].y);
			for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
			g.stroke({ width: width * thin, color, alpha, cap: 'round', join: 'round' });
		};
		const lines = wins.map(linePoints).filter((pts) => pts.length >= 2);
		// Narrow electric conductors leave the actual winning artwork visible.
		for (const pts of lines) {
			stroke(pts, 18, TURQ, 0.08);
			stroke(pts, 9, TURQ, 0.22);
		}
		for (const pts of lines) {
			stroke(pts, 4.5, TURQ, 0.85);
			stroke(pts, 1.8, CREAM, 0.95);
			// the glint: one bright run along the strip, once
			if (glint >= 0) {
				const len = pathLength(pts);
				const head = glint * 900 * K;
				if (head - 60 * K < len) {
					const seg = along(pts, 4 * thin, Math.max(0, head - 60 * K)).filter((q) => q.s <= head);
					if (seg.length >= 2) stroke(seg, 3.8, 0xffffff, 0.75);
				}
			}
		}
		// a bead on every winning cell the wake has reached
		for (const cell of litCells) {
			const [reel, row] = cell.split(',').map(Number);
			const x = cx(reel);
			const y = -SYMBOL_SIZE + (row + 0.5) * SYMBOL_SIZE;
			g.circle(x, y, 6.5 * K);
			g.fill({ color: SCORCH });
			g.stroke({ width: 1.8 * K, color: SAND });
			g.circle(x, y, 3.5 * K);
			g.fill({ color: TURQ });
			g.circle(x - 1.8 * K, y - 1.8 * K, 1.8 * K);
			g.fill({ color: 0xffffff, alpha: 0.8 });
		}
	};

	/** the cartouche behind an amount: a sandstone pill, a bar closing its right end */
	const drawCartouche = (g: PixiGraphics, w: number) => {
		g.clear();
		const h = SYMBOL_SIZE * 0.25;
		const width = w + h * 0.9;
		g.roundRect(-width / 2, -h / 2, width, h, h / 2);
		g.fill({ color: SCORCH });
		g.stroke({ width: 2.5 * K, color: SAND });
		g.roundRect(-width / 2 + 3 * K, -h / 2 + 3 * K, width - 6 * K, h - 6 * K, h / 2 - 3 * K);
		g.stroke({ width: 1.2 * K, color: CREAM, alpha: 0.7 });
		g.rect(width / 2 - 1 * K, -h * 0.34, 4 * K, h * 0.68);
		g.fill({ color: TURQ });
	};
</script>

{#if show && wins.length > 0}
	<BoardContainer>
		<Container zIndex={10}>
			<Graphics draw={drawLines} />
			{#if revealedReels > 0}
				{#each labels as label (`${label.x},${label.y}`)}
					{@const key = `${label.x},${label.y}`}
					<Container x={label.x} y={label.y}>
						<Graphics draw={(g: PixiGraphics) => drawCartouche(g, labelWidths[key] ?? SYMBOL_SIZE * 0.5)} />
						<Text
							text={bookEventAmountToCurrencyString(label.win)}
							anchor={{ x: 0.5, y: 0.5 }}
							y={1}
							onresize={({ width }) => {
								if (Math.abs((labelWidths[key] ?? 0) - width) > 0.5) labelWidths = { ...labelWidths, [key]: width };
							}}
							style={{
								fontFamily: GAME_FONT,
								fontWeight: GAME_FONT_WEIGHT,
								fontSize: SYMBOL_SIZE * 0.17,
								fill: 0xeafff9,
							}}
						/>
					</Container>
				{/each}
			{/if}
		</Container>
	</BoardContainer>
{/if}
