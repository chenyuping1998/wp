<script lang="ts">
	import { Container, Sprite, Graphics } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';

	type Props = {
		x?: number;
		y?: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	// pulse 0→1→0 at ~1.4 Hz
	let pulse = $state(0);

	onMount(() => {
		// Signal complete immediately so the game state machine isn't blocked.
		// The visual animation continues looping until the component is destroyed.
		props.oncomplete?.();

		// own phase and a slightly different rate per symbol — pulsing every
		// winning symbol in sync reads as one object breathing, not five
		const phase = Math.random() * Math.PI * 2;
		const rate = 225 * (0.9 + Math.random() * 0.2);
		const id = setInterval(() => {
			pulse = 0.5 + 0.5 * Math.sin(Date.now() / rate + phase);
		}, 32);

		return () => clearInterval(id);
	});
</script>

<!--
  Programmatic win animation: scale pulse + golden glow ring behind the symbol.
  Uses the existing wildPartySymbols PNG sprites — no external spine required.
-->
<Container x={props.x} y={props.y} scale={1 + 0.18 * pulse}>
	<!-- Outer glow ring -->
	<Graphics
		draw={(g) => {
			g.clear();
			// GO BANANAS 100'S WIN HALO — what it actually SHOWS, not what its code
			// says.
			//
			// GB100's code draws a soft gold disc and two crisp rings inside it (a
			// 3.5px gold one at r 0.49 and a 1.5px white one at r 0.44). Under Pixi 8
			// neither ring has ever rendered: `lineStyle` is a deprecation shim that
			// sets the stroke style and emits no geometry. And because that style
			// survives `clear()`, from the second frame on the disc's own `endFill`
			// strokes it with the leftover 1.5px white. So what a GB100 player sees
			// on a winning symbol is the soft gold glow with ONE thin white rim at the
			// disc's edge, pulsing with the scale.
			//
			// This game fixed the dead strokes, and the two rings appeared: a bold
			// gold hoop and a second white one on every scoring symbol, which is a
			// much louder win than the one GB100 shipped. Asked to present scoring
			// symbols the way GB100 does, this reproduces GB100's rendered result on
			// purpose, in working v8 calls — the glow and its single rim — rather
			// than restoring the bug that produced it.
			g.circle(0, 0, SYMBOL_SIZE * 0.54)
				.fill({ color: 0xffe050, alpha: 0.08 + 0.14 * pulse })
				.stroke({ width: 1.5, color: 0xffffff, alpha: 0.2 + 0.3 * pulse });
		}}
	/>
	<!-- Symbol sprite -->
	<Sprite
		anchor={0.5}
		key={props.symbolInfo.assetKey}
		width={SYMBOL_SIZE * props.symbolInfo.sizeRatios.width}
		height={SYMBOL_SIZE * props.symbolInfo.sizeRatios.height}
	/>
</Container>
