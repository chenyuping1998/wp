<script lang="ts" module>
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { CAST_SWAY, castFrame } from '../game/idleSway';
	import { idleClock, useIdleClock } from '../game/idleClock.svelte';

	/**
	 * One standing figure, swaying.
	 *
	 * Extracted so the board (Cast.svelte) and the feature splash
	 * (FreeSpinIntro.svelte) draw the same person the same way. They differ only
	 * in where and how big — and in one thing that matters: on the splash the
	 * figure must NOT be dimmed by the scrim that darkens everything else, which
	 * is only possible if it is drawn on the splash's own side of that scrim
	 * rather than under it.
	 *
	 * Native sizes from design/build_cast_figures.py. Held here rather than
	 * measured at runtime because the sprite has to be positioned before its
	 * texture resolves, and a figure that jumps into place when its PNG arrives is
	 * worse than one that fades in already standing.
	 */
	export const CAST_NATIVE = { guy: { w: 266, h: 819 }, girl: { w: 224, h: 775 } };
</script>

<script lang="ts">
	type Props = {
		who: 'guy' | 'girl';
		/** horizontal centre, in the caller's container space */
		x: number;
		/** top of the figure */
		topY: number;
		/** drawn height; width follows the art's own proportions */
		height: number;
		/**
		 * The line the figure sways about. A person sways about the ground under
		 * them — when the feet are off-screen the nearest honest substitute is the
		 * bottom of the frame, because pivoting at the real feet several hundred
		 * pixels below the canvas swings the head twice as far for the same angle.
		 */
		groundY: number;
		alpha?: number;
		/**
		 * Face the other way. The art is drawn facing slightly to ITS left, which
		 * is toward the board when the figure stands on the right — except the guy,
		 * whose head is turned the other way, so he needs mirroring to look at the
		 * reels instead of off the edge of the screen.
		 */
		flip?: boolean;
		/**
		 * Grade the figure into the scene.
		 *
		 * The cut-outs are lit like daylight product art — full saturation, near-
		 * white trousers, clean white shoes — and the game behind them is a
		 * desaturated night street. That mismatch is what reads as a sticker
		 * pasted on the screen rather than a person standing in it, and it is a
		 * VALUE problem before it is a colour one: they are simply brighter than
		 * anything around them.
		 *
		 * So: a multiply tint pulls their whole range down into the scene's, a
		 * neon pool behind them says where the light is coming from, and a contact
		 * shadow puts their feet on the floor. Undefined leaves the art untouched.
		 */
		grade?: { tint: number; pool: number; poolAlpha: number };
	};

	const props: Props = $props();
	const sway = $derived(CAST_SWAY[props.who]);
	const width = $derived((props.height * CAST_NATIVE[props.who].w) / CAST_NATIVE[props.who].h);

	$effect(() => useIdleClock());
	const frame = $derived(castFrame(sway, idleClock.t));
</script>

<Container
	x={props.x}
	y={props.groundY + frame.dy * props.height}
	rotation={frame.rotation}
	scale={{ x: 1, y: frame.scaleY }}
>
	{#if props.grade}
		<!-- the light the figure is standing in, behind them -->
		<Sprite
			key="fxGlow"
			anchor={{ x: 0.5, y: 0.5 }}
			y={props.topY - props.groundY + props.height * 0.42}
			tint={props.grade.pool}
			blendMode="add"
			width={width * 1.9}
			height={props.height * 0.7}
			alpha={props.grade.poolAlpha}
		/>
		<!-- and the floor under their feet. Drawn at the ground line rather than at
		     the art's own bottom edge, which is off-screen at this size. -->
		<Graphics
			draw={(g: PixiGraphics) => {
				g.clear();
				g.ellipse(0, -6, width * 0.42, width * 0.08);
				g.fill({ color: 0x000000, alpha: 0.5 });
				g.ellipse(0, -6, width * 0.3, width * 0.05);
				g.fill({ color: 0x000000, alpha: 0.45 });
			}}
		/>
	{/if}
	<Container scale={{ x: props.flip ? -1 : 1, y: 1 }}>
		<Sprite
			key={props.who === 'guy' ? 'hmCastGuy' : 'hmCastGirl'}
			anchor={{ x: 0.5, y: 0 }}
			y={props.topY - props.groundY}
			{width}
			height={props.height}
			alpha={props.alpha ?? 1}
			tint={props.grade?.tint}
		/>
	</Container>
</Container>
