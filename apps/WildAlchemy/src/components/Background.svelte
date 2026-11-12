<script lang="ts">
	import { Rectangle } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { SECOND } from 'constants-shared/time';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import { castTopStd, housingRect } from '../game/cornerLogo';
	import SceneLife from './SceneLife.svelte';

	const context = getContext();
	// Two scenes (SPEC §3): the alchemist's laboratory in the base game, the
	// tower top under the stars in the free games. Each is a plate plus its
	// delivered object layers, moving on their own (SceneLife.svelte).
	const isFeature = $derived(context.stateGame.gameType === 'freegame');

	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	// Same test the cast uses: no side band beside the board means the cast and
	// the logo share the strip above it, and the plate is seen as a tall middle
	// slice — the layers switch to their portrait placement.
	const orient = $derived<'land' | 'port'>(castTopStd(context, 0) === null ? 'port' : 'land');

	// ── cover-fit the 1920x1080 plate, with a very slow drift over a small
	// overscan (SPEC §3.1 layer 0: "at most a very slow pan") ──────────────────
	const OVERSCAN = 1.03;
	let clock = $state(0);
	const plate = $derived.by(() => {
		const scale = Math.max(canvas.width / 1920, canvas.height / 1080) * OVERSCAN;
		const slackX = 1920 * scale - canvas.width;
		const slackY = 1080 * scale - canvas.height;
		// the drift is a fraction of the overscan, never of the crop: a tall
		// screen crops most of the plate's width away and must not pan across it
		const driftX = Math.min(slackX * 0.35, 1920 * scale * (OVERSCAN - 1) * 0.35);
		const driftY = Math.min(slackY * 0.35, 1080 * scale * (OVERSCAN - 1) * 0.35);
		return {
			scale,
			// what the cover fit crops off each side, in plate px (no drift)
			cropL: (slackX * 0.5) / scale,
			cropR: (slackX * 0.5) / scale,
			x: -slackX * 0.5 + Math.sin(clock * 0.05) * driftX,
			y: -slackY * 0.5 + Math.sin(clock * 0.037 + 1.1) * driftY,
		};
	});

	onMount(() => {
		let raf = 0;
		let last = performance.now();
		const tick = (now: number) => {
			clock += Math.min(0.05, (now - last) / 1000);
			last = now;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	// ── the cast's band is knocked back toward paper (house rule: the figure
	// reads off the backdrop; no texture behind it, never a pale panel). The
	// wash is drawn by SceneLife straight over the PLATE, under the object
	// layers, so it calms the wall and window without ghosting the raven or
	// the chime that hang in that band. Landscape: from the housing's edge
	// outwards; portrait: the right half of the strip above the housing. ────
	const wash = $derived.by(() => {
		const housing = housingRect(context);
		return orient === 'land'
			? { left: housing.right - 10, right: canvas.width, top: 0, bottom: canvas.height, split: canvas.height * 0.32 }
			: { left: canvas.width * 0.5, right: canvas.width, top: 0, bottom: Math.max(0, housing.top), split: 0 };
	});
</script>

<!--
	Letterbox fill, seen only if the plate ever fails to reach an edge: the
	plates' own paper tone, not a dark slab.
-->
<Rectangle {...canvas} backgroundColor={0xead6b0} zIndex={-3} />

<FadeContainer show={!isFeature} duration={SECOND} zIndex={-2}>
	<SceneLife scene="mg" {orient} {...plate} {wash} active={!isFeature} />
</FadeContainer>

<FadeContainer show={isFeature} duration={SECOND} zIndex={-1}>
	<SceneLife scene="fg" {orient} {...plate} {wash} active={isFeature} />
</FadeContainer>
