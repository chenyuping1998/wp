<script lang="ts">
	import { everyFrame } from '../game/frameLoop';
	import { Graphics, Sprite } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import type { Reel } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';

	type Props = {
		reel: Reel;
		oncomplete: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	let pulse = $state(0);
	let finished = $state(false);

	// Drawn entirely here rather than through the old `anticipation` spine: that
	// asset is template art from a mining game (rocks, dust, sparks) whose
	// artwork sat off-centre — it was the bright block that showed up at the top
	// left — and it was only ~1.6 cells tall, so it never framed the reel.
	const x = $derived(getSymbolX(props.reel.reelIndex));
	const LEFT = $derived(x - SYMBOL_SIZE / 2);

	onMount(() => {
		// offset per reel: when several reels tease at once, a shared phase makes
		// them strobe as one block instead of shimmering along the board
		const phase = props.reel.reelIndex * 0.9;
		const rate = 145 + props.reel.reelIndex * 11;
		const id = everyFrame(() => {
			pulse = 0.5 + 0.5 * Math.sin(Date.now() / rate + phase);
		});

		return () => id();
	});

	$effect(() => {
		// Stop immediately when reel stops to avoid the heavy "falling/landing" outro feel.
		if (!finished && props.reel.reelState.motion === 'stopped') {
			finished = true;
			props.oncomplete();
		}
	});
</script>

<BoardContainer>
	<!-- a column of warm light down the held reel, under the rim: additive, a
	     plain sibling of the rim (nothing masked), so it lifts the symbols
	     instead of tinting them -->
	<Sprite key="fxGlow" anchor={0.5} x={x} y={BOARD_SIZES.height / 2} blendMode="add" tint={0xe6c27a}
		width={SYMBOL_SIZE * 1.5} height={BOARD_SIZES.height * 1.15} alpha={0.22 + 0.16 * pulse} />
	<!-- Edge lighting leaves the moving symbol art in its original colours.
	     Gold and jade like the board frame (it was Sushi Monkey's terracotta),
	     and drawn with the v8 API: the lineStyle/drawRoundedRect shim is the one
	     that bleeds colours between calls. -->
	<Graphics
		draw={(g) => {
			const h = BOARD_SIZES.height;
			g.clear();
			// The held reel stays clear; the border and the marks carry the tease.
			g.roundRect(LEFT + 2, 2, SYMBOL_SIZE - 4, h - 4, 13).stroke({ width: 6, color: 0x1e1b1a, alpha: 0.7 });
			g.roundRect(LEFT + 2, 2, SYMBOL_SIZE - 4, h - 4, 13).stroke({ width: 4, color: 0xd6aa54, alpha: 0.7 + 0.25 * pulse });
			g.roundRect(LEFT + 7, 7, SYMBOL_SIZE - 14, h - 14, 10).stroke({ width: 2, color: 0x9fd3bd, alpha: 0.75 });
			// chevrons converging on the column from above and below
			const chev = 14 + 6 * pulse;
			for (const [tip, dir] of [[-chev, -1], [h + chev, 1]] as const) {
				g.moveTo(x - SYMBOL_SIZE * 0.12, tip + dir * 10).lineTo(x, tip).lineTo(x + SYMBOL_SIZE * 0.12, tip + dir * 10);
				g.stroke({ width: 4, color: 0xd6aa54, alpha: 0.6 + 0.3 * pulse, cap: 'round', join: 'round' });
			}
		}}
	/>
</BoardContainer>
