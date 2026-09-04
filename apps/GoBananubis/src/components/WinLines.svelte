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
	import { Graphics, Container } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBet } from 'state-shared';
	import { waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import GrenadeRunner from './GrenadeRunner.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, REEL_PADDING, BOARD_DIMENSIONS } from '../game/constants';
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
	};

	// volley timings — every winning line runs at once, staggered just enough
	// that the eye can separate them
	const NORMAL = { entry: 80, travel: 540, settle: 140, stagger: 28 };
	const FAST = { entry: 30, travel: 210, settle: 60, stagger: 12 };
	const HOLD_AFTER_MS = 220;

	// A symbol's win spine runs 1.4s (design/generate_spines.mjs). The volley is
	// far shorter than that in the free game — ~300ms of runners plus a 220ms hold
	// — so winLinesHide arrived while the winning symbols were about a third of
	// the way in, and the next spin wiped them before the pop registered.
	//
	// The expanded-wild panel never had this problem: it carries its own ~1.1s
	// Tween envelope that runs to completion regardless of when the lines are
	// hidden (see ExpandingWilds.winLinesShow). So a free spin could show a
	// brightly lit wild reel sitting next to dead symbols on the very reels
	// feeding the line — which is exactly how it was reported.
	//
	// Hold until the last symbol to start has had most of its animation. Not the
	// full 1.4s: the pop has clearly read by then, and every extra millisecond
	// here is paid on every winning spin of an 18-spin feature.
	const WIN_ANIM_VISIBLE_MS = 950;

	let lines = $state<ActiveLine[]>([]);
	let show = $state(false);
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
				!animatedKeys.has(posKey(p)),
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
			// when the last grenade reaches its final reel — i.e. when the last
			// symbol's win animation starts
			const lastSymbolStartMs = Math.max(
				...built.map((line) => line.delay + timing.entry + line.travelMs),
			);
			// Turbo opts out of the extended hold: there the player has asked for
			// speed and a clipped win animation is the trade they made.
			const holdMs = stateBet.isTurbo
				? HOLD_AFTER_MS
				: Math.max(HOLD_AFTER_MS, lastSymbolStartMs + WIN_ANIM_VISIBLE_MS - volleyMs);
			await waitForTimeout(volleyMs);
			// cancelled while the volley ran — do not touch the board
			if (generation !== showGeneration) return;

			// Safety net, and it runs BEFORE the hold, not after it.
			//
			// A runner reports each reel as it crosses it, and anything it misses —
			// a dropped frame, a line whose geometry rounds a reel away — lands here
			// instead. That was already true, but the call sat after the hold had
			// elapsed, which meant a missed symbol started its 1.4s win spine at the
			// exact moment winLinesHide fired and the round moved on. It was being
			// animated and never seen, which is indistinguishable from never being
			// animated: the reported symptom is one reel of a winning line staying
			// dark while the rest light up.
			//
			// Moved here, a missed symbol gets the whole hold to play in, the same
			// as one the runner did reach. animatedKeys makes this a no-op for
			// everything already lit, so the wake choreography is untouched.
			animatePositions(wins.flatMap((win) => win.positions));

			await waitForTimeout(holdMs);
			if (generation !== showGeneration) return;
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
			const stroke = (w: number, color: number, alpha: number) => {
				g.lineStyle(w * width, color, alpha);
				g.moveTo(drawn[0].x, drawn[0].y);
				for (let i = 1; i < drawn.length; i++) g.lineTo(drawn[i].x, drawn[i].y);
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
				<GrenadeRunner
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
		</Container>
	</BoardContainer>
{/if}
