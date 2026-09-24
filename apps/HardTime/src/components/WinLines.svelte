<script lang="ts" module>
	export type EmitterEventWinLines =
		| { type: 'winLinesShow'; wins: WinLineData[]; fast?: boolean }
		| { type: 'winLinesHide' }
		| { type: 'winLinesClear' };

	export type WinLineData = {
		lineIndex: number;
		positions: { reel: number; row: number }[];
		symbolCount: number;
		/** book units (100 = 1x bet), already multiplied by any Neon Frames */
		win?: number;
		/** the Frame multiplier that applied to this line, 1 when none did */
		multiplier?: number;
	};
</script>

<script lang="ts">
	import { Graphics, Container } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import WinLineRunner from './WinLineRunner.svelte';
	import GoldText from './GoldText.svelte';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, REEL_PADDING, BOARD_DIMENSIONS } from '../game/constants';
	import config from '../game/config';

	const context = getContext();

	// One warm family, not a rainbow. Lines still have to be told apart when four
	// of them light at once, so this varies VALUE and TEMPERATURE — pale gold,
	// cream, bronze, copper, wine, smoke — rather than hue. The 35-entry set this
	// replaces ran cyan, mint, magenta, violet and lime across a board whose whole
	// palette is gold on near-black; a three-line win drew a rainbow over it, which
	// is the "too colourful, looks messy" note in the first place.
	//
	// Only 14 are ever used (config.paylines), but the list is longer so the
	// modulo below never wraps onto an adjacent index.
	const LINE_COLORS = [
		0xd6d8d8, 0xb8c7cf, 0xb8ad95, 0x8e9499, 0x76513b,
		0xa8323c, 0xc85a4a, 0xe0a07a, 0xfff3d0, 0x9aa0a6,
		0xc3cbd1, 0xd8b24a, 0xefc978, 0xbf7a3c, 0x8f9a7e,
		0xdcc9a0, 0xa67c52, 0xf0d9a8,
	];

	// deterministic per-line jitter: same line always moves the same way, but no
	// two lines in a volley share an exact speed or start — identical timings
	// across every runner is the giveaway that a machine laid them out
	const jitter = (lineIndex: number, spread: number) => {
		const h = Math.sin(lineIndex * 12.9898) * 43758.5453;
		return 1 + (h - Math.floor(h) - 0.5) * 2 * spread;
	};

	type Point = { x: number; y: number };
	type ActiveLine = {
		lineIndex: number;
		color: number;
		points: Point[];
		positions: { reel: number; row: number }[];
		delay: number;
		travelMs: number;
		done: boolean;
		/** what this line paid, and where to say so */
		win?: number;
		multiplier?: number;
		plate?: Point;
	};

	// volley timings — every winning line runs at once, staggered just enough
	// that the eye can separate them
	const NORMAL = { entry: 80, travel: 540, settle: 140, stagger: 28 };
	const FAST = { entry: 30, travel: 210, settle: 60, stagger: 12 };
	const HOLD_AFTER_MS = 220;

	// The value plate. Sized against the 118px cell: wide enough for a five-digit
	// currency string at 26px, short enough to leave the symbol underneath
	// readable, since the point is to label that symbol rather than cover it.
	const PLATE = { w: 104, h: 40, r: 10 };

	let lines = $state<ActiveLine[]>([]);
	let show = $state(false);
	// debug bookkeeping for __HM_LINES__ (see stateGame.debugWinLineCount)
	$effect(() => {
		context.stateGame.debugWinLineCount = show ? lines.length : 0;
	});
	let timing = $state(NORMAL);
	// tick forces the trail Graphics to redraw while the runners move
	let tick = $state(0);
	let tickRaf = 0;
	// crossing progress per line, 0..1, mirrors each grenade's travel
	let crossed = $state<Record<number, number>>({});

	const lineScale = $derived(lines.length >= 6 ? 0.7 : 1);

	// Symbol centre X: same formula as getSymbolX in utils.ts
	const symbolCenterX = (reel: number) => SYMBOL_SIZE * (reel + REEL_PADDING);
	// Payline rows (0..4) map to padded array indices (1..5)
	const symbolCenterYFromPayline = (paylineRow: number) =>
		-SYMBOL_SIZE + (paylineRow + 1 + 0.5) * SYMBOL_SIZE;

	// ── symbols light up in the grenade's wake ────────────────────────────────
	// A position may sit on several winning lines; animating the same one twice
	// re-assigns symbolState='win' without retriggering the effect and the game
	// would hang waiting for a completion that never fires. Dedupe per volley.
	let animatedKeys = new Set<string>();
	const posKey = (p: { reel: number; row: number }) => `${p.reel},${p.row}`;

	// Bumped by every show, hide and clear. winLinesShow awaits the whole volley
	// before running its safety-net animation, so without this that trailing call
	// still fires after the volley has been cancelled — and since the idle replay
	// can be interrupted mid-volley by the player spinning, it would scatter win
	// animations across a board that is already spinning again.
	let showGeneration = 0;

	const animatePositions = (positions: { reel: number; row: number }[]) => {
		const fresh = positions.filter(
			(p) =>
				p.row >= 1 &&
				p.row <= BOARD_DIMENSIONS.y &&
				!animatedKeys.has(posKey(p)) &&
				// A reel taken over by an expanded wild is presented as ONE panel.
				// Animating the individual W symbols hidden underneath made them
				// scale up out from behind the takeover plate, so the reel read as
				// two stacked layers and the win looked like it came from the
				// symbols below rather than the wild itself. ExpandingWilds reacts
				// to winLinesShow for these reels instead.
				!context.stateGame.stickyWildReels.includes(p.reel),
		);
		if (fresh.length === 0) return;
		for (const p of fresh) animatedKeys.add(posKey(p));
		context.eventEmitter.broadcast({ type: 'boardWithAnimateSymbols', symbolPositions: fresh });
	};

	const onGrenadeReel = (line: ActiveLine, reelIndex: number) => {
		crossed[line.lineIndex] = Math.max(
			crossed[line.lineIndex] ?? 0,
			reelIndex / Math.max(1, line.points.length - 1),
		);
		animatePositions(line.positions.filter((p) => p.reel === reelIndex));
	};

	const startTicker = () => {
		cancelAnimationFrame(tickRaf);
		const step = () => {
			tick++;
			if (show) tickRaf = requestAnimationFrame(step);
		};
		tickRaf = requestAnimationFrame(step);
	};

	context.eventEmitter.subscribeOnMount({
		winLinesShow: async ({ wins, fast }) => {
			const generation = ++showGeneration;
			animatedKeys = new Set();
			crossed = {};
			timing = fast || stateBet.isTurbo ? FAST : NORMAL;

			const built: ActiveLine[] = [];
			wins.forEach((win, index) => {
				const paylineRows: number[] = (config.paylines as Record<string, number[]>)[
					String(win.lineIndex)
				];
				if (!paylineRows) return;
				built.push({
					lineIndex: win.lineIndex,
					color: LINE_COLORS[(win.lineIndex - 1) % LINE_COLORS.length],
					points: paylineRows.map((row, reel) => ({
						x: symbolCenterX(reel),
						y: symbolCenterYFromPayline(row),
					})),
					positions: win.positions,
					win: win.win,
					multiplier: win.multiplier,
					// The value is said at the LAST cell of the line, which is where
					// the eye already is when the runner finishes and where the line
					// stops — saying it at the start would put the number under the
					// runner for the whole crossing.
					plate: (() => {
						const cells = win.positions.filter((p) => p.row >= 1 && p.row <= BOARD_DIMENSIONS.y);
						const last = cells[cells.length - 1];
						if (!last) return undefined;
						// Lifted clear of the symbol's face rather than centred on it: the
						// plate names that symbol, so covering it defeats the point.
						return {
							x: symbolCenterX(last.reel),
							y: symbolCenterYFromPayline(last.row - 1) - SYMBOL_SIZE * 0.3,
						};
					})(),
					// stagger drifts a little and each grenade rolls at its own pace
					delay: index * timing.stagger * jitter(win.lineIndex, 0.35),
					travelMs: timing.travel * jitter(win.lineIndex + 7, 0.08),
					done: false,
				});
			});
			if (built.length === 0) return;

			lines = built;
			show = true;
			context.eventEmitter.broadcast({ type: 'boardShow' });
			startTicker();

			const volleyMs = Math.max(
				...built.map((line) => line.delay + timing.entry + line.travelMs + timing.settle),
			);
			await waitForTimeout(volleyMs + HOLD_AFTER_MS);
			// cancelled while the volley ran — do not touch the board
			if (generation !== showGeneration) return;

			// safety net: anything the runners missed (padding rows are skipped by
			// design) still gets its win animation before the round moves on
			animatePositions(wins.flatMap((win) => win.positions));
		},
		winLinesHide: () => {
			showGeneration += 1;
			show = false;
			lines = [];
			crossed = {};
			cancelAnimationFrame(tickRaf);
		},
		winLinesClear: () => {
			showGeneration += 1;
			lines = [];
			crossed = {};
		},
	});

	// walk the polyline up to `p` of total length and return the drawn portion
	const pathAt = (points: Point[], p: number) => {
		if (p >= 1) return points;
		const lengths = points.slice(1).map((pt, i) => Math.hypot(pt.x - points[i].x, pt.y - points[i].y));
		const total = lengths.reduce((sum, l) => sum + l, 0);
		let want = total * Math.max(0, p);
		const out = [points[0]];
		for (let i = 0; i < lengths.length; i++) {
			if (want >= lengths[i]) {
				out.push(points[i + 1]);
				want -= lengths[i];
				continue;
			}
			const f = lengths[i] === 0 ? 0 : want / lengths[i];
			out.push({
				x: points[i].x + (points[i + 1].x - points[i].x) * f,
				y: points[i].y + (points[i + 1].y - points[i].y) * f,
			});
			break;
		}
		return out;
	};

	const drawTrails = (g: PixiGraphics) => {
		tick; // redraw every frame while the volley runs
		g.clear();
		const width = lines.length >= 6 ? 0.72 : 1;
		for (const line of lines) {
			const p = line.done ? 1 : (crossed[line.lineIndex] ?? 0);
			if (p <= 0) continue;
			const drawn = pathAt(line.points, p);
			if (drawn.length < 2) continue;
			// Pixi 8: build the path, THEN stroke it. `lineStyle` is the v7 call and
			// only sets state — under v8 the path is never rendered, so these four
			// trails drew nothing at all. That is why the win-line runner had never
			// been seen animating: its particle sprites were on screen, the line it
			// was supposed to be drawing behind them was not.
			const stroke = (w: number, color: number, alpha: number) => {
				g.moveTo(drawn[0].x, drawn[0].y);
				for (let i = 1; i < drawn.length; i++) g.lineTo(drawn[i].x, drawn[i].y);
				g.stroke({ width: w * width, color, alpha });
			};
			// scorch underlay: reads as a burn mark where the line crosses the
			// gold expanding-wild panel, and all but disappears over the dark board
			stroke(11, 0x1a1206, 0.5);
			stroke(7, line.color, 0.22);
			stroke(3, line.color, 0.95);
			stroke(1.2, 0xffffff, 0.5);
		}
	};
