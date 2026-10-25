import { GAME_FONT, GAME_FONT_WEIGHT } from './fonts';
import { setUiTheme } from 'components-ui-pixi';
import { stateConfig } from 'state-shared';
import { applyBuyBonusCow } from './buyBonusCow';

// Saucer Monkey bet bar (2026-10-09): ink-black casing, sepia discs, record-red accents,
// cream captions; teal only for ON toggles.
// Palette: STRIKE_美術需求單.md §0.
// Applied once at module load (imported by Game.svelte) — the shared UI package
// otherwise keeps its plum/gold defaults for other games in the workspace.
setUiTheme({
	fontFamily: GAME_FONT,
	valueFontFamily: '"Anton", "OswaldCyr", "Arial Narrow", sans-serif',
	// Titan One is single-weight; 700 would only get a synthesised bold
	fontWeight: GAME_FONT_WEIGHT,

	buttonFill: 0x222d52,
	buttonFillLight: 0xf6f0dc,
	buttonFillDisabled: 0x141a33,
	// deep amber so an ON toggle (turbo / autoplay) reads as ON at a glance,
	// while still keeping enough contrast under the cream icon art
	buttonFillActive: 0x7cf05a, // ON toggles in the mechanic colour
	buttonBorder: 0xe8433a,
	buttonIconFill: 0xf6f0dc,
	buttonIconStroke: 0x222d52,

	betFill: 0x222d52,
	betBorder: 0xf6f0dc,

	panelFill: 0x222d52,
	panelBorder: 0xe8433a,
	labelFill: 0xf6f0dc,
	balanceLabelFill: 0xf6f0dc,
	// win reads in jungle green, bet in a cooler brass so the three readouts
	// stay tellable apart without leaving the palette
	winAccent: { border: 0x222d52, label: 0xf6f0dc },
	betAccent: { border: 0xe8433a, label: 0xf6f0dc },
	valueFill: 0xf6f0dc,
	valueStroke: 0x222d52,
	valueShadow: 0x141a33,

	// One slim strip along the foot, the arrangement players arrive already
	// knowing. The side-rail version it replaces maximised board size — the rails
	// ate horizontal space the board was not using — but that is exactly why it
	// read as unfamiliar, which is what certification meant by "does not conform
	// to expected UX standards".
	//
	// To go back: 'sideRail'. LayoutSideRail is untouched and still wired up, so
	// this one word is the whole revert. It can also be overridden at run time
	// without rebuilding — see the localStorage note in UIDefault.svelte.
	betBarLayout: 'compactBottom',
	// Balance / Win / Bet up a touch: the Anton values sat on the strip's lower
	// edge (user, 2026-10-17). Every skin keeps this (none of them sets it).
	readoutOffsetY: -8,
	// Turbo ON = the same dark disc with the bolt filled solid in its outline
	// colour, no green plate (user, 2026-10-17). Autoplay keeps its lit plate.
	activeByIconOnly: ['turbo'],
	// Two-tier turbo (user, 2026-10-17): off -> one bolt -> two bolts side by
	// side. Turbo 2 lands the reels ~20% quicker again and runs the cow
	// collection at 1.5x (constants.ts SPIN_OPTIONS_*_T2, BanditCollect.svelte).
	turboTiers: 2,

	// Buy Bonus stays left of the board at its old size rather than joining the
	// strip: buying the feature is an occasional, expensive, deliberate action and
	// does not belong beside the control pressed every few seconds.
	buyBonusOnRail: false,

	// 20% smaller than the template default. The whole control, not just the
	// picture: box, hit area, plate and label together.
	buyBonusButtonScale: 0.9,

	// Unlit rather than greyed. The olive plate went pale under the template's
	// grey tint and read as a placeholder panel dropped over the jungle, with the
	// gold caption still at full brightness on top of it.
	buyBonusDisabledStyle: 'dim',

	// The hover highlight is sized and shaped to the PLATE ART, so it stays inside
	// the button instead of drawing a lighter square around it.
	//
	// Measured from design/generate_ui_plates.mjs: the plate body is drawn at
	// x=10 on a 640 canvas with a 7px stroke, so its outer edge sits at 98.1% of
	// the sprite, and its corners are rx=66 — 10.3% of the sprite width, which is
	// 10.7% of the highlight's own height at this inset.
	//
	// The defaults are a 1.0 inset plus a 3% outward pad, i.e. 6% WIDER than the
	// sprite and squarer than it: that is a highlight bigger than the thing it
	// highlights on all four sides and at every corner.
	buyBonusPlateInset: { width: 0.82, height: 0.82 },
	buyBonusHighlightPad: 0,
	buyBonusHighlightRadius: 0.107,


	// gold on the olive plate, matching every other caption in the game
	buyBonusLabelFill: 0xf6f0dc,
	buyBonusLabelSizeRatio: 0.55,
	buyBonusLabelWrapWidth: 92,
	buyBonusLabelOffsetY: -0.06,
	buyBonusPlateScale: 1.12,
	buyBonusHoverSprite: 'buyBonusGlyph',
	buyBonusHoverFrames: ['buyBonusRoll1', 'buyBonusRoll2', 'buyBonusGlyph'],
	buyBonusHoverFrameMs: 90,
	buyBonusHoverSpriteTint: 0xffffff,
	buyBonusHoverSpriteBlend: 'normal',

	// the Bet panel opens the stake menu when tapped — mark it so players can
	// tell it apart from the static Balance/Win panels
	labelAffordance: true,

	// cursor-over feedback on the rail controls
	hoverHighlight: true,
	// 2026-10-01 (user rule, every game): hover never greys a control out —
	// the control lights in the game's own red-orange instead of a white film.
	hoverPlateLight: 0xe8433a,

	// 旋轉鍵的呼吸光暈：關掉。按下就變亮的光圈是 Deadwood「poor UI」5/10 的原因之一
	spinButtonGlow: false,

	// PHONE PORTRAIT: the menu disc and the Buy Bonus plate sat at ±470 and ran
	// off both screen edges (the menu lost a third of its disc). ±440 keeps
	// both inside with ~30 units to spare and still clears turbo/autoplay.
	portraitSideButtonX: 400,
	// The bet -/+ were 27 CSS px on a 390-wide phone; 0.68 makes them ~37 and
	// leaves a visible gap to the spin button and to autoplay/turbo (0.72 all
	// but touched autoplay, checked in the sandbox 2026-09-27).
	portraitStepButtonScale: 0.68,
	// the same pair on the desktop strip: 28px -> 36px, the gap widened with it
	// so the two plates do not touch
	// − BET + in one row (compactBottom 'flank'), the stepper as large as
	// autospin/turbo: the stacked 0.36 pair was the review checker's "tiny
	// stacked stepper" and left an empty cell between Win and Bet
	stepButtonScale: 0.46,
	stepButtonGap: 28,
	stepperLayout: 'flank',
	// no Buy Bonus plate beside a running feature — it reads as an offer
	buyBonusHideInFreeSpins: true,

	// the Win figure swells and flashes gold when a win lands; the Bet figure
	// swells when the stake moves
	valuePop: 0.18,
	winFlashTint: 0xf7f4e8,

	// Hacksaw's house behaviours (see the shared theme): hold -/+ to keep
	// stepping, a short lock on the spin button after the stake changes so a
	// press cannot bet an amount not yet seen, an idle nudge on the spin button,
	// shift-key shortcuts, and panels closing when a round starts.
	platformUx: {
		betRepeatMs: 150,
		betToSpinCooldownMs: 500,
		idleReminderMs: 30000,
		idlePulseMs: 2000,
		shortcuts: true,
		keybindThrottleMs: 100,
		closePanelsOnSpin: true,
	},

	// framed plate art for the readouts and the Buy Bonus CTA (the other slots
	// keep the themed rounded rect, which suits the round buttons)
	sprites: {
		base_ticker: 'gbUiTicker',
		buyBonus: 'gbUiBuyBonus',
		buyBonusGlyph: 'gbUiBuyBonusLit',
		buyBonusRoll1: 'gbUiBuyBonusRoll1',
		buyBonusRoll2: 'gbUiBuyBonusRoll2',
	},

	// drawn brass icons in place of the template's text/emoji button glyphs
	icons: {
		menu: 'gbIconMenu',
		menuExit: 'gbIconMenuExit',
		settings: 'gbIconSettings',
		info: 'gbIconInfo',
		payTable: 'gbIconPayTable',
		soundOn: 'gbIconSoundOn',
		soundOff: 'gbIconSoundOff',
		autoSpin: 'gbIconAutoSpin',
		replay: 'gbIconReplay',
		// turbo deliberately omitted: UiButton draws it as a vector bolt so it can
		// be hollow when off and fill in when active — a static sprite can't toggle
	},
});

