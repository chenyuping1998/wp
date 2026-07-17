<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { Container } from 'pixi-svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut, backOut } from 'svelte/easing';

	// One-shot entrance: fades in and settles down from a slight lift. Used to
	// stage the frame → board reveal after the loading screen.
	type Props = {
		delay?: number;
		dy?: number;
		children: Snippet;
	};

	const props: Props = $props();

	const alpha = new Tween(0);
	const y = new Tween(props.dy ?? -30);

	onMount(() => {
		alpha.set(1, { duration: 450, delay: props.delay ?? 0, easing: cubicOut });
		y.set(0, { duration: 700, delay: props.delay ?? 0, easing: backOut });
	});
</script>

<Container alpha={alpha.current} y={y.current}>
	{@render props.children()}
</Container>
