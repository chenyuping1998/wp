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

	// NOTE: this deliberately carries no win amount and no multiplier.
	//
	// An earlier pass drew a value plate on the last cell of every winning line,
	// ported from Hot Miami, where it answers a review finding — a game whose
	// maths was provably right had "symbol payouts do not match the paytable"
	// opened on it because nothing on screen named which line paid what.
	//
	// Removed at the user's direction on 2026-09-13: no numbers are to be drawn on
	// the lines. If that finding ever comes back, the answer here has to be
	// something other than a figure on the board — the win readout and the pay
	// table are where the numbers live.
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
	import { LINE_SHADOW } from '../game/palette';
	import config from '../game/config';

	const context = getContext();

	// ONE COLOUR FOR EVERY LINE.
	//
	// This was a 35-entry table of saturated hues, one per payline, and the
	// argument for it was legibility: a volley can put four or five runners on the
	// board at once and hue was what told them apart. With fifteen paylines the
	// result was a board of pink, lime, orange and violet all at once, which is
	// what "太花" means and it is a fair call — the game is a cold one and that
	// table was the loudest thing left in it.
	//
	// What separates the lines now is everything the table was carrying on top of:
	// each runner starts at its own moment (`delay`), crosses at its own pace
	// (`travelMs`), and the trail is drawn only as far as its own runner has got.
	// Two lines that share a cell still arrive there at different times. What is
	// genuinely lost is telling apart two lines a player is looking at AFTER both
	// have finished — that is the price, and it was paid deliberately.
	//
	// Ice rather than white: pure white on a slate board is the same value as the
	// win-symbol highlights and the two stopped being separable in the one moment
	// they overlap. The white is kept for the hairline core below, where it reads
	// as the lit centre of a cold line rather than as a second object.
	const LINE_COLOR = 0x8fd9ff;

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
			// Pixi 8: build the path, THEN stroke it.
			//
			// `lineStyle` survives in v8 only as a deprecation shim
			// (scene/graphics/shared/Graphics.mjs:298) and all it does is assign
			// `context.strokeStyle` — it does NOT emit any geometry. In v7 the
			// moveTo/lineTo that followed were stroked as they were issued; in v8
			// nothing is drawn until `.stroke()` is called, and this function never
			// called it. So all four trails of every win line drew NOTHING.
			//
			// That is why the grenade had never been seen leaving a line behind it:
			// the runner's sprite was on screen, the line it was supposed to be
			// drawing was not. Inherited from Go Bananas 100, where it is still
			// live — see HANDOFF.md.
			const stroke = (w: number, color: number, alpha: number) => {
				g.moveTo(drawn[0].x, drawn[0].y);
				for (let i = 1; i < drawn.length; i++) g.lineTo(drawn[i].x, drawn[i].y);
				g.stroke({ width: w * width, color, alpha });
			};
			// Shadow underlay: separates the line from whatever it crosses, and all
			// but disappears over the dark board.
			//
			// Was 0x1a1206, a brown scorch mark meant to read as a burn across the
			// gold expanding-wild panel. On this front a burn is the wrong idea and
			// a warm brown is the wrong colour, so it is the board's own darkness
			// instead — the line casts a shadow rather than charring anything.
			stroke(11, LINE_SHADOW, 0.5);
			stroke(7, LINE_COLOR, 0.22);
			stroke(3, LINE_COLOR, 0.95);
			// the lit core: white, and the only white in the line. At 1.2px it is a
			// hairline down the middle of the ice rather than a second stroke.
			stroke(1.2, 0xffffff, 0.55);
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
					color={LINE_COLOR}
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