// ── Platform chrome (opt-in casing, opt-out at any time) ─────────────────────
//
// Everything above is this game's own drawn look: olive canvas plates, brass
// trim, gold captions, the framed housing that matches the reel frame. What
// follows replaces the CASING — not the game — with the flat dark platform
// chrome Hot Miami runs, taken from that app's uiTheme unchanged.
//
// WHY IT IS WORTH HAVING AS A SECOND SKIN rather than an opinion: the values are
// Hacksaw's, and their UI files are shared across titles — The Luxe 1.5.1 and
// Densho 1.25.1 differ by one DOM node and five CSS rules, and their 103 theme
// variables are value-identical. So these numbers are not one game's styling,
// they are the neutral casing a player has already seen on other titles, which
// is what a casing is supposed to be.
//
// ONLY COLOURS AND SHAPES ARE TAKEN. Hot Miami also moves the bar's GEOMETRY —
// barHeight 166, barFrameBottom 46, spinScale 1.12, a spin button standing
// proud of the strip. None of that is copied here, and the reason is arithmetic
// rather than taste:
//
//   stateGame.svelte.ts derives the board's position from uiTheme.barHeight, so
//   changing the bar's height moves the board. This game's housing is 4 x 140 x
//   BOARD_SHRINK 0.89 x 1.06 = 528px, a different figure from the game this skin
//   was ported from (6 x 112 there), which is exactly why its geometry cannot be
//   copied along with its colours — the margin that made a taller bar survivable
//   there is not the margin here, and neither was ever more than luck.
//
// The package is explicit that this separation is supported: barStyle "only
// changes the SHAPES, so a game can take the flat casing without giving up its
// palette, or vice versa" (packages/components-ui-pixi/src/theme.svelte.ts).
// Taking the palette and the shapes but not the geometry is the same trade in
// the third direction, and it means this skin cannot move the board by a pixel.
//
// Two more things deliberately survive the swap: the drawn brass ICON art and
// the game font. The icons are this game's own and there is no platform set to
// replace them with — the fallback is text and emoji, visibly worse.
//
// TO GO BACK, three ways, shallowest first:
//
//   localStorage.setItem('uiSkin', 'boomana')   on a build already deployed
//   localStorage.removeItem('uiSkin')            back to whatever DEFAULT_SKIN is
//   change DEFAULT_SKIN below to 'boomana'      one word, in the build
//
// Nothing above this line is edited by the swap, so 'boomana' is byte-for-byte
// the look that shipped before it.
// 'print' (2026-10-04) is this game's own: the first submission went out on
// 'platform' and came back "Poor bet UI bar" + "Reused assets" — that casing is
// Hot Miami's, and 'boomana' is Go Boomana's. Both stay switchable.
const DEFAULT_SKIN: 'print' | 'platform' | 'boomana' = 'print';

