<script lang="ts">
	/**
	 * A frame PNG drawn round an arbitrary box without stretching its corners:
	 * pixi's NineSliceSprite, wrapped. The board and block frames (art/game-ready-1110
	 * frames/) are drawn square; the board is square but the merge strips are
	 * n×6 cells, and the board's band is thinned to fit beside the HUD.
	 *
	 * `x/y/width/height` are the box the frame's INK should cover, in the
	 * parent's units. `slice` is the corner size and `margin` the transparent
	 * margin round the ink, both in texture px; `k` is the texture→parent scale
	 * the corners and band are drawn at.
	 */
	import { NineSliceSprite, Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';

	type Props = {
		key: string;
		x: number;
		y: number;
		width: number;
		height: number;
		slice: number;
		margin?: number;
		k: number;
		alpha?: number;
		tint?: number;
		blendMode?: 'normal' | 'add';
		zIndex?: number;
	};
	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	const node = new NineSliceSprite({ texture: Texture.EMPTY, leftWidth: 1, topHeight: 1, rightWidth: 1, bottomHeight: 1 });
	node.label = `wa-nine-${props.key}`;
	parent.addToParent(node);

	$effect(() => {
		const texture = app.stateApp.loadedAssets?.[props.key] as Texture | undefined;
		if (!texture) return;
		node.texture = texture;
		node.leftWidth = props.slice;
		node.topHeight = props.slice;
		node.rightWidth = props.slice;
		node.bottomHeight = props.slice;
	});

	$effect(() => {
		const m = props.margin ?? 0;
		const k = Math.max(1e-4, props.k);
		node.width = props.width / k + 2 * m;
		node.height = props.height / k + 2 * m;
		node.scale.set(k);
		node.position.set(props.x - m * k, props.y - m * k);
		node.alpha = props.alpha ?? 1;
		node.tint = props.tint ?? 0xffffff;
		node.blendMode = props.blendMode ?? 'normal';
		if (props.zIndex !== undefined) node.zIndex = props.zIndex;
	});
</script>
