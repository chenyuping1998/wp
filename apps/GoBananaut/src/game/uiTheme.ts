import { GAME_FONT, GAME_FONT_WEIGHT } from './fonts';
import { setUiTheme } from 'components-ui-pixi';
import { stateConfig } from 'state-shared';

import {
	HULL,
	PANEL,
	DISC,
	STEEL_EDGE,
	STEEL_DIM,
	STEEL_TEXT,
	SPIN_ICE,
	ICE_RIM,
	ICE_EDGE,
	ICE_TEXT,
	ICE_BRIGHT,
	ICE_UNLIT,
	CREAM,
	STONE_INK,
	INK,
} from './palette';

// Jungle-commando bet bar: deep olive-canvas buttons with the same brass trim
// as the reel frame and the free-spin plaques, plus the game's sans typeface.
// Applied once at module load (imported by Game.svelte) — the shared UI package
// otherwise keeps its plum/gold defaults for other games in the workspace.
setUiTheme({
	// PORTRAIT: the menu button and Buy Bonus sit this far either side of centre
	// in the 1080-wide portrait layout, which fills a phone's width exactly. At
	// the shared default of 470 the 150-wide menu disc started at x -5 — off the
	// left edge of the screen — and Buy Bonus ended within 10 of the right one
	// (5 PAST it where the platform skin enlarges the plate to 150). 440 is Go
	// Boomana's value: both sit 25 inside the edges, and still clear turbo and
	// autoplay (at 540 +/- 285) by 27.5.
	portraitSideButtonX: 440,

	// Hacksaw's house behaviours (see the shared theme's platformUx), the same
	// values as Go Boomana: hold -/+ to keep stepping, a short lock on the spin
	// button after the stake changes so a press cannot bet an amount not yet
	// seen, an idle nudge on the spin button, shift-key shortcuts, and panels
	// closing when a round starts. Can be switched off on a deployed build with
	// localStorage.setItem('platformUx', 'off').
	platformUx: {
		betRepeatMs: 150,
		betToSpinCooldownMs: 500,
		idleReminderMs: 30000,
		idlePulseMs: 2000,
		shortcuts: true,
		keybindThrottleMs: 100,
		closePanelsOnSpin: true,
	},

	fontFamily: GAME_FONT,
	// Titan One is single-weight; 700 would only get a synthesised bold
	fontWeight: GAME_FONT_WEIGHT,

	buttonFill: 0x1e2a0e,
	buttonFillLight: 0xffd75e,
	buttonFillDisabled: 0x3a3a30,
	// deep amber so an ON toggle (turbo / autoplay) reads as ON at a glance,
	// while still keeping enough contrast under the cream icon art
	buttonFillActive: 0x6b4a10,
	buttonBorder: 0xd8a334,
	buttonIconFill: 0xfff3bd,
	buttonIconStroke: 0x1a2208,

	betFill: 0x2c3812,
	betBorder: 0xffe282,

	panelFill: 0x1a2409,
	panelBorder: 0xd8a334,
	labelFill: 0xffd75e,
	balanceLabelFill: 0xffe98a,
	// win reads in jungle green, bet in a cooler brass so the three readouts
	// stay tellable apart without leaving the palette
	winAccent: { border: 0x9ec44a, label: 0xd4f07a },
	betAccent: { border: 0xc08a20, label: 0xffd0a0 },
	valueFill: 0xfff7d6,
	valueStroke: 0x1a2208,
	valueShadow: 0x0a1004,

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

	// Buy Bonus stays left of the board at its old size rather than joining the
	// strip: buying the feature is an occasional, expensive, deliberate action and
	// does not belong beside the control pressed every few seconds.
	buyBonusOnRail: false,

	// 20% smaller than the template default. The whole control, not just the
	// picture: box, hit area, plate and label together.
	buyBonusButtonScale: 0.8,

	// Unlit rather than greyed. The olive plate went pale under the template's
	// grey tint and read as a placeholder panel dropped over the jungle, with the
	// gold caption still at full brightness on top of it.
	buyBonusDisabledStyle: 'dim',

	// THE TINT THE PLATE GOES BACK TO, which the shared button never restores on
	// its own — and this was a real bug, in both skins, that a wrong diagnosis
	// hid for several rounds.
	//
	// ButtonBuyBonus only passes `tint` while the button is disabled or active,
	// and a prop that stops being passed keeps its last value on the pixi sprite.
	// The button is disabled while the game LOADS, so the plate picked up the
	// disabled tint on the first frame and kept it for the whole session: the
	// plate has been drawn about half as bright as its art, permanently, not just
	// while a spin is running.
	//
	// It was first put down to the disabled tint being too dark and that value was
	// re-tuned — which helped and fixed nothing, because the plate was never
	// coming back out of it. Setting an idle tint makes the button pass one in
	// every state. Found and fixed the same way in Go Bananubis and Go Bananas
	// Boat.
	buyBonusIdleTint: 0xffffff,

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
	buyBonusPlateInset: { width: 0.96, height: 0.96 },
	buyBonusHighlightPad: 0,
	buyBonusHighlightRadius: 0.107,


	// gold on the olive plate, matching every other caption in the game
	buyBonusLabelFill: 0xffd75e,

	// The auto-spins counter over the spin button. Set because the package's
	// defaults are the numbers that were hardcoded in it, and one of them —
	// the numeral's outline — was the TEMPLATE's plum (0x6d2692), which is not a
	// colour anywhere in this game. It has been drawing a purple-edged number on
	// this bar every time an auto run counted down.
	autoSpinsCounterFill: 0x14180a,
	autoSpinsCounterBorder: 0xd8a334,
	autoSpinsCounterLabel: 0xfff7d6,
	autoSpinsCounterLabelStroke: 0x1a2208,

	// the Bet panel opens the stake menu when tapped — mark it so players can
	// tell it apart from the static Balance/Win panels
	labelAffordance: true,

	// cursor-over feedback on the rail controls
	hoverHighlight: true,

	// 旋轉鍵的呼吸光暈
	spinButtonGlow: true,

	// The Win figure swells and flashes in the Win label's colour when a win
	// lands; the Bet figure swells when the stake moves (shared theme:
	// valuePop / winFlashTint). Ported from GoBoomana, 2026-09-27.
	valuePop: 0.18,
	winFlashTint: ICE_TEXT,

	// framed plate art for the readouts and the Buy Bonus CTA (the other slots
	// keep the themed rounded rect, which suits the round buttons)
	sprites: {
		base_ticker: 'gbUiTicker',
		buyBonus: 'gbUiBuyBonus',
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
// Everything above is this game's own first look: olive canvas plates, brass
// trim, gold captions, the framed housing that matched the jungle generation's
// reel frame. What follows replaces the CASING — not the game — with the flat
// dark platform chrome Hot Miami runs, in this game's own colours.
//
// WHY IT IS WORTH HAVING AS A SECOND SKIN rather than an opinion: the SHAPES are
// Hacksaw's, and their UI files are shared across titles — The Luxe 1.5.1 and
// Densho 1.25.1 differ by one DOM node and five CSS rules, and their 103 theme
// variables are value-identical. So the strip, the round discs and the thin rings
// are not one game's styling, they are the neutral casing a player has already
// seen on other titles, which is what a casing is supposed to be.
//
// ONLY COLOURS AND SHAPES ARE TAKEN. Hot Miami also moves the bar's GEOMETRY —
// barHeight 166, barFrameBottom 46, spinScale 1.12, a spin button standing
// proud of the strip. None of that is copied here, and the reason is arithmetic
// rather than taste:
//
//   stateGame.svelte.ts derives the board's position from uiTheme.barHeight, and
//   at BOARD_SHRINK 0.89 the housing is 6 x 112 x 0.89 x 1.06 = 634px against
//   the 660px a 140px bar leaves. A 166px bar leaves 634 — the housing would fit
//   with zero margin, on one viewport aspect, by luck.
//
// The package is explicit that this separation is supported: barStyle "only
// changes the SHAPES, so a game can take the flat casing without giving up its
// palette, or vice versa" (packages/components-ui-pixi/src/theme.svelte.ts).
// Taking the palette and the shapes but not the geometry is the same trade in
// the third direction, and it means this skin cannot move the board by a pixel.
//
// The game FONT deliberately survives the swap — it is the one thing left that
// says which game this is. The icons do not: they are swapped for a flat
// monochrome set drawn from the same shapes (see the icons map at the bottom).
//
// TO GO BACK, three ways, shallowest first:
//
//   localStorage.setItem('uiSkin', 'bananaut')   on a build already deployed
//   localStorage.removeItem('uiSkin')            back to whatever DEFAULT_SKIN is
//   change DEFAULT_SKIN below to 'bananaut'      one word, in the build
//
// Nothing above this line is edited by the swap, so 'bananaut' is the look that
// shipped before it.
const DEFAULT_SKIN: 'platform' | 'bananaut' = 'platform';

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
	document.documentElement.dataset.uiSkin = uiSkin;
}

const skin = uiSkin;

if (skin === 'platform') {
	setUiTheme({
		// ── GUNMETAL AND ICE ─────────────────────────────────────────────────
		//
		// Hacksaw's SHAPES, this game's COLOURS. The flat strip, the round discs,
		// the thin rings and the layout are theirs and stay theirs — they are what
		// a player already knows how to use, and that is most of what makes a bar
		// usable. What changes is what they are made of: gunmetal for everything
		// structural, ice for everything you press or win. The rule, and the
		// contrast table every value below was chosen from, are in palette.ts.
		//
		// THE STRIP. HULL rather than their #2a2a2a, and a steel hairline rather
		// than their near-black edge — at ~1px a #0f0f0f line against a dark strip
		// measures 1.15, which is to say it is not there. STEEL_EDGE is 3.78: a
		// line you can see without it becoming a frame.
		barStyle: 'flat',
		barFill: HULL,
		barAlpha: 1,
		panelBorder: STEEL_EDGE,
		panelFill: PANEL,

		// Round controls: a dark disc with a thin steel ring.
		//
		// Their mobile CircleButtons carry `--hg-btn-border-width: 0` and float on
		// the game art, where a flat dark disc separates itself on its own. On a
		// grey strip it does not — 0x212529 against 0x2a2a2a is a nine-level
		// difference and the control disappears — so the disc goes darker and the
		// 1px `.Button` border comes back at 2, one unit here being about a third
		// of a CSS pixel at this bar's scale. Hot Miami found the same thing and
		// fixed it the same way.
		buttonFill: DISC,
		buttonFillLight: ICE_BRIGHT,
		// The spin button when it cannot be pressed: the same ice, unlit.
		buttonFillDisabled: ICE_UNLIT,
		// AN ON TOGGLE IS ICE. Turbo and autoplay, when engaged, become the same
		// colour as the spin button — so "this is on" and "this is the button" are
		// visibly the same kind of thing, and an idle toggle stays gunmetal with
		// the rest of the furniture. SPIN_ICE rather than the brighter accent
		// because the mono icons drawn on it are white: 4.58 there, against ~1.5
		// for ICE_RIM, which would have made an ON toggle's icon vanish.
		buttonFillActive: SPIN_ICE,
		buttonBorder: STEEL_EDGE,
		buttonBorderWidth: 2,
		buttonBorderWidthActive: 5,
		buttonIconFill: 0xffffff,
		buttonIconStroke: INK,

		// THE SPIN BUTTON — the one control the platform palette colours, so the
		// one place a single colour has to carry the whole game.
		//
		// SPIN_ICE and not a brighter cyan: the arrow drawn on it is hard-coded
		// white (ButtonBetSpinIcon), and white on the pale ice measures 3.7 —
		// barely better than the green's 2.06. The deep ice is 4.58, more than
		// twice what the green gave the arrow, and still reads as light.
		//
		// A bright rim round it, which is what makes a lit disc look like a
		// fitting rather than a coloured circle. betBorder also draws the idle
		// nudge ring that breathes out of the button, so that is ice too.
		betFill: SPIN_ICE,
		betBorder: ICE_RIM,

		// THE READOUTS, in a three-step order: the spin button loudest, then the
		// casing and Balance on STEEL_EDGE, then Bet quietest on STEEL_DIM — with
		// WIN picked out in ice.
		//
		// Win is the only readout that changes because of the game rather than
		// because of the player, and it is the number the eye goes looking for
		// after every spin. The platform bar tints none of its readouts; this tints
		// exactly one, and it is the one that is an amount you received — which is
		// the rule in palette.ts, applied rather than excepted.
		//
		// Balance cannot be given its own accent: LayoutBottomBar draws it on
		// uiTheme.panelBorder directly. So it shares the casing's steel, which is
		// where it belongs anyway.
		//
		// Values in CREAM rather than white. White on this panel measures 15.5 and
		// it glares; cream is 12.8, still far past anything a reading figure
		// needs, and it is what makes the bar comfortable to look at for a long
		// session rather than merely legible.
		labelFill: STEEL_TEXT,
		balanceLabelFill: STEEL_TEXT,
		winAccent: { border: ICE_EDGE, label: ICE_TEXT },
		betAccent: { border: STEEL_DIM, label: STEEL_TEXT },
		valueFill: CREAM,
		valueStroke: INK,
		valueShadow: 0x000000,

		// THE CAPTION IS DARK, ON GLASS, IN BOTH STATES.
		//
		// A MIRRORED visor rather than a dark one is what allows this, and it is
		// the constraint that chose the design. Measured, the ink against the worst
		// point of each state: 5.55 at rest, 6.15 lit. A dark visor would have
		// forced pale type, and pale type cannot survive the glass lighting up.
		buyBonusLabelFill: STONE_INK,

		// The brass TICKER plate has to go with the brass: a framed gold plate
		// behind a flat grey strip reads as two different bars stacked. So the
		// readouts fall back to the platform's own panel.
		//
		// The Buy Bonus does NOT fall back, it gets the EVA HELMET: the one object
		// that says "astronaut" before anything else on screen does. A coloured
		// rounded rectangle is what every other game's CTA looks like, and this is
		// the one control that should say which game it belongs to.
		//
		// Not the Wild, which is also a helmet: W is a PORTRAIT — the gorilla's
		// face, goggles, banana. This is an empty helmet with a mirrored visor.
		// Go Bananas Boat's notes record what happens when a CTA wears a symbol
		// the player can land.
		//
		// setUiTheme is a shallow Object.assign, so this REPLACES the sprites map
		// rather than merging into it — which is the whole mechanism. gbUiTicker
		// and gbUiBuyBonus stay loaded and untouched, so switching back is instant
		// and needs no rebuild.
		sprites: { buyBonus: 'gbUiBuyBonusHelmet', buyBonusGlyph: 'gbUiBuyBonusHelmetLit' },

		// NO ROTATION, and it is a deliberate revert. The plate was a hatch wheel
		// for a while and turned at 45 deg/s under the pointer, which is right for
		// a wheel and absurd for a helmet — one that spins is a prop falling over.
		// The hover is the visor lighting instead.
		buyBonusHoverRotate: 0,

		// HOVER: THE VISOR LIGHTS.
		//
		// A SLOT NAME, NOT AN ASSET KEY. UiSprite resolves whatever it is handed
		// through uiTheme.sprites, so an asset key here matches nothing — and the
		// miss is silent: it falls back to its default rounded rectangle, which
		// arrives as a pale box around the whole button. The lit helmet is
		// registered as `buyBonusGlyph` above, which is the slot the shared theme
		// documents for exactly this.
		buyBonusHoverSprite: 'buyBonusGlyph',
		// NORMAL BLENDING, unlike the stone plates in the other games. Those are
		// additive on a dark disc; the visor is already a bright mirror, so
		// additive light would only push it to white and arrive as a haze. The lit
		// visor is painted over the silver one, so the glass visibly CHANGES —
		// which is the state a player reads.
		buyBonusHoverSpriteBlend: 'normal',
		// 0xffffff, not the default warm tint: the texture already carries its own
		// cyan, and tinting it again pushes the core past white into a flat blob.
		buyBonusHoverSpriteTint: 0xffffff,

		// Measured off buybonus_helmet.png: the shell is drawn at r=298 with a 9px
		// contour on a 640 canvas, so its art covers 94.6% of the box. Only the
		// 'outline' hover style reads this, which this game does not use — it is set
		// so the number is right if anyone ever switches.
		buyBonusPlateInset: { width: 0.946, height: 0.946 },

		// THE LABEL, SHRUNK — and it is what keeps it inside the visor.
		//
		// The shared default is 0.68 of UI_BASE_FONT_SIZE (45), which at this
		// game's 0.8 button scale is 24.5px of type on a 120px plate: two lines
		// standing 52px tall. "BONUS" alone is 3.51 em wide in Titan One, so at
		// 0.68 it is 86px — wider than the whole well the wheel leaves for it.
		//
		// 0.48 gives 17.3px, "BONUS" at 61px, and two lines 37px tall.
		//
		// KEEP THIS IN STEP WITH VISOR_R in design/generate_ui_plates.mjs, which is
		// sized against exactly this band (R >= 203 needed, 214 drawn). Raise one
		// without the other and BONUS runs off the glass.
		buyBonusLabelSizeRatio: 0.48,
		// 94, NOT THE DEFAULT 116, AND THE PLATE ART DEPENDS ON IT. It is what makes
		// "BUY BONUS" break into two lines at all — one line of it is 5.86 em, 101px
		// at this size, against a 75px wrap box — and it keeps BONUS on the glass.
		buyBonusLabelWrapWidth: 94,

		// The rounded-rect fallback, for the case where the sprite fails to load.
		// Kept in the platform palette rather than the game's: if the art is missing
		// the button should look like the bar it is sitting on.
		buyBonusFill: DISC,
		buyBonusBorder: ICE_RIM,
		buyBonusBorderWidth: 4,
		buyBonusCornerRadius: 8,

		// The auto-spins counter. It sits ON the spin button, so its ring is the
		// brightest ice on the bar — the same colour as the button, lit, so the
		// badge reads as part of it rather than as a sticker on it.
		autoSpinsCounterFill: DISC,
		autoSpinsCounterBorder: ICE_BRIGHT,
		autoSpinsCounterLabel: CREAM,
		autoSpinsCounterLabelStroke: INK,

		// The dimmed Buy Bonus plate. buyBonusDisabledStyle is 'dim' above, and
		// the package's default fill for that branch is this game's own olive —
		// which on the strip turned the CTA green the moment it was disabled. Same
		// disc as every other control instead.
		buyBonusDisabledFill: DISC,

		// What dim MULTIPLIES BY while a spin is running. The package's default is
		// 0x767670, a x0.46 that takes the white shell down past the backdrop and
		// turns it warm; this is x0.73, cool-leaning, so what dim takes away is
		// light and not the colour.
		buyBonusDisabledTint: 0xb9c3c9,

		// their .CircleButton has :hover and :active states and a 125ms transition;
		// it does not have a halo
		spinButtonGlow: false,
		hoverHighlight: true,
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

// A player who cannot afford the bet is TOLD SO, on every route into a bet —
// the Bet button, the spacebar and Autoplay. It used to be the uiTheme key
// betButtonMessageOnInsufficientBalance; it moved to state-shared because the
// Autoplay start button lives in a package that cannot see uiTheme. Paired with
// <ModalMessage /> in ui/Modals.svelte — without that the press would raise a
// modal this app does not render.
stateConfig.explainInsufficientBalance = true;
