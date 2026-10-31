<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';
	import { getContext } from '../game/context';

	// Sushi Monkey's transition (2026-10-07, user request: "like Banandit, the
	// sushi shop's door closing and opening"): Go Banandit's roller-shutter
	// rhythm with the shop's own front. The two lattice doors slide in from the
	// screen edges and clack together (the noren that used to drop over them is
	// gone), the scene swaps behind the shut doors, and they slide back open.
	// Art: design/build_sushi_door.py. It replaces the order-terminal glitch.
	//
	// Its mechanical job is the one every transition here has: hide a scene swap.
	// `oncover` fires only while the doors are fully shut and still.
	//
	// 2026-10-31 (user: the transition was "太粗糙"): he no longer throws a Jade
	// Cup across the board (it tumbled 2.2 turns and swelled to 1.4x, and read
	// as a stray object). When he is on screen he OFFERS the cup toward the
	// board (his 'cheer') and the doors start on the offer. While they are shut
	// the paper panels light up from behind, as shoji do with a lamp lit inside,
	// and a festival lantern (the Scatter that opened the feature) drops on its
	// cord in front of the seam, swings once, flares, and is drawn back up as
	// the doors part. Lantern and light only ever sit on the shut doors.
	type Props = {
		oncomplete: () => void;
		// Fired while the doors are fully shut. Swap scenes here.
		oncover?: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	// his offer (cheer_motion_v2.mjs) reaches the board at ~0.4s; the doors
	// start as it does, and the swap (which re-keys him to the other cast)
	// waits until the offer has settled back (~1.45s)
	const OFFER_AT_MS = 400;
	const OFFER_DONE_MS = 1450;

	const castOn = context.stateGame.mascotThrowOrigin !== null;
	const LEAD_MS = castOn ? OFFER_AT_MS : 0;
	const SHUT_MS = 560; // doors sliding in
	// shut: the lantern drops, swings and flares in here, and the swap happens
	const HOLD_MIN_MS = 1000;
	const OPEN_MS = 620;
	const COVER_AT = Math.max(LEAD_MS + SHUT_MS + HOLD_MIN_MS * 0.5, castOn ? OFFER_DONE_MS : 0);
	const HOLD_MS = Math.max(HOLD_MIN_MS, COVER_AT + 200 - LEAD_MS - SHUT_MS);
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

	// ms since the doors met, or < 0 before
	const shutFor = $derived(elapsed - LEAD_MS - SHUT_MS);
	const openFor = $derived(elapsed - LEAD_MS - SHUT_MS - HOLD_MS);
	// the lamp behind the paper: up over 260ms once shut, down as the doors part
	const backlit = $derived(
		shutFor < 0 ? 0 : openFor < 0 ? Math.min(1, shutFor / 260) : Math.max(0, 1 - openFor / 300),
	);
	// The lantern: dropped on its cord to just above centre (back-out), one
	// swing that dies away, a flare at the bottom of its first swing, then drawn
	// up as the doors open. Main-layout units are the canvas here.
	const LANTERN_DROP_MS = 420;
	const lantern = $derived.by(() => {
		if (shutFor < 0) return null;
		const size = Math.min(canvas.height * 0.3, canvas.width * 0.22);
		const restY = canvas.height * 0.44;
		let y: number;
		if (openFor < 0) {
			const k = Math.min(1, shutFor / LANTERN_DROP_MS);
			const s = 1.6;
			const back = 1 + (s + 1) * (k - 1) ** 3 + s * (k - 1) ** 2;
			y = -size + (restY + size) * back;
		} else {
			const k = Math.min(1, openFor / 360);
			y = restY - (restY + size * 1.4) * k * k;
		}
		const swingT = Math.max(0, shutFor - LANTERN_DROP_MS * 0.6) / 1000;
		const rotation = 0.14 * Math.sin(swingT * Math.PI * 2 * 0.9) * Math.exp(-swingT * 2.4);
		const flare = Math.exp(-(((shutFor - LANTERN_DROP_MS - 120) / 170) ** 2));
		return { y, size, rotation, flare };
	});
	const CORD_W = 14;

	onMount(() => {
		if (castOn) context.eventEmitter.broadcast({ type: 'mascotOffer' });
		if (castOn) context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
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
	{#if shut > 0}
		<!-- left door: its meeting stile is the art's right edge -->
		<Sprite key="smDoor" anchor={{ x: 1, y: 0.5 }} x={leftEdge} y={canvas.height / 2} width={door.width} height={door.height} />
		<!-- right door: the same door mirrored -->
		<Container x={rightEdge} y={canvas.height / 2} scale={{ x: -1, y: 1 }}>
			<Sprite key="smDoor" anchor={{ x: 1, y: 0.5 }} width={door.width} height={door.height} />
		</Container>
	{/if}
	{#if backlit > 0.001}
		<!-- the lamp lit behind the paper: warm light pooled on the shut doors,
		     strongest at the seam (additive, a plain sibling of the doors) -->
		<Sprite key="fxSoftGlow" anchor={0.5} x={canvas.width / 2 + jolt} y={canvas.height * 0.48}
			width={canvas.width * 1.1} height={canvas.height * 1.25} blendMode="add" tint={0xffcf8a}
			alpha={0.32 * backlit + 0.25 * (lantern?.flare ?? 0)} />
	{/if}
	{#if lantern}
		<Container x={canvas.width / 2 + jolt} y={lantern.y} rotation={lantern.rotation}>
			<!-- its cord, up off the top of the screen -->
			{#each Array(Math.max(0, Math.ceil((lantern.y - lantern.size * 0.42 + 40) / (CORD_W * (120 / 72))))) as _, i (i)}
				<Sprite key="v8SignCord" anchor={{ x: 0.5, y: 1 }} y={-lantern.size * 0.42 - i * CORD_W * (120 / 72)} width={CORD_W} height={CORD_W * (120 / 72)} />
			{/each}
			<Sprite key="fxSoftGlow" anchor={0.5} blendMode="add" tint={0xffb860}
				width={lantern.size * 2.2} height={lantern.size * 2.2} alpha={0.35 + 0.5 * lantern.flare} />
			<Sprite key="gbS" anchor={0.5} width={lantern.size} height={lantern.size} />
		</Container>
	{/if}
</Container>
