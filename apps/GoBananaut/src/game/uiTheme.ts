import { GAME_FONT, GAME_FONT_WEIGHT } from './fonts';
import { setUiTheme } from 'components-ui-pixi';

// Jungle-commando bet bar: deep olive-canvas buttons with the same brass trim
// as the reel frame and the free-spin plaques, plus the game's sans typeface.
// Applied once at module load (imported by Game.svelte) — the shared UI package
// otherwise keeps its plum/gold defaults for other games in the workspace.
setUiTheme({
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

	// THE LABEL, SHRUNK — and it is what makes room for the porthole.
	//
	// The shared default is 0.68 of UI_BASE_FONT_SIZE (45), which at this game's
	// 0.8 button scale is 24.5px of type on a 120px plate: two lines standing
	// 52px tall, i.e. 43% of the button's height, centred. That is most of the
	// plate and it sits squarely on anything above it.
	//
	// 0.46 gives 16.6px and a 36px block, so the label occupies the middle third
	// and the porthole has the top third to itself — which is exactly the budget
	// the art is drawn to: the glass finishes at y 216 of 640 and the caption
	// starts at 224. The wrap width comes down with it, or "BUY BONUS" fits on one
	// line and stops being two.
	buyBonusLabelSizeRatio: 0.46,
	buyBonusLabelWrapWidth: 90,

	// Unlit rather than greyed. The olive plate went pale under the template's
	// grey tint and read as a placeholder panel dropped over the jungle, with the
	// gold caption still at full brightness on top of it.
	buyBonusDisabledStyle: 'dim',

	// RE-TUNED FOR A LIGHT PLATE, and this is the one number that quietly undid
	// the whole point of lightening it.
	//
	// The shared default is 0x767670, and the comment on it in ButtonBuyBonus is
	// right about what it is for — darken, do not lighten, keep the hue. It was
	// tuned against the OLIVE plate, which was already dark. The hatch is
	// deliberately at L 119 so it clears a backdrop that runs 22 to 54, and
	// 0x767670 is a multiply by 0.463:
	//
	//     119.4 x 0.463 = 55
	//
	// which is the backdrop's own value. Every moment the button is disabled — and
	// it is disabled for the whole of every spin, since disabled is
	// !isIdle() — the plate dropped back into the background it had just been
	// lifted out of.
	//
	// 0xbc is a multiply by 0.737, so the disabled plate sits at 88: clearly below
	// the enabled 119 and clearly above every backdrop. The blue channel stays 5%
	// under the other two, which is the warm skew the default had.
	buyBonusDisabledTint: 0xbcbcb3,

	// The hover highlight is sized and shaped to the PLATE ART, so it stays inside
	// the button instead of drawing a lighter square around it.
	//
	// RE-MEASURED for the hatch: its body is drawn at x=8 on a 640 canvas, so the
	// art covers 97.5% of the box on both axes, and its corners are rx=26 — 4.1%
	// of the sprite width against the olive plate's 10.3%, because a pressed steel
	// panel has a much tighter radius than a padded canvas one.
	//
	// The defaults are a 1.0 inset plus a 3% outward pad, i.e. 6% WIDER than the
	// sprite and squarer than it: that is a highlight bigger than the thing it
	// highlights on all four sides and at every corner.
	//
	// Only the 'outline' hover style reads these, and this game now uses the
	// sprite hover above instead — they are kept correct so the numbers are right
	// if anyone switches.
	buyBonusPlateInset: { width: 0.975, height: 0.975 },
	buyBonusHighlightPad: 0,
	buyBonusHighlightRadius: 0.041,

	// Certification: the bet button must stay clickable when the balance is short
	// and say so. Paired with <ModalMessage /> in ui/Modals.svelte — without that
	// the press would raise a modal this app does not render.
	betButtonMessageOnInsufficientBalance: true,

	// DARK INK ON BARE STEEL.
	//
	// The plate sits at L 120-150 — lifted there to clear the backdrop — so the
	// caption has to go the other way. It went white for a pass, which needed a
	// recessed dark placard under it to have any edges at all, and a black box on
	// a grey plate is a worse object than an engraved one. Dark type needs nothing
	// behind it: #141a1e on that steel is a 110-level separation on its own, and
	// engraved ink is what a hatch placard actually carries.
	buyBonusLabelFill: 0x141a1e,

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

	// THE BUY BONUS IS A HATCH OFF THE BOARD'S OWN HOUSING.
	//
	// It was the jungle generation's olive plate with a hot gold bevel, which is
	// the one piece of furniture on this screen that still belonged to a different
	// game. The replacement is gunmetal with a porthole, and its metal is sampled
	// off frame_edge.png rather than invented, so the button and the reel housing
	// are the same material — see design/generate_ui_plates.mjs.
	//
	// In BOTH skins, and deliberately. The bar's casing is a skin; the CTA is this
	// game's own object, and an olive plate is wrong next to a space capsule
	// whichever bar it is sitting on. gbUiBuyBonus stays loaded so switching back
	// needs no rebuild.
	sprites: {
		base_ticker: 'gbUiTicker',
		buyBonus: 'gbUiBuyBonusHatch',
		buyBonusGlyph: 'gbUiBuyBonusLit',
	},

	// HOVER: THE LAMP COMES ON.
	//
	// A SLOT NAME, NOT AN ASSET KEY. UiSprite resolves whatever it is handed
	// through uiTheme.sprites, so an asset key here matches nothing — and the miss
	// is silent: it falls back to its default rounded rectangle, which, drawn with
	// blendMode 'add', arrives as a pale glowing box around the whole button.
	buyBonusHoverSprite: 'buyBonusGlyph',
	// 0xffffff, not the default warm tint: the texture carries its own cyan, and
	// tinting it again pushes the core past white into a flat blob.
	buyBonusHoverSpriteTint: 0xffffff,

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
// Two more things deliberately survive the swap: the drawn brass ICON art and
// the game font. The icons are this game's own and there is no platform set to
// replace them with — the fallback is text and emoji, visibly worse.
//
// TO GO BACK, three ways, shallowest first:
//
//   localStorage.setItem('uiSkin', 'bananaut')   on a build already deployed
//   localStorage.removeItem('uiSkin')            back to whatever DEFAULT_SKIN is
//   change DEFAULT_SKIN below to 'bananaut'      one word, in the build
//
// Nothing above this line is edited by the swap, so 'bananaut' is byte-for-byte
// the look that shipped before it.
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
		// the strip: flat casing, their panel grey on their near-black edge
		barStyle: 'flat',
		barFill: 0x2a2a2a,
		barAlpha: 1,
		panelBorder: 0x0f0f0f,
		panelFill: 0x2a2a2a,

		// Round controls: a dark disc with a thin cool-grey ring.
		//
		// Their mobile CircleButtons carry `--hg-btn-border-width: 0` and float on
		// the game art, where a flat dark disc separates itself on its own. On a grey
		// strip it does not — 0x212529 against 0x2a2a2a is a nine-level difference and
		// the control disappears — so the disc goes darker and the 1px `.Button`
		// border comes back at 2, one unit here being about a third of a CSS pixel at
		// this bar's scale. Hot Miami found the same thing and fixed it the same way.
		buttonFill: 0x14171a,
		buttonFillLight: 0x4ace4a,
		buttonFillDisabled: 0x207820,
		buttonFillActive: 0x4ace4a,
		buttonBorder: 0x565e66,
		buttonBorderWidth: 2,
		buttonBorderWidthActive: 5,
		buttonIconFill: 0xffffff,
		buttonIconStroke: 0x0f0f0f,

		// the spin button takes their primary green — it is the one control the
		// platform palette actually colours
		betFill: 0x4ace4a,
		betBorder: 0x343a40,

		// readouts: their disabled grey for labels, plain white for values. No
		// per-metric accent colours; the platform bar does not tint its readouts, so
		// the jungle green / brass split above is dropped rather than recoloured.
		labelFill: 0xbfbfbf,
		balanceLabelFill: 0xbfbfbf,
		winAccent: { border: 0x343a40, label: 0xbfbfbf },
		betAccent: { border: 0x343a40, label: 0xbfbfbf },
		valueFill: 0xffffff,
		valueStroke: 0x0f0f0f,
		valueShadow: 0x000000,
		// Dark ink here too — the CTA keeps the hatch under the platform skin, so
		// it is the same pale steel and the same problem.
		buyBonusLabelFill: 0x141a1e,

		// The brass TICKER art has to go with the brass: a framed gold plate behind
		// a flat grey strip reads as two different bars stacked.
		//
		// THE BUY BONUS DOES NOT, and that is the one deliberate exception on this
		// strip. The bar is every-few-seconds furniture and belongs to the platform;
		// buying the feature is this game's own thing, is pressed rarely and
		// deliberately, and is the last screen before the player spends 300x. It
		// keeps the hatch — the board's own gunmetal, with the lamp that comes on
		// when you hover it.
		//
		// setUiTheme is a shallow Object.assign, so this REPLACES the sprites map
		// rather than merging into it. gbUiTicker stays loaded and untouched, so
		// switching back is instant and needs no rebuild.
		sprites: { buyBonus: 'gbUiBuyBonusHatch', buyBonusGlyph: 'gbUiBuyBonusLit' },

		// The rounded-rect fallback, for the case where the plate art fails to
		// load. Kept in the platform palette rather than the game's: if the art is
		// missing the button should look like the bar it is sitting on.
		buyBonusFill: 0x14171a,
		buyBonusBorder: 0x4ace4a,
		buyBonusBorderWidth: 4,
		buyBonusCornerRadius: 8,

		// The auto-spins counter, in the platform palette. Green edge, because it
		// sits on the green spin button and is the one badge the platform bar
		// draws; a gold ring there would be the only warm thing left on the strip.
		autoSpinsCounterFill: 0x14171a,
		autoSpinsCounterBorder: 0x4ace4a,
		autoSpinsCounterLabel: 0xffffff,
		autoSpinsCounterLabelStroke: 0x0f0f0f,

		// The dimmed Buy Bonus plate. buyBonusDisabledStyle is 'dim' above, and
		// the package's default fill for that branch is this game's own olive —
		// which on a flat grey strip turned the CTA green the moment it was
		// disabled. Same disc as every other control instead.
		buyBonusDisabledFill: 0x14171a,

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
