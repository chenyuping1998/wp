<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { getContext } from '../game/context';
	import { swordSlashFrame, SWORD_SLASH_DURATION } from '../game/swordSlash';

	const context = getContext();
	let elapsed = $state(-1);
	let finale = $state(false);
	let raf = 0;
	const stop = () => { cancelAnimationFrame(raf); elapsed = -1; };
	onDestroy(stop);
	const stage = $derived.by(() => {
		const board = context.stateGameDerived.boardLayout();
		const layout = context.stateLayoutDerived.mainLayout();
		return { x: board.x, y: board.y, width: Math.min(layout.width * 0.92, board.width * board.scale * 1.38) };
	});
	const frame = $derived(swordSlashFrame(elapsed, stage.width, finale));
	context.eventEmitter.subscribeOnMount({
		reelSplit: ({ lead, finale: last }) => {
			if (!lead) return;
			stop();
			finale = last;
			const start = performance.now();
			// 1x in turbo as well — see ReelSplits (the chop is never sped up)
			const speed = 1;
			elapsed = 0;
			const tick = (now: number) => {
				elapsed = (now - start) * speed;
				if (elapsed >= SWORD_SLASH_DURATION) { stop(); return; }
				raf = requestAnimationFrame(tick);
			};
			raf = requestAnimationFrame(tick);
		},
		reelSplitClear: stop,
		reelSplitRestore: stop,
	});
	const draw = (g: PixiGraphics) => {
		g.clear();
		for (const ribbon of frame.ribbons) g.poly(ribbon.points).fill({ color: ribbon.color, alpha: ribbon.alpha });
		for (const spark of frame.streaks) {
			g.moveTo(spark.x, spark.y).lineTo(spark.x - spark.dx, spark.y - spark.dy)
				.stroke({ width: spark.width, color: 0xffffff, alpha: spark.alpha });
		}
		if (frame.impact > 0.01) {
			const w = stage.width;
			g.poly([-w * .11, 0, -w * .005, -w * .004, 0, -w * .065,
				w * .005, -w * .004, w * .11, 0, w * .005, w * .004,
				0, w * .065, -w * .005, w * .004]).fill({ color: 0xffffff, alpha: frame.impact * .85 });
		}
	};
</script>

{#if elapsed >= 0}
	<!-- Outside reel lighting: the blade retains its white core. This layer has
	     no interaction area and sits below the UI and win presentations. -->
	<Container x={stage.x} y={stage.y} eventMode="none">
		<Sprite key="fxGlow" anchor={0.5} width={stage.width * 0.7} height={stage.width * 0.23}
			tint={0xddefff} alpha={frame.glow} blendMode="add" />
		<Graphics {draw} blendMode="add" />
	</Container>
{/if}
