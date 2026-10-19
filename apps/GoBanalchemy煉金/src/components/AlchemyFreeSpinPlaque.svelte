<script lang="ts">
	import { Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import GoldText from './GoldText.svelte';
	type Props = {
		width: number;
		height: number;
		title: string;
		count: string | number;
		progress?: number;
		progressMax?: number;
	};
	const props: Props = $props();
	const drawProgress = (g: PixiGraphics) => {
		g.clear();
		const max = Math.max(0, Math.min(12, props.progressMax ?? 0));
		if (!max) return;
		const gap = Math.min(props.width * 0.105, (props.width * 0.65) / max);
		for (let i = 0; i < max; i++) {
			const lit = i < (props.progress ?? 0),
				x = props.width / 2 + (i - (max - 1) / 2) * gap;
			g.circle(x, props.height * 0.79, props.width * 0.018)
				.fill(lit ? 0x4dbb91 : 0x173b37)
				.stroke({ width: Math.max(1, props.width * 0.004), color: lit ? 0xd6b66d : 0x577a68 });
		}
	};
</script>

<Sprite key="gbFgPlaque" width={props.width} height={props.height} />
<GoldText
	x={props.width / 2}
	y={props.height * 0.32}
	text={props.title}
	fontSize={Math.min(props.width * 0.115, (props.width * 1.25) / Math.max(1, props.title.length))}
	maxWidth={props.width * 0.79}
	letterSpacing={2}
	fill={[0xfff5d8, 0xf0d38b, 0xbd9248]}
	stroke={0x173c32}
/>
<GoldText
	x={props.width / 2}
	y={props.height * 0.55}
	text={props.count}
	fontSize={props.width * 0.2}
	maxWidth={props.width * 0.74}
	fill={[0xfff5d8, 0xf0d38b, 0xbd9248]}
	stroke={0x173c32}
/>
<Graphics draw={drawProgress} />
