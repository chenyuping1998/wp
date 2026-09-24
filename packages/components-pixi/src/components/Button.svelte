<script lang="ts" module>
	import type { Snippet } from 'svelte';

	import {
		Container,
		Rectangle,
		anchorToPivot,
		type ContainerProps,
		type Sizes,
		type PixiPoint,
	} from 'pixi-svelte';

	type ContainerPropsToOmit =
		| 'eventMode'
		| 'cursor'
		| 'pivot'
		| 'children'
		| 'onpointerover'
		| 'onpointerout'
		| 'onpointerdown'
		| 'onpointerup'
		| 'onpointerupoutside';

	export type Props = Omit<ContainerProps, ContainerPropsToOmit> & {
		sizes: Sizes;
		onpress: () => void;
		// Optional, and absent by default so nothing that does not pass them can
		// change behaviour. They exist for hold-to-repeat controls (the stake
		// steppers): `onpress` still fires once on release, exactly as before, and
		// the repeat lives entirely in the caller.
		onpressstart?: () => void;
		onpressend?: () => void;
		disabled?: boolean;
		anchor?: PixiPoint;
		children: Snippet<
			[
				{
					center: { x: number; y: number };
					hovered: boolean;
					pressed: boolean;
				},
			]
		>;
		debug?: boolean;
	};
</script>

<script lang="ts">
	const {
		children,
		sizes,
		anchor,
		disabled,
		onpress,
		onpressstart,
		onpressend,
		debug,
		...containerProps
	}: Props = $props();
	const center = $derived({
		x: sizes.width * 0.5,
		y: sizes.height * 0.5,
	});

	let hovered = $state(false);
	let pressed = $state(false);

	$effect(() => {
		if (disabled) {
			hovered = false;
			pressed = false;
		}
	});
</script>

<Container
	{...containerProps}
	eventMode="static"
	cursor={disabled ? 'not-allowed' : 'pointer'}
	pivot={anchorToPivot({ sizes, anchor })}
	onpointerover={(event) => {
		// Hover is a mouse/pen state. A finger fires pointerover on tap and no
		// pointerout when it lifts, so on a phone the highlight stuck on whatever
		// was last tapped — the Bet panel stayed lit after every tap. Stake review
		// scored that as poor UI (Deadwood Express, 2026-09-23).
		if (disabled || event.pointerType === 'touch') return;
		hovered = true;
	}}
	onpointerout={() => {
		if (disabled) return;
		hovered = false;
	}}
	onpointerdown={() => {
		if (disabled) return;
		pressed = true;
		onpressstart?.();
	}}
	onpointerup={(event) => {
		if (disabled) return;
		if (event.pointerType === 'touch') hovered = false;
		pressed = false;
		onpressend?.();
		onpress();
	}}
	onpointerupoutside={() => {
		// Releasing off the control. Without this the button keeps `pressed` true
		// forever — it renders as held down and, once a caller starts a repeat on
		// pointerdown, that repeat never stops. `onpress` is deliberately NOT
		// fired: dragging off a button and letting go is the universal way to
		// cancel a press.
		if (disabled) return;
		pressed = false;
		onpressend?.();
	}}
>
	{#if debug}
		<Rectangle
			width={sizes.width}
			height={sizes.height}
			alpha={0.5}
			borderWidth={2}
			borderColor={0xffffff}
		/>
	{/if}
	{@render children({ center, hovered, pressed })}
</Container>
