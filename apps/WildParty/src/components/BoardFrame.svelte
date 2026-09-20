<script lang="ts" module>
	export type EmitterEventBoardFrame =
		| { type: 'boardFrameGlowShow' }
		| { type: 'boardFrameGlowHide' };
</script>

<script lang="ts">
	import { Sprite, SpineProvider, SpineTrack } from 'pixi-svelte';

	import { getContext } from '../game/context';

	const context = getContext();
	const SPINE_SCALE = { width: 0.62, height: 0.66 };

	// Neon Y2K chrome housing (design/build_neon_y2k_assets.py). Both numbers are
	// derived from the art, not tuned by eye — the build script prints the window
	// geometry every run, so regenerating the frame tells you whether these still
	// hold.
	//
	// Measured window: 83.9% x 79.6% of the 1494x946 art. Both scales are
	// expressed against the board WIDTH — that is how the sprite below is sized —
	// and target the board plus a 4% breathing gap:
	//   width  = 1.04 / 0.839       = 1.240
	//   height = 0.6 * 1.04 / 0.796 = 0.784
	//
	// Those window percentages are not what the generator produced. It drew a
	// thick cabinet (window 67.5% of the art), which at this board size puts the
	// housing at 1109px across a 1422px layout box — wide enough to run under the
	// Buy Bonus CTA and the readout plates. The build script rebuilds the texture
	// as a nine-patch so the bezel is thin relative to the window without any
	// feature being cropped; see rebuild_frame_nine_patch(). The result draws at
	// 893px, essentially the 902px footprint the side-rail layout was tuned for.
	const SPRITE_SCALE = { width: 1.24, height: 0.784 };

	// The rebuilt texture is very nearly window-centred (8 art-px high), so this
	// is now almost nothing: 8 * 0.597 drawn scale = 5px.
	const Y_OFFSET = 5;
	// 1, not 1.01.
	//
	// This was a multiplier on the board's centre COORDINATE, which is not an
	// offset — it scales with position, so it pushed the housing right and down by
	// 1% of wherever the board happened to sit. At boardLayout().x = 711 that is
	// 7.1 layout px, ~6px on screen. Measured off the running game: the symbol
	// columns centred on 640 while frame_bg and frame_edge both centred on 646.
	//
	// Six pixels is small enough to look like "the symbols are not centred in
	// their cells" rather than "the frame is off", which is exactly how it was
	// reported — the reels were correct and the housing, with its cell lattice,
	// was the thing lying.
	//
	// Whatever asymmetry in the old ornate art this was compensating for is gone
	// with that art. The new housing is symmetrical by construction.
	const POSITION_ADJUSTMENT = 1;

	type AnimationName = 'reelhouse_glow_start' | 'reelhouse_glow_idle' | 'reelhouse_glow_exit';

	let animationName = $state<AnimationName | undefined>(undefined);
	let loop = $state(false);

	context.eventEmitter.subscribeOnMount({
		boardFrameGlowShow: () => {
			animationName = 'reelhouse_glow_start';
			loop = false;
		},
		boardFrameGlowHide: () => {
			if (animationName) animationName = 'reelhouse_glow_exit';
		},
	});
</script>

{#if animationName}
	<SpineProvider
		zIndex={-1}
		key="reelhouse"
		x={context.stateGameDerived.boardLayout().x * POSITION_ADJUSTMENT}
		y={context.stateGameDerived.boardLayout().y * POSITION_ADJUSTMENT}
		width={context.stateGameDerived.boardLayout().width * SPINE_SCALE.width}
		height={context.stateGameDerived.boardLayout().height * SPINE_SCALE.height}
	>
		<SpineTrack
			trackIndex={0}
			{animationName}
			{loop}
			listener={{
				complete: (entry) => {
					if (entry.animation) {
						if (entry.animation.name === 'reelhouse_glow_start') {
							animationName = 'reelhouse_glow_idle';
							loop = true;
						}

						if (entry.animation.name === 'reelhouse_glow_exit') {
							animationName = undefined;
							loop = false;
						}
					}
				},
			}}
		/>
	</SpineProvider>
{/if}

<!-- interior backdrop: sized to just cover the window so it never peeks out
     from behind the housing -->
<Sprite
	key="frameBg"
	anchor={0.5}
	x={context.stateGameDerived.boardLayout().x * POSITION_ADJUSTMENT}
	y={context.stateGameDerived.boardLayout().y * POSITION_ADJUSTMENT}
	width={context.stateGameDerived.boardLayout().width * 1.08}
	height={context.stateGameDerived.boardLayout().width * 0.67}
/>

<Sprite
	key="frameEdge"
	anchor={0.5}
	x={context.stateGameDerived.boardLayout().x * POSITION_ADJUSTMENT}
	y={context.stateGameDerived.boardLayout().y * POSITION_ADJUSTMENT + Y_OFFSET}
	width={context.stateGameDerived.boardLayout().width * SPRITE_SCALE.width}
	height={context.stateGameDerived.boardLayout().width * SPRITE_SCALE.height}
/>
