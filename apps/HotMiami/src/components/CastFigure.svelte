<script lang="ts" module>
	import { Container, Sprite } from 'pixi-svelte';

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
	<Sprite
		key={props.who === 'guy' ? 'hmCastGuy' : 'hmCastGirl'}
		anchor={{ x: 0.5, y: 0 }}
		y={props.topY - props.groundY}
		{width}
		height={props.height}
		alpha={props.alpha ?? 1}
	/>
</Container>
