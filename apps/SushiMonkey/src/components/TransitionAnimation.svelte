<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { getContext } from '../game/context';

	// Sushi Monkey's transition (2026-10-07, user request: "like Banandit, the
	// sushi shop's door closing and opening"): Go Banandit's roller-shutter
	// rhythm with the shop's own front. The two lattice doors slide in from the
	// screen edges and clack together, the noren drops from the lintel over
	// them, the scene swaps behind the shut doors, and they slide back open.
	// Art: design/build_sushi_door.py. It replaces the order-terminal glitch.
	//
	// Its mechanical job is the one every transition here has: hide a scene swap.
	// `oncover` fires only while the doors are fully shut and still.
	//
	// When the chef is on screen he throws a Sushi Plate first, and the doors
	// wait for it: they start on his RELEASE, the plate flies at the board and is
	// swallowed by the closing doors, and the swap (which re-keys him to the
	// other cast) waits until his throw has played out.
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
	// the clack: the meeting stiles hit at this fraction of the slide
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

	// the noren drops in just behind the doors and lifts first on the way out
	const norenDrop = $derived.by(() => {
		const t = elapsed - LEAD_MS;
		if (t < 0) return 0;
		if (t < SHUT_MS) return Math.min(1, t / (SHUT_MS * 0.8)) ** 2;
		if (t < SHUT_MS + HOLD_MS) return 1;
		const k = Math.min(1, (t - SHUT_MS - HOLD_MS) / (OPEN_MS * 0.7));
		return 1 - k * k;
	});
	// and swings after the clack
	const norenSwing = $derived.by(() => {
		const t = elapsed - LEAD_MS - SHUT_MS * CLACK_AT;
		if (t < 0 || t > 900) return 0;
		return Math.sin(t / 95) * 0.012 * (1 - t / 900);
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
	// the whole front jolts sideways when the stiles meet
	const jolt = $derived.by(() => {
		const t = elapsed - LEAD_MS - SHUT_MS * CLACK_AT;
		if (t < 0 || t > 220) return 0;
		return Math.sin(t / 20) * 7 * (1 - t / 220);
	});

	// Each door is sized by HEIGHT (cover) and anchored at its meeting stile, so
	// the lattice never stretches; on a wide screen the 1400px-wide art still
	// reaches the outer edge, on a tall one the outer part is simply off-screen.
	const doorScale = $derived(Math.max(canvas.height / 1080, canvas.width / 2 / 1400));
	const door = $derived({ width: 1400 * doorScale, height: 1080 * doorScale });
	const half = $derived(canvas.width / 2);
	// open: each door's meeting edge sits past its own screen edge
	const travel = $derived(half + 24);
	const leftEdge = $derived(half - travel * (1 - shut) + jolt);
	const rightEdge = $derived(half + travel * (1 - shut) + jolt);

	const noren = $derived.by(() => {
		const scale = Math.max(canvas.width / 1920, (canvas.height * 0.3) / 420);
		return { width: 1920 * scale, height: 420 * scale };
	});

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
	<!-- under the doors, so the closing front swallows it -->
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
		<!-- left door: its meeting stile is the art's right edge -->
		<Sprite key="smDoor" anchor={{ x: 1, y: 0.5 }} x={leftEdge} y={canvas.height / 2} width={door.width} height={door.height} />
		<!-- right door: the same door mirrored -->
		<Container x={rightEdge} y={canvas.height / 2} scale={{ x: -1, y: 1 }}>
			<Sprite key="smDoor" anchor={{ x: 1, y: 0.5 }} width={door.width} height={door.height} />
		</Container>
	{/if}
	{#if norenDrop > 0}
		<Sprite
			key="smNoren"
			anchor={{ x: 0.5, y: 0 }}
			x={canvas.width / 2 + jolt * 0.4}
			y={-noren.height * (1 - norenDrop)}
			rotation={norenSwing}
			width={noren.width}
			height={noren.height}
		/>
	{/if}
</Container>
