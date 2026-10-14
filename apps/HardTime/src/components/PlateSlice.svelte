<script lang="ts">
	import * as PIXI from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';

	/**
	 * A painted plate stretched to any box by nine-slicing — the corners keep
	 * their drawn size, only the edges and the well stretch.
	 *
	 * Written for the free-spin entry card (2026-10-01), whose panel was pixi
	 * Graphics: a flat fill, forty alpha bands faking a fade, and stacked strokes
	 * faking a neon tube. That is the "gradient fills" item of review's Low
	 * quality assets tag word for word. The Buy Bonus plate is the game's own
	 * painted hardware (riveted rusted-steel rim), so a
	 * card cut from it reads as part of the same set.
	 *
	 * `border` is in texture pixels. On hardTimeUi/buybonus_plate.png (640²) the
	 * rounded steel corner and its rivet reach ~96px, so 104 keeps them whole.
	 */
	type Props = {
		key: string;
		width: number;
		height: number;
		border: number;
		x?: number;
		y?: number;
		alpha?: number;
		tint?: number;
		/** the box is centred on (x, y) when true, top-left otherwise */
		centered?: boolean;
	};

	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	const texture = $derived(
		(app.stateApp.loadedAssets?.[props.key] as PIXI.Texture | undefined) ?? PIXI.Texture.EMPTY,
	);

	const sprite = new PIXI.NineSliceSprite({
		texture: PIXI.Texture.EMPTY,
		leftWidth: props.border,
		rightWidth: props.border,
		topHeight: props.border,
		bottomHeight: props.border,
	});

	$effect(() => {
		sprite.texture = texture;
		// Never let the corners overlap: a box smaller than two borders scales the
		// whole plate down instead of folding it.
		const fit = Math.min(1, props.width / (props.border * 2.2), props.height / (props.border * 2.2));
		const k = Math.max(0.05, fit);
		sprite.scale.set(k);
		sprite.width = props.width / k;
		sprite.height = props.height / k;
		sprite.scale.set(k);
		sprite.x = (props.x ?? 0) - (props.centered ? props.width / 2 : 0);
		sprite.y = (props.y ?? 0) - (props.centered ? props.height / 2 : 0);
		sprite.alpha = props.alpha ?? 1;
		sprite.tint = props.tint ?? 0xffffff;
	});

	parent.addToParent(sprite);
</script>
