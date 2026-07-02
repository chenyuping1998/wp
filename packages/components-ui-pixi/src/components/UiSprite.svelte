<script lang="ts" module>
	import { Rectangle, type RectangleProps } from 'pixi-svelte';

	export type Props = RectangleProps;
</script>

<script lang="ts">
	const props: Props = $props();
	const width = $derived(props.width ?? 120);
	const height = $derived(props.height ?? 120);
	const borderRadius = $derived(props.borderRadius ?? 34);
	const backgroundColor = $derived(props.backgroundColor ?? 0xd64dff);
	const borderColor = $derived(props.borderColor ?? 0xffbf4a);
	const borderWidth = $derived(props.borderWidth ?? 6);
</script>

<Rectangle
	{...props}
	{width}
	{height}
	{borderRadius}
	{backgroundColor}
	{borderColor}
	{borderWidth}
/>

<!-- ADD YOUR DESIGN -->

<!-- <script lang="ts" module>
	import { Sprite, type SpriteProps } from 'pixi-svelte';
	import type { sharedAssetsPixi } from 'constants-shared/assets';

	export type Props = SpriteProps & {
		key: keyof typeof sharedAssetsPixi;
	};
</script>

<script lang="ts">
	const props: Props = $props();
</script>

<Sprite {...props} /> -->
