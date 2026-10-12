<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { getContext } from '../game/context';

	// The stage curtain lowers as a single illustrated object. The scene changes
	// while it covers the viewport, then the same object rises. Keep the throw
	// and cover timing together so the cast does not change during the throw.
	type Props = {
		oncomplete: () => void;
		// Fired while the doors are fully shut. Swap scenes here.
		oncover?: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	// the skeleton's 'throwit' (design/generate_monkey_spine.mjs): the plate
	// leaves his hand at ~0.58s and the clip and its mix back end by ~1.4s
	const THROW_RELEASE_MS = 580;
	const THROW_DONE_MS = 1400;
	const FLIGHT_MS = 520;

	const throwing = context.stateGame.mascotThrowOrigin !== null;
	const LEAD_MS = throwing ? THROW_RELEASE_MS : 0;
	const SHUT_MS = 560; // doors sliding in
	const HOLD_MIN_MS = 380; // shut: the swap happens in here
	const OPEN_MS = 620;
	const COVER_AT = Math.max(LEAD_MS + SHUT_MS + HOLD_MIN_MS * 0.4, throwing ? THROW_DONE_MS : 0);
	const HOLD_MS = Math.max(HOLD_MIN_MS, COVER_AT + HOLD_MIN_MS * 0.6 - LEAD_MS - SHUT_MS);
	const TOTAL_MS = LEAD_MS + SHUT_MS + HOLD_MS + OPEN_MS;
	// the landing sound and small rebound near the end of the drop
	const CLACK_AT = 0.86;

	let elapsed = $state(0);
	let coverFired = false;
	let completed = false;

	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

	// 0 = open (doors off the screen edges), 1 = shut
	const shut = $derived.by(() => {
		const t = elapsed - LEAD_MS;
		if (t < 0) return 0;
		if (t < SHUT_MS) {
			const k = t / SHUT_MS;
			// pushed hard, so it accelerates, then rebounds a little off the
			// other door
			if (k > CLACK_AT) return 1 - Math.sin(((k - CLACK_AT) / (1 - CLACK_AT)) * Math.PI) * 0.03;
			const e = k / CLACK_AT;
			return e * e;
		}
		if (t < SHUT_MS + HOLD_MS) return 1;
		const k = Math.min(1, (t - SHUT_MS - HOLD_MS) / OPEN_MS);
		// slid open by hand: slow start, then it runs
		return 1 - k * k * (3 - 2 * k);
	});

	let slid = false;
	let clacked = false;
	let opened = false;
	$effect(() => {
		if (!slid && elapsed >= LEAD_MS) {
			slid = true;
			context.eventEmitter.broadcast({ type: 'soundDoorSlide' });
		}
		if (!clacked && elapsed >= LEAD_MS + SHUT_MS * CLACK_AT) {
			clacked = true;
			context.eventEmitter.broadcast({ type: 'soundDoorClack' });
		}
		if (!opened && elapsed >= LEAD_MS + SHUT_MS + HOLD_MS) {
			opened = true;
			context.eventEmitter.broadcast({ type: 'soundDoorOpen' });
		}
	});
	// the front settles briefly when it lands
	const jolt = $derived.by(() => {
		const t = elapsed - LEAD_MS - SHUT_MS * CLACK_AT;
		if (t < 0 || t > 220) return 0;
		return Math.sin(t / 20) * 7 * (1 - t / 220);
	});

	// The art is one complete menu front or curtain. Size it beyond both
	// viewport edges, then lower it as one object so no mirrored centre seam
	// or repeated illustration appears during the scene swap.
	const doorScale = $derived(Math.max(canvas.width / 1400, canvas.height / 1080) * 1.04);
	const door = $derived({ width: 1400 * doorScale, height: 1080 * doorScale });
	const doorY = $derived(canvas.height / 2 - (1 - shut) * (canvas.height / 2 + door.height / 2 + 24));

	// The plate, in main-layout coordinates: from his hand to the board's centre
	// on a high arc, spinning, read off the same clock as the doors.
	const origin = context.stateGame.mascotThrowOrigin;
	const plate = $derived.by(() => {
		if (!origin) return null;
		const k = (elapsed - THROW_RELEASE_MS) / FLIGHT_MS;
		if (k < 0 || k > 1) return null;
		const board = context.stateGameDerived.boardLayout();
		const x = origin.x + (board.x - origin.x) * k;
		const y = origin.y + (board.y - origin.y) * k - Math.sin(k * Math.PI) * 220;
		return { x, y, rotation: -k * Math.PI * 2.2, scale: 0.9 + 0.5 * k };
	});

	onMount(() => {
		if (throwing) context.eventEmitter.broadcast({ type: 'mascotThrow' });
		if (throwing) context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		// A CAPPED clock, not wall time (see Go Banandit's copy): a texture hitch
		// on the way out of the feature must not let the doors arrive already shut.
		let prev = performance.now();
		let raf = 0;
		const step = (now: number) => {
			elapsed += Math.min(100, Math.max(0, now - prev));
			prev = now;
			if (!coverFired && elapsed >= COVER_AT) {
				coverFired = true;
				props.oncover?.();
			}
			if (elapsed >= TOTAL_MS) {
				if (!completed) {
					completed = true;
					props.oncomplete();
				}
				return;
			}
			raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
		return () => cancelAnimationFrame(raf);
	});
</script>

<Container>
	<!-- The falling front covers the mascot throw. -->
	{#if plate}
		<MainContainer>
			<Sprite
				key="gbP"
				anchor={0.5}
				x={plate.x}
				y={plate.y}
				rotation={plate.rotation}
				width={150 * plate.scale}
				height={150 * plate.scale}
			/>
		</MainContainer>
	{/if}
	{#if shut > 0}
		<Sprite key="smDoor" anchor={0.5} x={canvas.width / 2 + jolt * 0.18}
			y={doorY} width={door.width} height={door.height} />
	{/if}
</Container>