export const uiSkin =
	(typeof localStorage !== 'undefined' && localStorage.getItem('uiSkin')) || DEFAULT_SKIN;

// PUBLISHED TO THE DOM as well, because half the UI is not pixi.
//
// The bet bar is canvas and reads uiTheme directly; the modals behind the menu,
// pay table, bet menu and Auto Spin buttons are DOM, styled by CSS in
// components/ui/Modals.svelte. CSS cannot read localStorage, so the resolved
// skin is stamped on <html> and the platform palette is written as
// `html[data-ui-skin='platform'] …` rules there.
//
// Guarded for the prerender pass, where this module is evaluated with no
// document. Nothing needs it there — the attribute is only read by CSS.
if (typeof document !== 'undefined') {
	// 'print' re-dresses only the canvas bar; the DOM pop-ups keep the
	// platform rules (Modals.svelte), so it publishes as 'platform' there
	document.documentElement.dataset.uiSkin = uiSkin === 'print' ? 'platform' : uiSkin;
}

const skin = uiSkin;

if (skin === 'platform' || skin === 'print') {
	setUiTheme({
		// the strip: flat casing — in the mine's warm dark iron rather than their
		// neutral grey, so the bar belongs to the same game as the reel frame,
		// the buy menu and the counter (2026-09-27)
		barStyle: 'flat',
		barFill: 0x141a33,
		barAlpha: 1,
		// A stone hairline rather than their near-black edge, which on this strip
		// is not there at all. It is also Balance's border — see the readouts.
		// Now a muted brass: the casing's edge and Balance's border. One step
		// under the Win amber, so Win still stands out alone.
		panelBorder: 0x222d52,
		panelFill: 0x141a33,

		// Round controls: a dark disc with a thin cool-grey ring.
		//
		// Their mobile CircleButtons carry `--hg-btn-border-width: 0` and float on
		// the game art, where a flat dark disc separates itself on its own. On a grey
		// strip it does not — 0x212529 against 0x2a2a2a is a nine-level difference and
		// the control disappears — so the disc goes darker and the 1px `.Button`
		// border comes back at 2, one unit here being about a third of a CSS pixel at
		// this bar's scale. Hot Miami found the same thing and fixed it the same way.
		buttonFill: 0x141a33,
		// highlights in the dynamite amber (were their green)
		buttonFillLight: 0xe8433a,
		buttonFillDisabled: 0x222d52,
		buttonFillActive: 0x7cf05a, // ON toggles in the mechanic colour
		buttonBorder: 0x222d52,
		buttonBorderWidth: 2,
		buttonBorderWidthActive: 5,
		buttonIconFill: 0xf6f0dc,
		buttonIconStroke: 0x141a33,

		// The spin button is the one control the platform palette colours. It
		// was their green; it is the dynamite amber now, the colour of every
		// "press this" in the game (the buy buttons, the fuse sparks).
		betFill: 0xe8433a,
		betBorder: 0x222d52,

		// THE READOUTS, AS GO BANANAS BOAT DOES THEM: Balance and Bet in the bar's
		// quiet material, and WIN alone picked out in the game's accent.
		//
		// Win is the only readout that changes because of the game rather than the
		// player, and it is the number the eye goes looking for after every spin,
		// so it is the one that gets colour. Boat's metal is brass on navy steel;
		// this game's is the fuse's amber on the royals' stone:
		//
		//   Balance   stone edge #6e5e4a, pale stone label — it is drawn on
		//             panelBorder directly (LayoutBottomBar), so it shares the
		//             casing's edge, which is where it belongs anyway
		//   Bet       the same label on a dimmer edge, the quietest of the three
		//   Win       amber edge #c07a14, spark label #ffc45a
		//
		// Values in the pale stone's cream rather than white, as Boat's are in
		// cream: white on the dark strip glares over a long session.
		labelFill: 0xf6f0dc,
		balanceLabelFill: 0xf6f0dc,
		winAccent: { border: 0xe8433a, label: 0xff5c4a },
		betAccent: { border: 0x222d52, label: 0xf6f0dc },
		valueFill: 0xf6f0dc,
		valueStroke: 0x141a33,
		valueShadow: 0x141a33,
		// Dark lettering on the sign's cream centre.
		buyBonusLabelFill: 0x141a33,

		// Keep the bowling sign in the platform and print skins. setUiTheme
		// replaces the sprite map, so both states must be mapped together.
		sprites: {
			buyBonus: 'gbUiBuyBonusStone', buyBonusGlyph: 'gbUiBuyBonusStoneLit',
			buyBonusRoll1: 'gbUiBuyBonusStoneRoll1', buyBonusRoll2: 'gbUiBuyBonusStoneRoll2',
		},

		// Hover swaps the rim to flat amber; it follows the same silhouette.
		buyBonusHoverSprite: 'buyBonusGlyph',
		buyBonusHoverFrames: ['buyBonusRoll1', 'buyBonusRoll2', 'buyBonusGlyph'],
		buyBonusHoverFrameMs: 90,
		buyBonusHoverSpriteTint: 0xffffff,
		// Normal blending replaces the sign instead of adding a glow.
		buyBonusHoverSpriteBlend: 'normal',

		// Keep the plate recognizable during a spin; fade its caption to signal off.
		buyBonusDisabledStyle: 'dim',
		buyBonusDisabledTint: 0xf7f4e8,
		// Restore the asset colour on the ready frame.
		buyBonusIdleTint: 0xf7f4e8,

		// The SVG's 32px transparent rim keeps visible art within the hit box.
		buyBonusPlateScale: 1.12,

		// THE LABEL. The sign's centre stays clear below its bowling-ball crest, so the
		// label comes back up from the 0.5 it was squeezed to: 0.6 of the base size
		// is 21.6px on this 120px button. The wrap width keeps BUY / BONUS on two
		// lines.
		buyBonusLabelSizeRatio: 0.5,
		buyBonusLabelWrapWidth: 100,
		buyBonusLabelOffsetY: -0.06,
		// only the unused 'outline' hover style reads this - set so it is right
		buyBonusPlateInset: { width: 0.8, height: 0.8 },

		// With the plate art gone the CTA falls back to its rounded rect, which was
		// black-and-gold to match the brass. Their green marks it as the one coloured
		// call to action, the same job --hg-btn-bg does in their table.
		buyBonusFill: 0x141a33,
		buyBonusBorder: 0xe8433a,
		buyBonusBorderWidth: 4,
		buyBonusCornerRadius: 8,

		// The auto-spins counter, in the platform palette. Green edge, because it
		// sits on the green spin button and is the one badge the platform bar
		// draws; a gold ring there would be the only warm thing left on the strip.
		autoSpinsCounterFill: 0x141a33,
		autoSpinsCounterBorder: 0xe8433a,
		autoSpinsCounterLabel: 0xf6f0dc,
		autoSpinsCounterLabelStroke: 0x141a33,

		// The rounded-rect fill a DIMMED plate falls back to when there is no
		// sprite. Unused while the stone plate loads (and this skin's disabled
		// style is 'grey' now, see above), kept so a missing texture still gets
		// the platform disc rather than the brass skin's olive.
		buyBonusDisabledFill: 0x141a33,

		// their .CircleButton has :hover and :active states and a 125ms transition;
		// it does not have a halo
		// OFF, like the collaborator's Go Bananas titles and Deadwood: a halo that
		// flares when Spin is pressed is part of what review scored 5/10 "poor UI"
		// on Deadwood (2026-09-22). The plate's own press feedback is enough.
		spinButtonGlow: false,
		hoverHighlight: true,
		// 2026-10-01 (user rule, every game): hover never greys a control out —
		// the control lights in the game's own red-orange instead of a white film.
		hoverPlateLight: 0xe8433a,
		pressFeedback: true,

		// THE ICONS HAVE TO BE SWAPPED, not recoloured. UiButton draws a
		// uiTheme.icons entry as a plain Sprite with no tint, so buttonIconFill
		// above reaches only the vector turbo bolt — every one of these was still
		// gold brass sitting on the grey strip.
		//
		// Same shapes, flat white with a thin dark contour, generated from the same
		// source in the same pass (design/generate_ui_icons.mjs). turbo stays
		// omitted for the reason the brass list gives: it has to switch between
		// hollow and filled and a static sprite cannot.
		icons: {
			menu: 'gbIconMonoMenu',
			menuExit: 'gbIconMonoMenuExit',
			settings: 'gbIconMonoSettings',
			info: 'gbIconMonoInfo',
			payTable: 'gbIconMonoPayTable',
			soundOn: 'gbIconMonoSoundOn',
			soundOff: 'gbIconMonoSoundOff',
			autoSpin: 'gbIconMonoAutoSpin',
			replay: 'gbIconMonoReplay',
		},
	});
}

