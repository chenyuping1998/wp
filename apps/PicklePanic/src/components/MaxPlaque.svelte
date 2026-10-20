<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';
	import { everyFrame } from '../game/frameLoop';

	// THE MAX PLAQUE WITH BOTH COOKS ALIVE (pre-submission self-check 2026-10-20:
	// the cooks on win_max_base were one still picture, and the house rule is no
	// still character at a feature beat).
	//
	// design/build_max_layers.py cuts the art into the sign and the two cooks on
	// the same 1600x900 canvas. Both cooks stand BEHIND the sign, so they may only
	// move vertically: their cut runs down the sign's vertical edges, and any
	// sideways move would open a gap there. So the beat is a heave: each cook
	// crouches a little and stretches up from planted feet, the boss leading the
	// chef by a fraction of a beat, and the sign rides up with them by the height
	// their hands rise. Their hands are in their own layers, so they lift with
	// them and slide only a few px on the rim (the rim under them is filled).
	// children ride on the sign (the cap on the intro card)
	type Props = { width: number; height: number; children?: Snippet };
	const props: Props = $props();

	const PERIOD = 0.95; // s per heave
	const LAG = 0.14; // chef behind the boss, in periods
	const STRETCH = 0.035; // peak extra height
	const CROUCH = 0.015; // dip before the lift
	// measured from the layers (fractions of the canvas)
	const MG_FEET = { x: 0.11, y: 0.972 };
	const FG_FEET = { x: 0.885, y: 0.985 };
	const HAND_ABOVE_FEET = 0.5; // grip height above the feet, fraction of canvas height

	let t = $state(0);
	onMount(() => {
		const start = performance.now();
		return everyFrame(() => {
			t = (performance.now() - start) / 1000;
		});
	});

	// one heave: quick crouch, spring up, ease back down
	const heave = (time: number) => {
		const p = ((time / PERIOD) % 1 + 1) % 1;
		if (p < 0.18) return -CROUCH * Math.sin((p / 0.18) * Math.PI);
		const q = (p - 0.18) / 0.82;
		return STRETCH * Math.sin(q * Math.PI) ** 1.4;
	};

	const mg = $derived(heave(t));
	const fg = $derived(heave(t - LAG * PERIOD));
	// the sign rises with the average lift of the two grips
	const signY = $derived(-props.height * HAND_ABOVE_FEET * ((mg + fg) / 2));

	const cook = (feet: { x: number; y: number }, k: number) => ({
		x: (feet.x - 0.5) * props.width,
		y: (feet.y - 0.5) * props.height,
		sx: 1 - k * 0.2, // little width change: a sideways move would open the seam at the sign's edge
		sy: 1 + k,
		ox: -(feet.x - 0.5) * props.width,
		oy: -(feet.y - 0.5) * props.height,
	});
	const L = $derived(cook(MG_FEET, mg));
	const R = $derived(cook(FG_FEET, fg));
</script>

<Container y={signY}>
	<Sprite key="v8WinMaxSign" anchor={0.5} width={props.width} height={props.height} />
	{@render props.children?.()}
</Container>
<Container x={L.x} y={L.y} scale={{ x: L.sx, y: L.sy }}>
	<Sprite key="v8WinMaxMg" anchor={0.5} x={L.ox} y={L.oy} width={props.width} height={props.height} />
</Container>
<Container x={R.x} y={R.y} scale={{ x: R.sx, y: R.sy }}>
	<Sprite key="v8WinMaxFg" anchor={0.5} x={R.ox} y={R.oy} width={props.width} height={props.height} />
</Container>