</script>

{#if show && lines.length > 0}
	<BoardContainer>
		<Container zIndex={10}>
			<Graphics draw={drawTrails} />
			{#each lines as line (line.lineIndex)}
				<WinLineRunner
					points={line.points}
					color={line.color}
					delay={line.delay}
					scale={lineScale}
					entryMs={timing.entry}
					travelMs={line.travelMs}
					settleMs={timing.settle}
					onreel={(reelIndex) => onGrenadeReel(line, reelIndex)}
					oncomplete={() => {
						line.done = true;
						crossed[line.lineIndex] = 1;
					}}
				/>
			{/each}
			<!--
				What the line actually paid, said on the board.

				Only after the runner has crossed (`done`), so the number arrives as
				the payoff of the crossing rather than sitting there through it. The
				plate is drawn over the last winning cell, tinted with the line's own
				colour so a board with four lines on it can still be read line by
				line, and it carries the Frame multiplier when one applied — that is
				the one number a player cannot derive from the pay table.
			-->
			{#each lines.filter((line) => line.done && line.win && line.plate) as line (`v${line.lineIndex}`)}
				<Container x={line.plate!.x} y={line.plate!.y} zIndex={20}>
					<Graphics
						draw={(g) => {
							g.clear();
							g.roundRect(-PLATE.w / 2, -PLATE.h / 2, PLATE.w, PLATE.h, PLATE.r);
							g.fill({ color: 0x140a24, alpha: 0.88 });
							g.roundRect(-PLATE.w / 2, -PLATE.h / 2, PLATE.w, PLATE.h, PLATE.r);
							g.stroke({ width: 2, color: line.color, alpha: 0.95 });
						}}
					/>
					<GoldText
						text={bookEventAmountToCurrencyString(line.win!)}
						fontSize={26}
						maxWidth={PLATE.w - 12}
						y={(line.multiplier ?? 1) > 1 ? -9 : 0}
					/>
					{#if (line.multiplier ?? 1) > 1}
						<GoldText text={`x${line.multiplier}`} fontSize={20} maxWidth={PLATE.w - 20} y={13} />
					{/if}
				</Container>
			{/each}
		</Container>
	</BoardContainer>
{/if}
