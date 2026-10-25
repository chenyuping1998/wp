<script lang="ts">
	import { Graphics } from 'pixi-svelte';
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

	// 2026-10-23: the tease in the game's flat print (navy / brass / crimson,
	// as the bet bar and the plaques) instead of a gold glow strobing on a sine.
	// The frame CLOSES IN on the reel (inset 26px -> 0 on a quick ease with an
	// overshoot, spine-generator's strike), then the tension is a heartbeat:
	// two beats close together, a rest, the rest shortening while it spins.
	let t = $state(0);
	let finished = $state(false);

	// Drawn entirely here rather than through the old `anticipation` spine: that
	// asset is template art from a mining game (rocks, dust, sparks) whose
	// artwork sat off-centre — it was the bright block that showed up at the top
	// left — and it was only ~1.6 cells tall, so it never framed the reel.
	const x = $derived(getSymbolX(props.reel.reelIndex));
	const LEFT = $derived(x - SYMBOL_SIZE / 2);

	const IN = 0.16;
	/** the frame's inset: slams in, overshoots past the cell, settles */
	const inset = $derived(
		t < IN
			? 26 * (1 - (t / IN) ** 2)
			: -5 * Math.exp(-0.45 * 2 * Math.PI * 5 * (t - IN)) * Math.sin(2 * Math.PI * 5 * 0.89 * (t - IN)) / 0.6,
	);
	/** 0..1: lub-dub, a beat every 0.9s tightening to 0.6s */
	const beat = $derived.by(() => {
		if (t < IN) return 0;
		const u = t - IN;
		const period = Math.max(0.6, 0.9 - u * 0.12);
		const p = (u % period) / period;
		const thump = (c: number, w: number) => Math.max(0, 1 - Math.abs(p - c) / w) ** 2;
		return Math.max(thump(0.06, 0.08), 0.6 * thump(0.24, 0.08));
	});

	onMount(() => {
		// offset per reel: two reels teasing at once beat a little apart
		const start = performance.now() - props.reel.reelIndex * 70;
		let raf = 0;
		const tick = (now: number) => {
			t = Math.max(0, (now - start) / 1000);
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
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
	<Graphics
		draw={(g) => {
			// PIXI v8 API (fill/stroke after each shape): the v7 beginFill shim
			// gives every shape the LAST style set.
			const h = BOARD_SIZES.height;
			const i = inset;
			g.clear();
			// crimson wash, swelling on each beat
			g.roundRect(LEFT + 4, 4, SYMBOL_SIZE - 8, h - 8, 10).fill({ color: 0x962e38, alpha: 0.1 + 0.16 * beat });
			// the frame: ink, brass, crimson hairline — flat, no glow
			g.roundRect(LEFT + 2 - i, 2 - i, SYMBOL_SIZE - 4 + 2 * i, h - 4 + 2 * i, 12).stroke({ width: 9, color: 0x05090d, alpha: 0.85 });
			g.roundRect(LEFT + 2 - i, 2 - i, SYMBOL_SIZE - 4 + 2 * i, h - 4 + 2 * i, 12).stroke({ width: 5, color: 0xd9b56b, alpha: 0.85 + 0.15 * beat });
			g.roundRect(LEFT + 9 - i, 9 - i, SYMBOL_SIZE - 18 + 2 * i, h - 18 + 2 * i, 7).stroke({ width: 2, color: 0x962e38, alpha: 0.7 + 0.3 * beat });

			// cell ticks so the frame reads as five slots, not a tube
			for (let row = 1; row < BOARD_SIZES.height / SYMBOL_SIZE; row++) {
				const y = row * SYMBOL_SIZE;
				g.moveTo(LEFT + 16, y);
				g.lineTo(LEFT + SYMBOL_SIZE - 16, y);
			}
			g.stroke({ width: 1.5, color: 0xd9b56b, alpha: 0.25 });

			// two brass kunai points aimed at the column, pressing in on the beat
			const gap = 12 + i - 7 * beat;
			for (const [tipY, dir] of [[-gap, -1], [h + gap, 1]] as const) {
				g.poly([x, tipY, x - 13, tipY + dir * 26, x + 13, tipY + dir * 26]).fill({ color: 0xd9b56b }).stroke({ width: 3, color: 0x05090d });
			}
		}}
	/>
</BoardContainer>
