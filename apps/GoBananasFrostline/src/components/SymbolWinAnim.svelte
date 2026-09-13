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
			// Pixi 8: path, then fill/stroke.
			//
			// Both rings were invisible — `lineStyle` emits no geometry in v8 — so a
			// winning symbol got the soft filled disc and neither of the two crisp
			// rings that are supposed to define it. And because the stroke style
			// survives `clear()`, from the second frame on the filled disc was
			// itself outlined with the leftover 1.5px white, putting a hard edge at
			// r=0.54 where the design wants it at r=0.44. Inherited from Go Bananas
			// 100.
			g.circle(0, 0, SYMBOL_SIZE * 0.54);
			g.fill({ color: 0xffe050, alpha: 0.08 + 0.14 * pulse });
			g.circle(0, 0, SYMBOL_SIZE * 0.49);
			g.stroke({ width: 3.5, color: 0xffe050, alpha: 0.35 + 0.45 * pulse });
			g.circle(0, 0, SYMBOL_SIZE * 0.44);
			g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.2 + 0.3 * pulse });
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
