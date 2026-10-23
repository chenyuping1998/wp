<script lang="ts">
	import { Container, Sprite, Text } from 'pixi-svelte';
	import { TITLE_FONT, TITLE_FONT_WEIGHT } from '../game/fonts';
	type Props = { text: string; artKey?: string; width: number; height: number; x?: number; y?: number; anchor?: number | {x: number; y: number}; fill?: number };
	const props: Props = $props();
	const ax = $derived(typeof props.anchor === 'number' ? props.anchor : props.anchor?.x ?? 0);
	const ay = $derived(typeof props.anchor === 'number' ? props.anchor : props.anchor?.y ?? 0);
	const fontSize = $derived(Math.min(props.height * .43, props.width * .81 / Math.max(1, props.text.length * .69)));
</script>
<Container x={props.x ?? 0} y={props.y ?? 0}>
	{#if props.artKey}<Sprite key={props.artKey} anchor={props.anchor ?? 0} width={props.width} height={props.height} />{/if}
	{#if props.artKey !== 'hmLogo'}<Text text={props.text} anchor={0.5} x={props.width * (.5 - ax)} y={props.height * (.5 - ay)}
		rotation={-.035} style={{ fontFamily: TITLE_FONT, fontWeight: TITLE_FONT_WEIGHT, fontSize,
			fill: props.fill ?? 0xf7f5f0, stroke: {color: 0x121212, width: Math.max(2, fontSize*.08)}}} />{/if}
</Container>
