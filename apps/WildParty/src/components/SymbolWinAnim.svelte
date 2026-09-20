<!--
	⚠ CURRENTLY UNREACHABLE — read this before spending time editing it.

	Symbol.svelte renders this only for `isSprite && isWin`, but every one of the
	ten symbols is built by mixedSymbol() in constants.ts, and that sets
	`win: symbolSpine(...)`. So the win state is always type 'spine' and always
	routes to SymbolSpine instead. Nothing you change here will appear in the
	game.

	The win beat is carried by the wpSp* spine animations, whose atlas pages are
	regenerated from the same source art by design/build_neon_y2k_assets.py — that
	is the file to touch for how a winning symbol looks.

	Kept, rather than deleted, because it is the fallback the moment any symbol is
	given a sprite win state, and because it is where the palette-correct
	treatment is written down.
-->
<script lang="ts">
	import { Container, Sprite, Graphics } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';
	import { symbolNeon } from '../game/palette';

	type Props = {
		x?: number;
		y?: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	// The symbol's own hue, not a shared gold. See SYMBOL_NEON in palette.ts.
	const neon = $derived(symbolNeon(props.symbolInfo.assetKey));

	// A real neon sign does not fade up — the tube strikes, stutters, and then
	// holds. This envelope is that: two fast strikes inside the first 300ms, then
	// a steady burn with a slow breath under it. The old version was a permanent
	// 1.4Hz scale pulse, which reads as "this thing is throbbing" rather than
	// "this thing just lit up", and after the third or fourth win in a row it is
	// just motion noise.
	const STRIKE = [
		[0, 0.0],
		[40, 1.0],
		[95, 0.15],
		[150, 1.0],
		[205, 0.35],
		[260, 1.0],
	] as const;

	let elapsed = $state(0);

	onMount(() => {
		// Signal complete immediately so the game state machine isn't blocked; the
		// visual keeps running until the component is destroyed.
		props.oncomplete?.();

		const start = performance.now();
		let raf = 0;
		const tick = (now: number) => {
			elapsed = now - start;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const level = $derived.by(() => {
		const t = elapsed;
		const last = STRIKE[STRIKE.length - 1];
		if (t >= last[0]) {
			// held on, with a slow breath so it stays alive without pulsing
			return 0.82 + 0.18 * (0.5 + 0.5 * Math.sin((t - last[0]) / 320));
		}
		for (let i = 1; i < STRIKE.length; i++) {
			const [t1, v1] = STRIKE[i];
			if (t < t1) {
				const [t0, v0] = STRIKE[i - 1];
				const p = (t - t0) / (t1 - t0);
				return v0 + (v1 - v0) * p;
			}
		}
		return 1;
	});

	// one small pop as the tube strikes, then settle — no sustained scaling
	const scale = $derived(1 + 0.1 * Math.max(0, 1 - elapsed / 260) * level);
</script>

<!--
	Win presentation for a static symbol: the symbol's own neon strikes on, with
	a halo of the same hue spreading outside its outline.

	NOTE: the halo is drawn with ordinary alpha, NOT blendMode 'add'. This
	component renders inside BoardContainer, which carries a mask, and in Pixi v8
	a sprite mask is a filter — the masked container is rendered into an isolated
	transparent target, so additive children have nothing to add to and the effect
	disappears. See the SKILL notes; this exact trap cost an upload before.
-->
<Container x={props.x} y={props.y} {scale}>
	<Graphics
		draw={(g) => {
			g.clear();
			// soft outer halo
			g.beginFill(neon, 0.05 + 0.16 * level);
			g.drawCircle(0, 0, SYMBOL_SIZE * 0.56);
			g.endFill();
			// tighter core halo hugging the silhouette
			g.beginFill(neon, 0.06 + 0.18 * level);
			g.drawCircle(0, 0, SYMBOL_SIZE * 0.44);
			g.endFill();
			// lit ring — the "tube" edge
			g.lineStyle(3.5, neon, 0.3 + 0.6 * level);
			g.drawCircle(0, 0, SYMBOL_SIZE * 0.5);
			// white filament inside the ring, the give-away that a tube is lit
			g.lineStyle(1.5, 0xffffff, 0.15 + 0.5 * level);
			g.drawCircle(0, 0, SYMBOL_SIZE * 0.46);
		}}
	/>
	<Sprite
		anchor={0.5}
		key={props.symbolInfo.assetKey}
		width={SYMBOL_SIZE * props.symbolInfo.sizeRatios.width}
		height={SYMBOL_SIZE * props.symbolInfo.sizeRatios.height}
	/>
</Container>
