<script lang="ts" module>
	export type Props = {
		// asset key of the strip artwork (uiTheme.sprites.bar, already resolved)
		assetKey: string;
		// where the strip is drawn, in standard-layout units
		x: number;
		y: number;
		width: number;
		height: number;
		// how many pixels at each END of the SOURCE texture are the fixed caps
		slice: number;
	};
</script>

<script lang="ts">
	import { Container, Graphics, Sprite, getContextApp } from 'pixi-svelte';
	import type { Texture } from 'pixi.js';

	// Horizontal three-slice for the bet bar's own background.
	//
	// The bar is the one element on the screen whose aspect ratio is not fixed:
	// its height comes from uiTheme.barHeight but its width is the canvas width
	// less a margin, so the same art has to serve roughly 15:1 on a desktop box
	// and something much squarer on the tablet one. Scaling one Sprite to fit
	// distorts it exactly the way widening the ticker plate did once before —
	// see the note in LayoutBottomBar.
	//
	// Only the horizontal axis needs slicing: the bar's height is a theme
	// constant, so the caps and the middle all scale vertically by the same
	// factor and the corners stay square. That is why this is not a full
	// nine-slice — pixi-svelte has no NineSliceSprite wrapper, and its package
	// build does not currently run in this workspace (svelte2tsx fails against
	// the installed TypeScript), so adding one there was not an option. Masked
	// Sprites need nothing that is not already exported.
	//
	// Nothing renders unless a game sets uiTheme.sprites.bar, so this file is
	// dead weight for every game that does not.

	const props: Props = $props();
	const context = getContextApp();

	// Natural size of the source texture. Read rather than assumed, because the
	// slice is specified in SOURCE pixels: art delivered at 2x has caps twice as
	// many pixels wide, and dividing by the texture height is what converts both
	// back into layout units in one step.
	const texture = $derived(context.stateApp.loadedAssets?.[props.assetKey] as Texture | undefined);
	const texW = $derived(texture?.width ?? 0);
	const texH = $derived(texture?.height ?? 0);

	// Uniform scale, driven by the height. The caps are drawn at this scale on
	// both axes — that is the whole point of a slice: the ends keep their aspect
	// ratio and only the middle is allowed to stretch.
	const fit = $derived(texH > 0 ? props.height / texH : 0);
	const naturalW = $derived(texW * fit);
	const cap = $derived(props.slice * fit);

	// Middle: source span (texW - 2*slice) has to land on dest span
	// (width - 2*cap), so the sprite is drawn at whatever full width makes that
	// true and then shifted left so its own middle starts at the right place.
	const midSrc = $derived(texW - props.slice * 2);
	const midDrawnW = $derived(midSrc > 0 ? texW * ((props.width - cap * 2) / midSrc) : naturalW);
	const midX = $derived(props.x + cap - props.slice * (midDrawnW / (texW || 1)));

	// Degenerate cases: no texture yet, or a bar narrower than its own two caps.
	// Drawing the caps over each other would be worse than one stretched sprite,
	// and a strip 100 units wide is not a case any layout in this package
	// produces anyway.
	const sliceable = $derived(texH > 0 && midSrc > 0 && props.width > cap * 2);
</script>

{#if texH > 0}
	{#if sliceable}
		<!-- left cap: full sprite at natural scale, clipped to the first `cap` units -->
		<Container>
			<Graphics
				isMask
				draw={(g) => {
					g.rect(props.x, props.y, cap, props.height);
					g.fill(0xffffff);
				}}
			/>
			<Sprite
				key={props.assetKey}
				x={props.x}
				y={props.y}
				width={naturalW}
				height={props.height}
			/>
		</Container>

		<!-- middle: stretched, clipped to the span between the caps -->
		<Container>
			<Graphics
				isMask
				draw={(g) => {
					g.rect(props.x + cap, props.y, props.width - cap * 2, props.height);
					g.fill(0xffffff);
				}}
			/>
			<Sprite
				key={props.assetKey}
				x={midX}
				y={props.y}
				width={midDrawnW}
				height={props.height}
			/>
		</Container>

		<!-- right cap: same natural scale, pushed flush to the strip's right edge -->
		<Container>
			<Graphics
				isMask
				draw={(g) => {
					g.rect(props.x + props.width - cap, props.y, cap, props.height);
					g.fill(0xffffff);
				}}
			/>
			<Sprite
				key={props.assetKey}
				x={props.x + props.width - naturalW}
				y={props.y}
				width={naturalW}
				height={props.height}
			/>
		</Container>
	{:else}
		<Sprite
			key={props.assetKey}
			x={props.x}
			y={props.y}
			width={props.width}
			height={props.height}
		/>
	{/if}
{/if}
