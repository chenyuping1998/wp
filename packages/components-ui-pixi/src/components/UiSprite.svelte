<script lang="ts" module>
	import { Rectangle, type RectangleProps } from 'pixi-svelte';

	export type Props = RectangleProps & {
		// slot name — a game can map this to plate artwork via uiTheme.sprites
		key?: string;
		// Radians, about the sprite's anchor. Only meaningful for a themed plate:
		// the fallback Rectangle below is a plain panel and turning one would just
		// put a tilted box in the layout. Defaults to 0, so nothing that does not
		// ask for it moves.
		rotation?: number;
		// the themed plate's blend. `blendMode` never reached it (it is dropped
		// here, and ButtonBuyBonus's callers have always rendered normal because
		// of that — so it stays dropped, for them). UiButton's hover plate, meant
		// to be ADDITIVE light, drew as an opaque tinted copy of the plate on top
		// of the icon, and the icon vanished under the cursor (Strike Monkey,
		// 2026-10-10); it passes this instead. Undefined: normal, as before.
		plateBlend?: import('pixi.js').BLEND_MODES;
	};
</script>

<script lang="ts">
	import { Sprite } from 'pixi-svelte';

	import { uiTheme } from '../theme.svelte';

	const props: Props = $props();
	const width = $derived(props.width ?? 120);
	const height = $derived(props.height ?? 120);
	const borderRadius = $derived(props.borderRadius ?? 34);
	const backgroundColor = $derived(props.backgroundColor ?? uiTheme.buttonFill);
	const borderColor = $derived(props.borderColor ?? uiTheme.buttonBorder);
	const borderWidth = $derived(props.borderWidth ?? 6);

	// themed plate art for this slot, if the game supplied one
	const spriteKey = $derived(
		props.key ? uiTheme.sprites[props.key as keyof typeof uiTheme.sprites] : undefined,
	);
</script>

{#if spriteKey}
	<Sprite
		key={spriteKey}
		x={props.x}
		y={props.y}
		anchor={props.anchor}
		{width}
		{height}
		alpha={props.alpha}
		tint={props.tint}
		rotation={props.rotation ?? 0}
		blendMode={props.plateBlend}
	/>
{:else}
	<Rectangle
		{...props}
		{width}
		{height}
		{borderRadius}
		{backgroundColor}
		{borderColor}
		{borderWidth}
	/>
{/if}
