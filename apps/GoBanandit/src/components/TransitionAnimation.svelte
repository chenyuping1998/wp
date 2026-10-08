<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { getContext } from '../game/context';

	// Go Banandit's transition: the warehouse ROLLER SHUTTER comes down over the
	// screen, slams, and rolls back up on the new scene (ART_BRIEF.md §5).
	//
	// Its mechanical job is the one every transition here has: hide a scene swap.
	// `oncover` fires only while the shutter is fully down and still — anything
	// the player must not watch change is swapped there. The shutter comes down
	// over the LIVE scene, so a swap made before calling for the transition is on
	// screen the whole way down.
	//
	// When the mascot is on screen he throws a Banana Sack, and the shutter waits
	// for it: it starts down on his RELEASE, the sack flies at the board and is
	// swallowed by the shutter, and the scene swap (which re-keys the mascot to
	// the other cast) waits until his 1.2s throw has played out. It used to start
	// the shutter on the same frame as the wind-up and swap at 0.71s, so the cast
	// change cut him off half-way through every throw, going in and coming out.
	type Props = {
		oncomplete: () => void;
		// Fired while the shutter is fully closed. Swap scenes here.
		oncover?: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	// Mirrors the skeleton's 'throwit' (design/generate_monkey_spine.mjs): the
	// sack leaves his hand at 0.52s and the clip ends at 1.20s, plus Mascot's
	// 0.16s mix back to idle.
	const THROW_RELEASE_MS = 520;
	const THROW_DONE_MS = 1200 + 160;
	const FLIGHT_MS = 520;

	// No mascot on screen (narrow layouts) → nothing to wait for.
	const throwing = context.stateGame.mascotThrowOrigin !== null;
	const LEAD_MS = throwing ? THROW_RELEASE_MS : 0;
	const DOWN_MS = 560;
	const SHUT_MS = 380; // closed: the swap happens in here
	const UP_MS = 620;
	const COVER_AT = Math.max(LEAD_MS + DOWN_MS + SHUT_MS * 0.4, throwing ? THROW_DONE_MS : 0);
	// the shutter stays down until the swap has had a beat to settle under it
	const HOLD_MS = Math.max(SHUT_MS, COVER_AT + SHUT_MS * 0.6 - LEAD_MS - DOWN_MS);
	const TOTAL_MS = LEAD_MS + DOWN_MS + HOLD_MS + UP_MS;

	const INK = 0x1e1b1a;
	const RED = 0xd24a2c;

	let elapsed = $state(0);
	let coverFired = false;
	let completed = false;

	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

	// 0 = open (shutter above the screen), 1 = closed
	const closed = $derived.by(() => {
		const t = elapsed - LEAD_MS;
		if (t < 0) return 0;
		if (t < DOWN_MS) {
			const k = t / DOWN_MS;
			// accelerates like a dropped shutter, with a small bounce at the floor
			const fall = k * k;
			return k > 0.86 ? 1 - Math.sin(((k - 0.86) / 0.14) * Math.PI) * 0.035 : fall / 0.7396;
		}
		if (t < DOWN_MS + HOLD_MS) return 1;
		const k = Math.min(1, (t - DOWN_MS - HOLD_MS) / UP_MS);
		// rolls up: slow start, then quick
		return 1 - k * k * (3 - 2 * k);
	});

	// the slam: a short vertical jolt of the whole shutter as it hits the floor
	let slammed = false;
	let rolling = false;
	$effect(() => {
		if (!rolling && elapsed >= LEAD_MS) {
			rolling = true;
			context.eventEmitter.broadcast({ type: 'soundShutterDown' });
		}
		if (!slammed && elapsed >= LEAD_MS + DOWN_MS * 0.86) {
			slammed = true;
			context.eventEmitter.broadcast({ type: 'soundStamp' });
		}
	});
	const jolt = $derived.by(() => {
		const t = elapsed - LEAD_MS - DOWN_MS * 0.86;
		if (t < 0 || t > 240) return 0;
		return Math.sin(t / 22) * 10 * (1 - t / 240);
	});

	// cover, not stretch: the shutter plate keeps its aspect on every layout
	const plate = $derived.by(() => {
		const scale = Math.max(canvas.width / 1920, canvas.height / 1080);
		return { width: 1920 * scale, height: 1080 * scale };
	});

	// the red kick-plate along the shutter's bottom edge — drawn, so it stays a
	// hard flat ink edge at every size
	const drawEdge = (g: PixiGraphics) => {
		g.clear();
		const h = Math.max(14, canvas.height * 0.028);
		g.rect(0, -h, canvas.width, h).fill(RED);
		g.rect(0, 0, canvas.width, 4).fill(INK);
	};

	// The sack, in main-layout coordinates: from his hand to the board's centre
	// on a high arc, spinning, read off the same clock as the shutter.
	const origin = context.stateGame.mascotThrowOrigin;
	const sack = $derived.by(() => {
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
		// the sack's whoosh only when there is a throw to hear
		if (throwing) context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		// A CAPPED clock, not wall time. On the way out of the feature the page
		// can hitch for a second as the base scene's textures come back to the
		// GPU; against performance.now() the shutter came out of that hitch
		// already shut, with the throw it was waiting for never seen. Pixi's
		// ticker caps its own step at 100ms (minFPS 10), so the mascot's spine
		// sits out a hitch the same way — this keeps the two in step.
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

	const bottom = $derived(canvas.height * closed + jolt);
</script>

<Container>
	<!-- under the shutter, so the closing door swallows it -->
	{#if sack}
		<MainContainer>
			<Sprite
				key="gbP"
				anchor={0.5}
				x={sack.x}
				y={sack.y}
				rotation={sack.rotation}
				width={150 * sack.scale}
				height={150 * sack.scale}
			/>
		</MainContainer>
	{/if}
	<!-- the shutter hangs from its bottom edge: its lower edge sits at `bottom` -->
	<Container y={bottom}>
		<Sprite
			key="gbShutter"
			anchor={{ x: 0.5, y: 1 }}
			x={canvas.width / 2}
			y={0}
			width={plate.width}
			height={Math.max(plate.height, canvas.height)}
		/>
		<Graphics draw={drawEdge} />
	</Container>
</Container>
