<script lang="ts">
	/**
	 * What happens on the farm at night (game/bgEvents.ts): mist drifting over the field, the little saucer's
	 * searchlight sweeping the barn (base set), a cloud crossing the moon with the night dimming under it, and on a
	 * big win a saucer reeling a cow up across the moon; in the feature, the mothership's ports chasing round its
	 * hull, scan lines climbing its beam and a lit ring running out over the crop circle. Over BgNight, in the
	 * plate's own pixels: the container takes the background sprite's box, so the parallax drift carries it.
	 *
	 * requestAnimationFrame, not setInterval: the review checker flags interval animation.
	 */
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import { mothershipDy } from '../game/meshWin/bgProps';
	import {
		ABDUCTION_S, craftAt, cowAt, drawAbductionBeam, drawAbductionFx, drawCow, drawMist, drawMoonCloud, drawMothership, drawSearchlight, moonCover,
	} from '../game/bgEvents';

	type Props = {
		scene: 'base' | 'feature';
		/** the background sprite's box this frame */
		x: number;
		y: number;
		width: number;
		height: number;
	};
	const props: Props = $props();
	const context = getContext();

	let t = $state(0);
	let bigAt = $state(-1e9);
	let handled = false;
	const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
	const mine = () => context.stateGame.gameType === (props.scene === 'base' ? 'basegame' : 'freegame');
	context.eventEmitter.subscribeOnMount({
		winShow: () => (handled = false),
		winUpdate: ({ winLevelData }) => {
			// once per big win, on the set that is showing, and never twice over itself
			if (handled || reduced || winLevelData.type !== 'big' || !mine() || t - bigAt < ABDUCTION_S) return;
			handled = true;
			bigAt = t;
		},
	});
	onMount(() => {
		let raf = 0;
		const start = performance.now();
		const tick = (now: number) => {
			t = reduced ? 0 : (now - start) / 1000;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const u = $derived(t - bigAt);
	const craft = $derived(craftAt(u));
	const cow = $derived(cowAt(u, craft));
	const cover = $derived(moonCover(t));

	const drawGround = (g: PixiGraphics) => {
		g.clear();
		drawMist(g, t);
		if (props.scene === 'base') drawSearchlight(g, t);
		else drawMothership(g, t, mothershipDy(t * 1000));
	};
	const drawSky = (g: PixiGraphics) => {
		g.clear();
		drawMoonCloud(g, t);
		// the night dims while the moon is behind the cloud
		if (cover > 0) g.rect(0, 0, 1920, 1080).fill({ color: 0x0b1030, alpha: 0.16 * cover });
	};
	const drawBeam = (g: PixiGraphics) => {
		g.clear();
		drawAbductionBeam(g, u, craft);
	};
	const drawFx = (g: PixiGraphics) => {
		g.clear();
		drawAbductionFx(g, u, craft);
	};
</script>

<Container x={props.x} y={props.y} scale={{ x: props.width / 1920, y: props.height / 1080 }}>
	<Graphics draw={drawGround} />
	<Graphics draw={drawSky} />
	{#if craft.visible}
		<Graphics draw={drawBeam} />
		{#if cow.visible}
			<Container x={cow.x} y={cow.y} rotation={cow.rot} scale={cow.scale}>
				<Graphics draw={drawCow} />
			</Container>
		{/if}
		<Sprite key="gbS" anchor={0.5} x={craft.x} y={craft.y} width={240} height={240} rotation={craft.tilt} />
		<Graphics draw={drawFx} />
	{/if}
</Container>
