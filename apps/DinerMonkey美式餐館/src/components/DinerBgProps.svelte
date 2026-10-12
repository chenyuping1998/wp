<script lang="ts">
	/**
	 * The independent transparent cels over the day/night plates (fan, jukebox
	 * arch, OPEN sign, steam — game/meshWin/bgProps.ts DINER_BG_PROPS), drawn
	 * after BgProps.svelte's meshes. The jukebox's neon arch rides the jukebox
	 * mesh's thump (jukeboxScaleAt), squashed about the same feet.
	 */
	import { onMount } from 'svelte';
	import { Sprite } from 'pixi-svelte';
	import { DINER_BG_PROPS, JUKEBOX_FEET, jukeboxScaleAt } from '../game/meshWin/bgProps';

	type Props = { x: number; y: number; width: number; height: number };
	const props: Props = $props();
	let seconds = $state(0);
	const scale = $derived(props.width / 1920);
	const juke = $derived(jukeboxScaleAt(seconds * 1000));
	onMount(() => {
		const started = performance.now();
		let frame = 0;
		const tick = (now: number) => { seconds = (now - started) / 1000; frame = requestAnimationFrame(tick); };
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	});
</script>

{#each DINER_BG_PROPS as prop}
	{@const onJuke = prop.key === 'dinerPropJukebox'}
	{@const px = onJuke ? JUKEBOX_FEET[0] + (prop.x - JUKEBOX_FEET[0]) * juke.across : prop.x}
	{@const py = onJuke ? JUKEBOX_FEET[1] - (JUKEBOX_FEET[1] - prop.y) * juke.along : prop.y}
	<Sprite key={prop.key} anchor={0.5}
		x={props.x + px * scale}
		y={props.y + (py + (prop.motion === 'steam' ? -5 * Math.sin(seconds * 1.7) : 0)) * scale}
		width={prop.width * scale * (onJuke ? juke.across : 1)} height={prop.height * scale * (onJuke ? juke.along : 1)}
		rotation={prop.motion === 'spin' ? seconds * 1.4 : 0}
		alpha={prop.motion === 'flicker' ? (Math.sin(seconds * 5) > -0.75 ? 0.88 : 0.4)
			: prop.motion === 'glimmer' ? 0.62 + 0.2 * Math.sin(seconds * 2.2)
			: prop.motion === 'steam' ? 0.38 + 0.16 * Math.sin(seconds * 1.7) : 0.9} />
{/each}
