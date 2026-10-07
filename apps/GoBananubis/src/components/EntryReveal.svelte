<script lang="ts">
	/**
	 * Entry reveal, played once when the loading screen hands over: THE BOARD
	 * RISES OUT OF THE TOMB FLOOR, shedding the sand it was buried in.
	 *
	 *   0 -> RISE      the whole board — housing, reels, everything laid out
	 *                  off boardLayout — comes up from below the screen, sand
	 *                  rushing off it (sand_pour), and slows as it clears the floor.
	 *                  Sand is thrown off its top edge and runs off its sides
	 *                  as it comes (SandShed)
	 *   RISE -> SEAT   it overshoots its place by a few px, hangs, and drops
	 *                  into it: the housing takes the knock, dust bursts out at
	 *                  its foot on both sides, and sand keeps running down its
	 *                  sides for a second after, thinning out
	 *
	 * It used to be a white pop and five flat dark columns fading left to
	 * right — the template's reveal. Go Bananas Boat opens with a tarp yanked
	 * off its board; this one is the tomb giving the board up.
	 *
	 * The lift is stateGame.boardLift, so nothing else needed changing; the
	 * gorilla does not ride it (Mascot), he is standing on the floor it rises
	 * out of. Clocked on setInterval, not the frame loop: in a background tab
	 * rAF stops, and a board stuck halfway up the screen would stay there.
	 */
	import { onMount } from 'svelte';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import SandShed from './SandShed.svelte';

	const RISE_MS = 720;
	const SETTLE_MS = 200;
	const SEAT_MS = RISE_MS + SETTLE_MS;
	const OVERSHOOT = 14;
	const T_TOTAL = SEAT_MS + 1500;
	// BoardFrame draws the housing at 1.28x the board
	const FRAME_SCALE = 1.28;

	const context = getContext();

	// where the board will rest, and how far below that it starts: its housing's
	// top just under the bottom of the screen
	const rest = () => {
		const board = context.stateGameDerived.boardLayout();
		const y = board.y - context.stateGame.boardLift;
		const halfH = (board.height * board.scale * FRAME_SCALE) / 2;
		const halfW = (board.width * board.scale * FRAME_SCALE) / 2;
		const screenH = context.stateLayoutDerived.mainLayout().height;
		return { x: board.x, y, halfW, halfH, start: screenH - (y - halfH) + 30 };
	};

	const easeOut = (p: number) => 1 - (1 - p) ** 3;
	const liftAt = (t: number, start: number) => {
		if (t <= 0) return start;
		if (t < RISE_MS) {
			// up from below, slowing, to a few px above its place
			const p = easeOut(t / RISE_MS);
			return start + (-OVERSHOOT - start) * p;
		}
		if (t < SEAT_MS) {
			// hangs, then drops into its seat
			const q = (t - RISE_MS) / SETTLE_MS;
			return -OVERSHOOT * (1 - q * q);
		}
		return 0;
	};

	// set before the first frame, so the board is never seen in its place first
	context.stateGame.boardLift = rest().start;

	let t = $state(0);
	let seated = $state(false);
	let done = $state(false);

	onMount(() => {
		const { start } = rest();
		const started = Date.now();
		// SAND ONLY. It used to be the seal's strain and the tablet crack, and the
		// crack ends on a marimba note (it names a revealed symbol) — on the
		// opening that read as a win before the first spin.
		context.eventEmitter.broadcast({ type: 'soundSandPour' });
		const id = setInterval(() => {
			t = Date.now() - started;
			context.stateGame.boardLift = liftAt(t, start);
			if (!seated && t >= SEAT_MS) {
				seated = true;
				context.stateGame.boardLift = 0;
				context.eventEmitter.broadcast({ type: 'boardFrameImpact', strength: 1, from: [0, 1.2] });
			}
			if (t >= T_TOTAL) {
				done = true;
				clearInterval(id);
			}
		}, 16);
		return () => {
			clearInterval(id);
			context.stateGame.boardLift = 0;
		};
	});

	// the housing's edges right now, for the sand
	const frame = $derived.by(() => {
		const r = rest();
		return { x: r.x, y: r.y + context.stateGame.boardLift, halfW: r.halfW, halfH: r.halfH };
	});
	// how fast it is coming up, px/ms (negative = up), for what it throws off
	const riseSpeed = $derived.by(() => {
		if (t >= RISE_MS) return 0;
		const { start } = rest();
		return (liftAt(t + 8, start) - liftAt(t - 8, start)) / 16;
	});
</script>

{#if !done}
	<MainContainer>
		<SandShed {frame} {t} riseSpeed={riseSpeed} seatAt={SEAT_MS} rising={t < RISE_MS} />
	</MainContainer>
{/if}
