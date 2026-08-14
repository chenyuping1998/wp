<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';

	/**
	 * Makes the fire in the painted scene actually burn.
	 *
	 * bg_background.png is a still painting in which the flames around the frame,
	 * the furnace mouth, the dragon's pour and the cracks in the floor are all the
	 * same pixels as the anvil and the flagstones. Nothing about the image can be
	 * moved without moving the stonework with it.
	 *
	 * So the motion is put somewhere else entirely: seamless streaked noise is
	 * scrolled across the scene and CLIPPED TO THE FIRE by a mask baked from the
	 * painting itself (design/generate_lava_flow.mjs). Bright bands travel through
	 * every hot pixel and through no cold one — the flames lick, the pour runs, and
	 * the anvil does not so much as shiver.
	 *
	 * Two layers, because one is unconvincing: a slow deep-orange body carrying the
	 * bulk of the movement, and a smaller, faster, paler layer on top. Their
	 * periods do not divide each other, so the combination never visibly repeats
	 * even though both tile.
	 */
	type Props = {
		/** The scene rect, top-left anchored — exactly as the scene Sprite is drawn. */
		x: number;
		y: number;
		width: number;
		height: number;
		/** Scales opacity. The free game runs the forge hotter. */
		intensity?: number;
	};

	const props: Props = $props();
	const intensity = $derived(props.intensity ?? 1);

	// Seconds. Driven by rAF rather than setInterval so the flow advances with the
	// frames actually being drawn — on a slow device an interval clock makes the
	// noise jump forward between frames, which reads as the fire stuttering.
	let clock = $state(0);
	onMount(() => {
		let raf = 0;
		let last = performance.now();
		const step = (now: number) => {
			// Clamped: coming back from a backgrounded tab hands you one enormous
			// delta, which would teleport the flow a long way in a single frame.
			clock += Math.min(now - last, 100) / 1000;
			last = now;
			raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
		return () => cancelAnimationFrame(raf);
	});

	/**
	 * cols/rows  how many times the noise repeats across the scene — smaller cells
	 *            mean finer, faster-reading detail
	 * speedY     cells travelled per second, so the visual speed stays put when the
	 *            layout changes size
	 * drift      a slow sideways component; fire does not fall straight down
	 */
	const LAYERS = [
		{ cols: 2, rows: 2, speedY: 0.085, drift: -0.017, tint: 0xff5a0c, alpha: 0.42 },
		{ cols: 3, rows: 3, speedY: 0.21, drift: 0.036, tint: 0xffc154, alpha: 0.26 },
	];

	// Positive modulo — `%` keeps the sign of its left operand in JS, and the
	// sideways drift is negative on the first layer.
	const wrap = (value: number, modulus: number) => ((value % modulus) + modulus) % modulus;

	const tilesOf = (layer: (typeof LAYERS)[number]) => {
		const cw = props.width / layer.cols;
		const ch = props.height / layer.rows;
		// One extra row and column: the grid is scrolled by up to a full cell, so
		// without the spares a gap opens at whichever edge it is travelling from.
		const offsetY = ch - wrap(clock * layer.speedY * ch, ch);
		const offsetX = cw - wrap(clock * layer.drift * cw, cw);
		const tiles = [];
		for (let row = -1; row < layer.rows; row += 1) {
			for (let col = -1; col < layer.cols; col += 1) {
				tiles.push({
					x: props.x + col * cw + offsetX,
					y: props.y + row * ch + offsetY,
					width: cw,
					height: ch,
				});
			}
		}
		return tiles;
	};
</script>

<!--
	The mask and the flow have to live in the same Container and nothing else may
	join them: `isMask` masks the PARENT, so any sibling added here would be
	clipped to the fire as well.
-->
<Container>
	<Sprite key="efHeatMask" x={props.x} y={props.y} width={props.width} height={props.height} isMask />

	{#each LAYERS as layer, layerIndex (layerIndex)}
		{#each tilesOf(layer) as tile, tileIndex (tileIndex)}
			<Sprite
				key="fxFlow"
				x={tile.x}
				y={tile.y}
				width={tile.width}
				height={tile.height}
				blendMode="add"
				tint={layer.tint}
				alpha={layer.alpha * intensity}
			/>
		{/each}
	{/each}
</Container>
