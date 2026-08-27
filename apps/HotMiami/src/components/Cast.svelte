<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import { uiTheme } from 'components-ui-pixi';

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
	const box = $derived(context.stateLayoutDerived.mainLayoutStandard());

	const isFeature = $derived(stateGame.gameType !== 'basegame');
	const who = $derived(isFeature ? 'girl' : 'guy');
	const sway = $derived(CAST_SWAY[who]);

	// Native sizes from design/build_cast_figures.py: guy 266x819, girl 224x775.
	// Held here rather than measured at runtime because the sprite has to be
	// positioned before its texture resolves, and a figure that jumps into place
	// when its PNG arrives is worse than one that fades in already standing.
	const NATIVE = { guy: { w: 266, h: 819 }, girl: { w: 224, h: 775 } };

	// Its feet sit on the strip's top edge, not on the canvas floor — the strip is
	// a panel laid on the screen (uiTheme.barFrameBottom) and a figure standing
	// behind it would be cut off at the shins.
	const FLOOR_GAP = 6;
	const floorY = $derived(box.height - uiTheme.barHeight + uiTheme.barFrameBottom - FLOOR_GAP);
	// Tall enough to read as a person rather than a decal, short enough that the
	// head clears the board's top edge line. 0.74 puts the guy at 606 units on a
	// 1080 box, which is 4px taller than the board's own housing.
	const height = $derived(box.height * 0.74);
	const width = $derived((height * NATIVE[who].w) / NATIVE[who].h);
	// Pushed off the right edge by a fraction of himself, so part of the figure
	// runs off-screen the way the reference's does. A whole figure floating in
	// clear space reads as a sticker; one that is cropped by the frame reads as
	// standing in a place that continues past it.
	const x = $derived(box.width - width * 0.42);

	$effect(() => useIdleClock());
	const frame = $derived(castFrame(sway, idleClock.t));
</script>

<MainContainer standard>
	<!--
		Pivoted on the floor under the figure: a person sways about their feet.
		The container sits on that point and the sprite hangs above it, which is
		the same arrangement the rigged parts use.
	-->
	<Container
		x={x}
		y={floorY + frame.dy * height}
		rotation={frame.rotation}
		scale={{ x: 1, y: frame.scaleY }}
	>
		<Sprite
			key={who === 'guy' ? 'hmCastGuy' : 'hmCastGirl'}
			anchor={{ x: 0.5, y: 1 }}
			{width}
			{height}
			alpha={0.96}
		/>
	</Container>
</MainContainer>
