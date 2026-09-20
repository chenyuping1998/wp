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
		| 'onpointerup';

	export type Props = Omit<ContainerProps, ContainerPropsToOmit> & {
		sizes: Sizes;
		onpress: () => void;
		/**
		 * Called whenever the hovered state changes.
		 *
		 * `hovered` is already handed to the children snippet, which is enough for
		 * anything drawn from it. This exists for the other case: a button whose
		 * PARENT has to run something while the pointer is over it — an animation
		 * clock, a sound — where the state is needed in script scope rather than in
		 * markup, and a snippet argument cannot reach.
		 *
		 * Fires on leave as well as enter, and fires with false when the button
		 * becomes disabled underneath the pointer, so a caller can always trust the
		 * last value it was given.
		 */
		onhover?: (hovered: boolean) => void;
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
	const { children, sizes, anchor, disabled, onpress, onhover, debug, ...containerProps }: Props =
		$props();
	const center = $derived({
		x: sizes.width * 0.5,
		y: sizes.height * 0.5,
	});

	let hovered = $state(false);
	let pressed = $state(false);

	const setHovered = (value: boolean) => {
		if (hovered === value) return;
		hovered = value;
		onhover?.(value);
	};

	$effect(() => {
		if (disabled) {
			setHovered(false);
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
		setHovered(true);
	}}
	onpointerout={() => {
		if (disabled) return;
		setHovered(false);
	}}
	onpointerdown={() => {
		if (disabled) return;
		pressed = true;
	}}
	onpointerup={() => {
		if (disabled) return;
		pressed = false;
		onpress();
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
