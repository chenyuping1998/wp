import { GAME_FONT, GAME_FONT_WEIGHT } from './fonts';
import { setUiTheme } from 'components-ui-pixi';

import {
	ICE_PLATE,
	ICE_PLATE_DEEP,
	ICE_EDGE,
	ICE_BRIGHT,
	ICE_HIGHLIGHT,
	GOLD,
	GOLD_BRIGHT,
	INK,
} from './palette';

// Arctic-front bet bar: slate buttons with ice-blue trim, and gold kept for the
// numbers. Applied once at module load (imported by Game.svelte) — the shared UI
// package otherwise keeps its plum/gold defaults for other games in the
// workspace, and nothing here reaches them.
//
// The split follows palette.ts rule 2. Everything structural — plate, border,
// icon, the ON state of a toggle — is cold. Everything that states an AMOUNT is
// gold: the Balance/Win/Bet values, their labels, and the buy-bonus caption. On
// a cold bar that makes the money the warmest thing in the frame, which is where
// the eye should land.
setUiTheme({
	fontFamily: GAME_FONT,
	// Titan One is single-weight; 700 would only get a synthesised bold
	fontWeight: GAME_FONT_WEIGHT,

	buttonFill: ICE_PLATE,
	buttonFillLight: ICE_BRIGHT,
	buttonFillDisabled: 0x39414c,
	// A lit glacier blue so an ON toggle (turbo / autoplay) reads as ON at a
	// glance, while still keeping enough contrast under the pale icon art. It is
	// deliberately NOT gold: a toggle is a state, not an amount.
	buttonFillActive: 0x1b5a86,
	buttonBorder: ICE_EDGE,
	buttonIconFill: ICE_HIGHLIGHT,
	buttonIconStroke: INK,

	betFill: ICE_PLATE_DEEP,
	betBorder: ICE_BRIGHT,

	panelFill: ICE_PLATE_DEEP,
	panelBorder: ICE_EDGE,
	labelFill: GOLD,
	balanceLabelFill: GOLD_BRIGHT,
	// The three readouts still have to be tellable apart at a glance. Win keeps
	// the warmest treatment because it is the one that matters, Bet sits on a
	// cooler brass, and Balance takes the plain panel — the same ranking the
	// jungle palette had, moved off green.
	winAccent: { border: GOLD, label: 0xffeaa6 },
	betAccent: { border: 0x7e8ea0, label: 0xc9d8e6 },
	valueFill: 0xfff7d6,
	valueStroke: INK,
	valueShadow: 0x060d16,

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
	// Measured off buybonus_ice.png: the plate is drawn at x=10 on a 640 canvas,
	// so its art covers 96.9% of the box on both axes.
	buyBonusPlateInset: { width: 0.969, height: 0.969 },
	buyBonusHighlightPad: 0,
	buyBonusHighlightRadius: 0.107,

	// Certification: the bet button must stay clickable when the balance is short
	// and say so. Paired with <ModalMessage /> in ui/Modals.svelte — without that
	// the press would raise a modal this app does not render.
	betButtonMessageOnInsufficientBalance: true,

	// gold on the slate plate: it names a price, so rule 2 puts it in the warm
	// half along with every other amount in the game
	buyBonusLabelFill: GOLD,

	// the Bet panel opens the stake menu when tapped — mark it so players can
	// tell it apart from the static Balance/Win panels
	labelAffordance: true,

	// cursor-over feedback on the rail controls
	hoverHighlight: true,

	// 旋轉鍵的呼吸光暈
	spinButtonGlow: true,

	// framed plate art for the readouts and the Buy Bonus CTA (the other slots
	// keep the themed rounded rect, which suits the round buttons)
	//
	// The Buy Bonus gets its own OBJECT rather than a plate with words on it, the
	// way the rest of the family does — Go Bananubis carves the sealed tablet's
	// eye into basalt, Go Bananas Boat uses a cargo container, Go Bananaut an
	// airlock hatch. Here it is a frost crystal cut into the same slate the board
	// stands on. The bet bar is every-few-seconds furniture; this is the last
	// screen before someone spends 200x, is pressed rarely and deliberately, and
	// is worth being a thing.
	//
	// `buyBonusGlyph` is a SLOT NAME, not an asset key, and the distinction has
	// bitten this family before: UiSprite resolves whatever it is handed through
	// uiTheme.sprites, so an asset key in buyBonusHoverSprite matches nothing —
	// and the miss is SILENT. It falls back to drawing its default rounded
	// rectangle, which under blendMode 'add' arrives as a pale glowing box around
	// the whole button.
	sprites: {
		base_ticker: 'gbUiTicker',
		buyBonus: 'gbUiBuyBonusIce',
		buyBonusGlyph: 'gbUiBuyBonusLit',
	},

	// HOVER: THE CRYSTAL LIGHTS.
	//
	// Drawn over the plate with blendMode 'add', so it reads as the steel catching
	// light rather than as a decal laid on it — the same object brighter, which a
	// normal blend at any alpha cannot be. The bloom is baked into the texture
	// rather than applied as a filter here: an additive child inside a filtered or
	// masked container is composited into an isolated target that starts
	// transparent, so it would be adding to nothing and arrive as a faint film.
	//
	// At rest the crystal is a dark groove with a pale lit edge under it, which is
	// what an incised relief looks like. The label is drawn AFTER the hover
	// sprite, so the crystal brightens behind the words rather than through them.
	buyBonusHoverSprite: 'buyBonusGlyph',
	// 0xffffff, not the default warm tint (0xffd98a): the texture carries its own
	// ice blue, and a warm tint over it would drag the whole glow back toward the
	// jungle palette this game just left.
	buyBonusHoverSpriteTint: 0xffffff,

	// THE LABEL, SHRUNK — and it is what makes room for the crystal.
	//
	// The shared default is 0.68 of UI_BASE_FONT_SIZE (45), which at this game's
	// 0.8 button scale is 24.5px of type on a 120px plate: two lines standing 52px
	// tall, centred, i.e. most of the plate. The shared button centres its caption
	// and cannot move it, so the only way the crystal and the words share the
	// plate is for the type to get smaller and the crystal to sit above it. At
	// 0.46 the two lines run roughly y=224..416 of the 640 canvas the plate art is
	// drawn on, which is what sizes the crystal: it is centred at y=142 with a
	// radius of 76, so it spans 66..218 and clears the caption with 6px to spare.
	// Its top clears the inner bevel too (31 plus an 11px stroke). Both numbers
	// are named constants in design/generate_ui_plates.mjs — change this ratio and
	// they have to move with it, or the crystal starts sitting under the words.
	buyBonusLabelSizeRatio: 0.46,
	buyBonusLabelWrapWidth: 90,

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
// Everything above is this game's own drawn look: slate plates, ice trim, gold
// captions, the frost crystal on the Buy Bonus. What follows replaces the
// CASING — not the game — with the flat dark platform chrome Hot Miami and Go
// Bananubis run, taken from those apps unchanged.
//
// WHY IT IS WORTH HAVING AS A SECOND SKIN rather than an opinion: the values are
// Hacksaw's, and their UI files are shared across titles — The Luxe 1.5.1 and
// Densho 1.25.1 differ by one DOM node and five CSS rules, and their 103 theme
// variables are value-identical. So these numbers are not one game's styling,
// they are the neutral casing a player has already seen on other titles, which
// is what a casing is supposed to be.
//
// ONLY COLOURS AND SHAPES ARE TAKEN. Hot Miami also moves the bar's GEOMETRY —
// barHeight 166, barFrameBottom 46, spinScale 1.12, a spin button standing proud
// of the strip. None of that is copied, and the reason is arithmetic rather than
// taste: stateGame.svelte.ts derives the board's position from uiTheme.barHeight
// (BOARD_SHRINK 0.89), so changing the bar's height moves the board. This skin
// cannot move the board by a pixel.
//
// The game FONT and the ice Buy Bonus plate deliberately survive the swap. The
// plate is already dark slate, so it sits on the grey strip without arguing with
// it, and it is the one control that is this game's own rather than the
// platform's.
//
// TO GO BACK, three ways, shallowest first:
//
//   localStorage.setItem('uiSkin', 'frostline')   on a build already deployed
//   localStorage.removeItem('uiSkin')             back to whatever DEFAULT_SKIN is
//   change DEFAULT_SKIN below to 'frostline'      one word, in the build
//
// Nothing above this line is edited by the swap, so 'frostline' is byte-for-byte
// the ice bar that the rest of this file builds.
const DEFAULT_SKIN: 'platform' | 'frostline' = 'platform';

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

if (uiSkin === 'platform') {
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
		// the game art, where a flat dark disc separates itself on its own. On a
		// grey strip it does not — 0x212529 against 0x2a2a2a is a nine-level
		// difference and the control disappears — so the disc goes darker and the
		// 1px `.Button` border comes back at 2, one unit here being about a third
		// of a CSS pixel at this bar's scale. Hot Miami and Go Bananubis both found
		// this and fixed it the same way.
		buttonFill: 0x14171a,
		// ── THE ACCENT IS ICE, NOT THE PLATFORM'S GREEN ──────────────────────
		//
		// Hacksaw's chrome uses one accent colour, #4ace4a, on the spin button and
		// on every lit/active state. Swapped for this game's own light blue, which
		// is the only change made to their palette.
		//
		// TWO blues, not one, chosen by where each sits rather than by taste —
		// measured as WCAG contrast ratios:
		//
		//                          white arrow on it   as a thin line on #14171a
		//   platform green         2.06                8.75
		//   ICE_EDGE   #5fa8d8     2.60                6.92
		//   ICE_BRIGHT #8fd9ff     1.55                11.60
		//
		// So the big filled CTA takes ICE_EDGE (the white spin arrow reads BETTER
		// on it than on the green it replaces) and the thin accents take
		// ICE_BRIGHT (likewise better). Using the lightest blue for everything
		// would have made the spin button the worst-contrast control on the bar,
		// which is the one place that cannot afford it.
		buttonFillLight: ICE_BRIGHT,
		// the muted counterpart of the accent, as 0x207820 was of the green
		buttonFillDisabled: 0x2a5c7a,
		buttonFillActive: ICE_BRIGHT,
		buttonBorder: 0x565e66,
		buttonBorderWidth: 2,
		buttonBorderWidthActive: 5,
		buttonIconFill: 0xffffff,
		buttonIconStroke: 0x0f0f0f,

		// The spin button: the one control the platform palette actually colours,
		// so it is the one place the ice accent has to carry the whole game's
		// identity. ICE_EDGE rather than the lighter blue — see the contrast table
		// above; the arrow drawn on it is white.
		betFill: ICE_EDGE,
		betBorder: 0x343a40,

		// Readouts: their disabled grey for labels, plain white for values. No
		// per-metric accent colours — the platform bar does not tint its readouts,
		// so the gold/steel split above is dropped rather than recoloured.
		labelFill: 0xbfbfbf,
		balanceLabelFill: 0xbfbfbf,
		winAccent: { border: 0x343a40, label: 0xbfbfbf },
		betAccent: { border: 0x343a40, label: 0xbfbfbf },
		valueFill: 0xffffff,
		valueStroke: 0x0f0f0f,
		valueShadow: 0x000000,
		// White rather than the ice bar's gold: the caption sits on the dark slate
		// plate and the platform strip has no warm colour left for it to belong to.
		buyBonusLabelFill: 0xffffff,

		// The ticker plates lose their art and become part of the flat casing: a
		// framed ice plate behind a flat grey strip reads as two bars stacked.
		//
		// The BUY BONUS does not, and that is the one deliberate exception. The bar
		// is every-few-seconds furniture and belongs to the platform; buying the
		// feature is this game's own thing, is pressed rarely and deliberately, and
		// is the last screen before the player spends 200x. It keeps the board's
		// own slate and its frost crystal.
		//
		// setUiTheme is a shallow Object.assign, so this REPLACES the sprites map
		// rather than merging into it — which is how base_ticker gets dropped.
		// gbUiTicker stays loaded and untouched, so switching back to the ice skin
		// is instant and needs no rebuild.
		sprites: { buyBonus: 'gbUiBuyBonusIce', buyBonusGlyph: 'gbUiBuyBonusLit' },

		// The rounded-rect fallback, for the case where the plate fails to load.
		// Kept in the platform palette rather than the game's, because if the art
		// is missing the button should look like the bar it is sitting on.
		buyBonusFill: 0x14171a,
		buyBonusBorder: ICE_BRIGHT,
		buyBonusBorderWidth: 4,
		buyBonusCornerRadius: 8,

		// The dimmed Buy Bonus plate. buyBonusDisabledStyle is 'dim' above, and the
		// package's default fill for that branch is the game's own plate colour —
		// which on a flat grey strip tints the disabled CTA. Same disc as every
		// other control instead.
		buyBonusDisabledFill: 0x14171a,

		// The auto-spins counter. It sits ON the spin button, so its edge follows
		// whatever the accent is — now the brighter ice, so the badge separates
		// from the ICE_EDGE disc underneath it rather than melting into it.
		autoSpinsCounterFill: 0x14171a,
		autoSpinsCounterBorder: ICE_BRIGHT,
		autoSpinsCounterLabel: 0xffffff,
		autoSpinsCounterLabelStroke: 0x0f0f0f,

		// their .CircleButton has :hover and :active states and a 125ms transition;
		// it does not have a halo
		spinButtonGlow: false,
		hoverHighlight: true,
		pressFeedback: true,

		// THE ICONS HAVE TO BE SWAPPED, not recoloured. UiButton draws a
		// uiTheme.icons entry as a plain Sprite with no tint, so buttonIconFill
		// above reaches only the vector turbo bolt — without this every icon would
		// still be gold brass sitting on the grey strip.
		//
		// Same shapes, flat white with a thin dark contour, generated from the same
		// source in the same pass (design/generate_ui_icons.mjs renders both
		// palettes together so they cannot drift). turbo stays omitted for the
		// reason the brass list gives: it has to switch between hollow and filled
		// and a static sprite cannot.
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