// ── 'print': the bar as a piece of the poster ────────────────────────────────
//
// Layered on top of the platform values above (same geometry, same behaviour —
// the Buy Bonus slab, hover rules, the counter), and then re-dressed in this
// game's materials: the strip is printed paper with an ink edge, a green
// halftone rising from its foot and the red misregistered shadow every card in
// the game has; the round controls are the same paper discs; the caps carry the
// Chef's sweater stripes. Ink on paper, so every colour that was light-on-dark
// is turned round. Art: design/build_print_bar.py.
if (skin === 'print') {
	setUiTheme({
		buyBonusLabelSizeRatio: 0.5,
		buyBonusLabelWrapWidth: 110,
		// the framed casing's rules (not 'flat', whose dividers are white at 15%
		// and vanish on paper); the art itself is the fill and edge
		barStyle: 'framed',
		panelBorder: 0x141a33,
		// Portrait readouts are separate panels; use the same dark field as the
		// strip so the cream numerals retain clear contrast at phone size.
		panelFill: 0x141a33,
		sprites: {
			bar: 'gbUiBarStrip',
			button: 'gbUiButtonPrint',
			buttonActive: 'gbUiButtonPrintOn',
			buyBonus: 'gbUiBuyBonusStone',
			buyBonusGlyph: 'gbUiBuyBonusStoneLit',
			buyBonusRoll1: 'gbUiBuyBonusStoneRoll1',
			buyBonusRoll2: 'gbUiBuyBonusStoneRoll2',
		},
		barSpriteSlice: 96,
		// the round plates' disc colour (button_print.png), for the gap cut
		// round the front bolt of turbo 2
		turboKeylineColor: 0x2c3a66,
		// the frame runs on 20 units further right than the template's, so the
		// turbo disc sits on the paper and not on the end stripes (2026-10-04)
		barFrameRightInset: 4,

		// This strip is dark vinyl. Cream type stays legible over its face;
		// the red Win label retains a separate accent.
		labelFill: 0xf6f0dc,
		balanceLabelFill: 0xf6f0dc,
		winAccent: { border: 0xe8433a, label: 0xff8a72 },
		betAccent: { border: 0x141a33, label: 0xf6f0dc },
		valueFill: 0xf6f0dc,
		valueStroke: 0x141a33,
		valueShadow: 0x141a33,
		readoutScale: 0.85,
		barMessageScale: 0.74,
		barMessageStroke: 0x141a33,
		winFlashTint: 0xc79b58,

		// The round discs have dark centres, so vector fallback icons are cream.
		buttonFill: 0xf6f0dc,
		buttonFillDisabled: 0xd5dfcf,
		buttonFillActive: 0xd6ac52,
		buttonBorder: 0x141a33,
		buttonIconFill: 0xf6f0dc,
		buttonIconStroke: 0x141a33,
		// the disc art already has its ring; ON is drawn by button_print_on
		buttonBorderWidth: 0,
		icons: {
			menu: 'gbIconMenu',
			menuExit: 'gbIconMenuExit',
			settings: 'gbIconSettings',
			info: 'gbIconInfo',
			payTable: 'gbIconPayTable',
			soundOn: 'gbIconSoundOn',
			soundOff: 'gbIconSoundOff',
			autoSpin: 'gbIconAutoSpin',
			replay: 'gbIconReplay',
			// drawn, centred bars, not the template's text glyphs (they sat low
			// and thin): design/centre_bar_icons.py
			increase: 'gbIconPrintIncrease',
			decrease: 'gbIconPrintDecrease',
		},
		// the − / + bars span 55% of their canvas: 0.78 makes them 43% of the disc
		iconScales: { increase: 0.78, decrease: 0.78 },

		// spin: the one solid red thing on the strip, edged in ink like the cards
		betFill: 0xe8433a,
		betBorder: 0x141a33,

		autoSpinsCounterFill: 0xf6f0dc,
		autoSpinsCounterBorder: 0xe8433a,
		autoSpinsCounterLabel: 0x141a33,
		autoSpinsCounterLabelStroke: 0xf6f0dc,
	});
}

// A player who cannot afford the bet is TOLD SO, on every route into a bet —
// the Bet button, the spacebar and Autoplay. It used to be the uiTheme key
// betButtonMessageOnInsufficientBalance; it moved to state-shared because the
// Autoplay start button lives in a package that cannot see uiTheme. Paired with
// <ModalMessage /> in ui/Modals.svelte — without that the press would raise a
// modal this app does not render.
stateConfig.explainInsufficientBalance = true;

// The abducted-cow Buy Bonus (2026-10-17), over every skin above.
applyBuyBonusCow();
