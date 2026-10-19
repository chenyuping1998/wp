<script lang="ts">
	/**
	 * The glassware painted in a background simmers: bubbles rise in each
	 * flask and tube and pop at the surface (game/meshWin/potionBoil.ts,
	 * BG_POTIONS). Drawn straight after the background's sprite, in the same
	 * box, masked to the liquid — so it fades and drifts with the plate.
	 *
	 * setInterval, not the frame loop, like BgProps: it keeps time in a hidden
	 * tab.
	 */
	import { Container, Graphics } from 'pixi.js';
	import { getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { boilAt, chamberOutline, type Potion } from '../game/meshWin/potionBoil';

	type Props = {
		potions: Potion[];
		/** the background sprite's box this frame */
		x: number;
		y: number;
		width: number;
		height: number;
	};
	const props: Props = $props();
	const parent = getContextParent();

	// the plates are 1920 x 1080; the chambers are in their pixels
	const PLATE_W = 1920;
	const HEAT = 0.4;

	const root = new Container();
	root.label = 'bgBubbles';
	parent.addToParent(root);

	onMount(() => {
		const bubbles = new Graphics();
		const mask = new Graphics();
		for (const potion of props.potions)
			for (const c of potion.chambers) mask.poly(chamberOutline(c).flat()).fill(0xffffff);
		root.addChild(bubbles, mask);
		bubbles.mask = mask;
		const started = Date.now();

		const id = setInterval(() => {
			const t = Date.now() - started;
			bubbles.clear();
			for (const potion of props.potions)
				for (const b of boilAt(potion, t, HEAT)) {
					if (b.pop > 0) {
						bubbles
							.ellipse(b.x, b.y, b.r * 1.7, b.r * 0.45)
							.stroke({ width: 1.2, color: potion.rim, alpha: b.alpha * 0.8 });
						continue;
					}
					bubbles.circle(b.x, b.y, b.r).fill({ color: potion.body, alpha: b.alpha * 0.25 });
					bubbles.circle(b.x, b.y, b.r).stroke({ width: 1.2, color: potion.rim, alpha: b.alpha * 0.7 });
					bubbles
						.circle(b.x - b.r * 0.32, b.y - b.r * 0.36, b.r * 0.3)
						.fill({ color: potion.glint, alpha: b.alpha * 0.7 });
				}
			root.position.set(props.x, props.y);
			root.scale.set(props.width / PLATE_W);
		}, 16);

		return () => {
			clearInterval(id);
		};
	});
</script>
