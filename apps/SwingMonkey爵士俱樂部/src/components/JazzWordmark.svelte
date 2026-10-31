<script lang="ts">
	import { Container, Text } from 'pixi-svelte';
	import { GAME_FONT, GAME_FONT_WEIGHT, NUMBER_FONT } from '../game/fonts';
	const props: { x?: number; y?: number; width: number } = $props();
	const words = [
		{ text: 'SWING', size: 0.105, pitch: 0.112, y: -0.065, fill: 0xd9342b, line: 0xf3e9d2 },
		{ text: 'MONKEY', size: 0.145, pitch: 0.137, y: 0.045, fill: 0xf3e9d2, line: 0xd9342b },
	];
</script>

<!-- Lettering only: no sign texture, backing plate or rectangular glow. -->
<Container x={props.x ?? 0} y={props.y ?? 0} eventMode="none">
	{#each words as word}
		{#each Array.from(word.text) as letter, i}
			{@const mid = (word.text.length - 1) / 2}
			<Container x={(i - mid) * props.width * word.pitch}
				y={props.width * (word.y + Math.abs(i - mid) * 0.005)}
				rotation={(i - mid) * 0.018 + (i % 2 ? 0.018 : -0.018)}>
				<Text text={letter} anchor={0.5} x={props.width * 0.004} y={props.width * 0.008}
					style={{ fontFamily: GAME_FONT, fontWeight: GAME_FONT_WEIGHT, fontSize: props.width * word.size,
						fill: 0x161412, stroke: { color: 0x161412, width: props.width * 0.012, join: 'round' } }} />
				<Text text={letter} anchor={0.5}
					style={{ fontFamily: GAME_FONT, fontWeight: GAME_FONT_WEIGHT, fontSize: props.width * word.size,
						fill: word.fill, stroke: { color: word.line, width: props.width * 0.004, join: 'round' } }} />
			</Container>
		{/each}
	{/each}
	<Text text="LIVE AT THE JAZZ CLUB" anchor={0.5} y={props.width * 0.15}
		style={{ fontFamily: NUMBER_FONT, fontSize: props.width * 0.023, letterSpacing: props.width * 0.004,
			fill: 0xf3e9d2, stroke: { color: 0x161412, width: 2, join: 'round' } }} />
</Container>
