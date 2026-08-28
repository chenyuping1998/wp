<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { Graphics } from 'pixi-svelte';

	import {
		SYMBOL_SIZE,
		SCATTER_FRAME_COLOR,
		SCATTER_FRAME_CORE,
		SCATTER_FRAME_WIDTH,
		SCATTER_FRAME_FLARE_MS,
		SCATTER_FRAME_STEADY_ALPHA,
		SCATTER_FRAME_INSET,
	} from '../game/constants';

	// No props. ReelSymbol mounts this only while the reel is at rest, so being
	// mounted IS the landing - a `settled` prop that the parent could only ever
	// pass as true would just be a second, weaker statement of the same gate.

	// Flares to 1 on mount and decays to 0, leaving the steady frame behind.
	// Landing is the moment the player is hunting for the scatter, so that is
	// where the emphasis goes; the steady frame is what keeps it findable
	// afterwards, while they are counting how many they have.
	const flare = new Tween(0, { duration: SCATTER_FRAME_FLARE_MS, easing: cubicOut });

	$effect(() => {
		flare.set(1, { duration: 0 });
		flare.set(0);
	});

	const half = SYMBOL_SIZE / 2 - SCATTER_FRAME_INSET;
	const size = half * 2;
	// The frame swells slightly on the flare, so it reads as landing rather than
	// as switching on.
	const grow = $derived(flare.current * 4);
</script>

<!--
	Drawn BEFORE the symbol art, so it frames the symbol rather than covering it.

	Two rules are load-bearing in here.

	Modern Pixi v8 path API: build the path, then `.stroke()` / `.fill()` it. The
	v7-style `lineStyle` + `drawRoundedRect` survives behind a deprecation shim,
	but a stroke-only path written that way never reached the screen - the first
	version of this component was written that way and drew nothing at all.

	And no additive blending. Board.svelte mounts BoardMask, and in Pixi v8 a
	sprite mask is a filter: the masked container renders into an isolated target
	that starts transparent, so an additive layer inside it has nothing to add to.
	Ordinary alpha over the dark cell is what shows up. See the pixi note in the
	stake-engine-slot skill; this exact mistake has cost an upload before.
-->

<!-- steady frame: the part that stays -->
<Graphics
	draw={(g) => {
		g.clear();
		g.roundRect(-half - grow, -half - grow, size + grow * 2, size + grow * 2, 9);
		g.stroke({
			width: SCATTER_FRAME_WIDTH,
			color: SCATTER_FRAME_COLOR,
			alpha: SCATTER_FRAME_STEADY_ALPHA,
		});
	}}
/>

<!--
	Corner ticks. A second, differently-SHAPED cue on top of the colour: a player
	who cannot separate the frame's hue from a bright symbol edge - or who is
	colour-blind - can still see four marks that no other cell has.
-->
<Graphics
	draw={(g) => {
		g.clear();
		const t = 13;
		const e = half + grow;
		for (const sx of [-1, 1]) {
			for (const sy of [-1, 1]) {
				g.moveTo(sx * e, sy * (e - t));
				g.lineTo(sx * e, sy * e);
				g.lineTo(sx * (e - t), sy * e);
			}
		}
		g.stroke({ width: SCATTER_FRAME_WIDTH, color: SCATTER_FRAME_CORE, alpha: 0.95 });
	}}
/>

<!-- the flare itself: a hot ring that fades out over SCATTER_FRAME_FLARE_MS -->
{#if flare.current > 0}
	<Graphics
		alpha={flare.current}
		draw={(g) => {
			g.clear();
			// A wash inside the cell as well - an outline alone is a thin thing to
			// catch the eye with when five reels stop within half a second.
			g.roundRect(-half, -half, size, size, 9);
			g.fill({ color: SCATTER_FRAME_COLOR, alpha: 0.22 * flare.current });
			const e = half + grow + 3;
			g.roundRect(-e, -e, e * 2, e * 2, 11);
			g.stroke({ width: SCATTER_FRAME_WIDTH + 4, color: SCATTER_FRAME_CORE, alpha: 0.9 });
		}}
	/>
{/if}
