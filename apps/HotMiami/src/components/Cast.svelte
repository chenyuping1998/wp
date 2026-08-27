<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import { CAST_SWAY, castFrame } from '../game/idleSway';
	import { idleClock, useIdleClock } from '../game/idleClock.svelte';
	import { stateGame } from '../game/stateGame.svelte';

	/**
	 * Someone standing beside the board.
	 *
	 * The reference this game keeps being measured against (Hacksaw's Miami
	 * Mayhem) puts a full-body character at the edge of the screen in the base
	 * game and a different one in the feature, and it does two things at once:
	 * it tells the player which mode they are in without a caption, and it FILLS
	 * THE SIDE OF THE SCREEN. That second one is not decoration here — this board
	 * is 5x4 inside a 1.78 box, so it is height-bound and can never fill the
	 * width, and no amount of scaling the board changes that. Content beside the
	 * reels is the only thing that ever could.
	 *
	 * ── Which side ───────────────────────────────────────────────────────────
	 *
	 * The right. The left already carries Buy Bonus, drawn at railWidth/2 and
	 * about 200 units across, and a figure there would have the CTA sitting on
	 * its chest. The right side has nothing on it at all — turbo and autospin
	 * live in the strip — so that is where the empty space actually is.
	 *
	 * ── Which figure ─────────────────────────────────────────────────────────
	 *
	 * The guy in the base game, the woman in the feature. Same pair the intro card
	 * introduces, so a player has already met whoever is standing there — and they
	 * are NOT the two portrait symbols: the store tile's cast is a different guy
	 * and a dark-haired woman, which is what makes swapping them worth doing.
	 * Standing the H1 art beside a board with H1 on it would read as a bug.
	 *
	 * ── The motion ───────────────────────────────────────────────────────────
	 *
	 * game/idleSway.ts, CAST_SWAY. These are single flat cut-outs today, so they
	 * sway as a body only and deliberately stay near a degree — see the note
	 * there for why a flat figure has to move LESS than a rigged one, not more.
	 */
	const context = getContext();

	// The SAME container the board's housing is drawn in (BoardFrame uses
	// `<MainContainer>` and `stateGameDerived.boardLayout()`), not the standard
	// box. That is the whole reason the first version sat too far out: it was
	// positioned as a fraction of a box the board is not measured in, so "near the
	// board" was a guess that happened to be 147px wrong. Here the figure's inner
	// edge is derived FROM the board's own edge, so it cannot drift.
	const layout = $derived(context.stateGameDerived.boardLayout());
	const box = $derived(context.stateLayoutDerived.mainLayout());

	const isFeature = $derived(stateGame.gameType !== 'basegame');
	const who = $derived(isFeature ? 'girl' : 'guy');
	const sway = $derived(CAST_SWAY[who]);

	// Native sizes from design/build_cast_figures.py: guy 266x819, girl 224x775.
	// Held here rather than measured at runtime because the sprite has to be
	// positioned before its texture resolves, and a figure that jumps into place
	// when its PNG arrives is worse than one that fades in already standing.
	const NATIVE = { guy: { w: 266, h: 819 }, girl: { w: 224, h: 775 } };

	// mirrors BoardFrame's own constant
	const FRAME_SCALE = 1280 / 1110;
	// frame_edge.png's alpha bbox fills 0.938 of its square, so the housing BOX is
	// wider than the housing INK. The figure is placed against what the player can
	// see, not against a transparent margin.
	const FRAME_INK = 0.938;
	const boardInkRight = $derived(
		layout.x + layout.width * layout.scale * FRAME_SCALE * 0.5 * FRAME_INK,
	);

	// ── size and place, from the reference's own proportions ───────────────────
	//
	// Measured off the two Miami Mayhem screenshots the user supplied:
	//
	//   the band between the board's edge and the screen edge is 23.5% of width
	//   the figure FILLS that band and is cropped by the screen edge
	//   the figure's inner edge TOUCHES the board — there is no gap at all
	//   its head starts about 13% down and its legs run off the bottom
	//
	// Ours was 74% of the box height with a 147px gap: small, and marooned in
	// clear space. The gap was what actually made it read as small — a figure with
	// air on both sides is a sticker, one that touches the board is scenery.
	//
	// Filling the band means the figure has to be CROPPED, because our cut-outs
	// are 1:3.1 and the band is not that tall. That is not a compromise either:
	// the reference crops both of its characters at the thigh, and the bet strip
	// covers everything below its own top edge anyway, so the crop happens where
	// nothing is visible.
	const OVERLAP = 10;
	const BLEED = 1.12; // how far past the screen edge the figure runs
	const width = $derived((box.width - (boardInkRight - OVERLAP)) * BLEED);
	const height = $derived((width * NATIVE[who].h) / NATIVE[who].w);
	// 0.11, not 0. In the reference the character's head sits BELOW the top of the
	// board, not level with it: the board stays the tallest thing on screen and
	// the figure reads as standing behind it rather than looming over it. At 0.05
	// his head was 4px from the housing's own top edge and the two competed.
	const topY = $derived(box.height * 0.11);
	const x = $derived(boardInkRight - OVERLAP + width * 0.5);
	// A person sways about the ground under them. The feet are off-screen at this
	// size, so the pivot is the bottom of the frame instead — the nearest thing to
	// a ground line that is actually on screen. Pivoting at the real feet, 400px
	// below the canvas, would swing the head twice as far for the same angle.
	const groundY = $derived(box.height);

	$effect(() => useIdleClock());
	const frame = $derived(castFrame(sway, idleClock.t));
</script>

<MainContainer>
	<!--
		Pivoted on the ground line, which is how a standing person sways. The
		container sits on that point and the sprite hangs above it — the same
		arrangement the rigged parts use.
	-->
	<Container
		x={x}
		y={groundY + frame.dy * height}
		rotation={frame.rotation}
		scale={{ x: 1, y: frame.scaleY }}
	>
		<Sprite
			key={who === 'guy' ? 'hmCastGuy' : 'hmCastGirl'}
			anchor={{ x: 0.5, y: 0 }}
			y={topY - groundY}
			{width}
			{height}
			alpha={0.96}
		/>
	</Container>
</MainContainer>
