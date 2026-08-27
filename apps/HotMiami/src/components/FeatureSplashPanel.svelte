<script lang="ts">
	import { Container, Graphics, Text } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import type { Graphics as PixiGraphics } from 'pixi.js';

	import { getContext } from '../game/context';
	import { BODY_FONT, DISPLAY_FONT, DISPLAY_FONT_WEIGHT } from '../game/fonts';
	import type { FeatureTier } from '../game/featureTiers';

	/**
	 * The panel that says WHAT feature just opened.
	 *
	 * Until this existed the free-spin splash announced a number and nothing else:
	 * a player who landed three Scatters was shown "FREE SPINS / 10 / AWARDED" and
	 * sent into NEON NIGHTS without ever being told what NEON NIGHTS is — and the
	 * three tiers play differently, which is the entire reason there are three.
	 *
	 * Modelled on Hacksaw's Miami Mayhem feature splash (`atlas/fs_splash`, its
	 * `showDialog()` on FeatureEnterState). What is taken from it is the SHAPE,
	 * not the art:
	 *
	 *   · one panel, not three — this is a single feature, so it gets the room
	 *   · the tier's NAME is the largest thing on it, above the spin count
	 *   · the description is a wrapped block in a box far larger than the intro
	 *     card's cards (theirs is 690x380 against the intro's 420x180)
	 *   · a click prompt at the foot, and nothing advances on a timer
	 *
	 * Their description sits at y 0.2 of the panel for two tiers and 0.1 for the
	 * third, because that tier's copy is longer. Ours are written to one length
	 * instead (featureTiers.ts, `splash`), which is the same fix done earlier
	 * rather than later.
	 */
	type Props = {
		tier: FeatureTier;
		/** panel top, in main-layout pixels */
		y: number;
		width: number;
	};

	const props: Props = $props();
	const context = getContext();

	const layout = $derived(context.stateLayoutDerived.mainLayout());

	// The reference's box is 690 wide on an 819-wide panel — 84%. Ours is measured
	// against the board rather than a panel image, because that is what our splash
	// is centred on and what the plaque above it is already the width of.
	const PAD_X = $derived(props.width * 0.075);
	const textWidth = $derived(props.width - PAD_X * 2);
	const fontSize = $derived(Math.max(13, Math.min(19, props.width * 0.036)));
	const titleSize = $derived(Math.max(20, Math.min(38, props.width * 0.072)));

	// Height is not measured from the rendered text — a Text's own height is only
	// known after it lays out, and reading it back to size the box behind it makes
	// the box arrive a frame late and pop. Three lines at this width is what the
	// longest `splash` string wraps to; the box is drawn for four so a longer one
	// cannot overflow it.
	const LINE_HEIGHT = $derived(fontSize * 1.45);
	const bodyHeight = $derived(LINE_HEIGHT * 3);
	// Where each block starts, measured from the panel's top. The title is anchored
	// by its TOP (anchor y 0), so the body has to clear the title's own height —
	// the first version put the body at titleSize * 1.5 from the panel top while
	// the title started at PAD_X * 0.75, which left them overlapping by about a
	// line and drew the body straight through the name.
	const titleY = $derived(PAD_X * 0.6);
	const bodyY = $derived(titleY + titleSize * 1.35);
	const panelHeight = $derived(bodyY + bodyHeight + PAD_X * 0.6);
</script>

<MainContainer>
	<Container x={layout.width * 0.5} y={props.y}>
		<Graphics
			draw={(g: PixiGraphics) => {
				const w = props.width;
				const h = panelHeight;
				g.clear();
				// A framed plate in the same language as the bet strip's readouts and
				// the reel housing: deep indigo fill, a lit edge in the TIER'S OWN
				// colour, and a hairline inside it. The tier colour on the frame is
				// what makes three otherwise identical panels tell themselves apart at
				// a glance, before any word is read.
				g.roundRect(-w / 2, 0, w, h, 18);
				g.fill({ color: 0x140a30, alpha: 0.92 });
				g.stroke({ width: 4, color: props.tier.accent, alpha: 0.95 });
				g.roundRect(-w / 2 + 7, 7, w - 14, h - 14, 12);
				g.stroke({ width: 1.5, color: 0xfff4ff, alpha: 0.16 });
			}}
		/>

		<Text
			anchor={{ x: 0.5, y: 0 }}
			y={titleY}
			text={props.tier.title}
			style={{
				fontFamily: DISPLAY_FONT,
				fontWeight: DISPLAY_FONT_WEIGHT,
				fontSize: titleSize,
				letterSpacing: 3,
				fill: props.tier.accent,
				stroke: 0x1a0838,
				strokeThickness: 4,
				dropShadow: true,
				dropShadowColor: 0x000000,
				dropShadowBlur: 8,
				dropShadowDistance: 2,
			}}
		/>

		<!--
			Body copy in the BODY face, not the display face. Titan One is a heavy
			rounded display type and this is a real paragraph — the same split the
			rules and paytable modals already make, and the same one the reference
			makes by dropping from its 50px feature title to a 30px feature body.
		-->
		<Text
			anchor={{ x: 0.5, y: 0 }}
			y={bodyY}
			text={props.tier.splash}
			style={{
				fontFamily: BODY_FONT,
				fontWeight: '600',
				fontSize,
				letterSpacing: 1.2,
				lineHeight: LINE_HEIGHT,
				align: 'center',
				wordWrap: true,
				wordWrapWidth: textWidth,
				fill: 0xffe6f7,
				stroke: 0x1a0838,
				strokeThickness: 3,
			}}
		/>
	</Container>
</MainContainer>
