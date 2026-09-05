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
	onpointerover={() => {
		if (disabled) return;
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
	onpointerup={() => {
		if (disabled) return;
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
