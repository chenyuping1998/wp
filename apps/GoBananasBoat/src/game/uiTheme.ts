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
	buyBonusPlateInset: { width: 0.96, height: 0.96 },
	buyBonusHighlightPad: 0,
	buyBonusHighlightRadius: 0.107,

	// Certification: the bet button must stay clickable when the balance is short
	// and say so. Paired with <ModalMessage /> in ui/Modals.svelte — without that
	// the press would raise a modal this app does not render.
	betButtonMessageOnInsufficientBalance: true,

	// gold on the olive plate, matching every other caption in the game
	buyBonusLabelFill: 0xffd75e,

	// the Bet panel opens the stake menu when tapped — mark it so players can
	// tell it apart from the static Balance/Win panels
	labelAffordance: true,

	// cursor-over feedback on the rail controls
	hoverHighlight: true,

	// 旋轉鍵的呼吸光暈
	spinButtonGlow: true,

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
// Everything above is this game's own drawn look: olive canvas plates, brass
// trim, gold captions, the framed housing that matches the reel frame. What
// follows replaces the CASING — not the game — with the flat dark platform
// chrome Hot Miami and Go Bananaut run, taken from Bananaut's uiTheme unchanged.
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
// The game FONT deliberately survives the swap — it is the one thing left that
// says which game this is. The icons do not: they are swapped for a flat
// monochrome set drawn from the same shapes (see the icons map at the bottom).
//
// TO GO BACK, three ways, shallowest first:
//
//   localStorage.setItem('uiSkin', 'boat')    on a build already deployed
//   localStorage.removeItem('uiSkin')         back to whatever DEFAULT_SKIN is
//   change DEFAULT_SKIN below to 'boat'       one word, in the build
//
// Nothing above this line is edited by the swap, so 'boat' is byte-for-byte
// the look that shipped before it.
const DEFAULT_SKIN: 'platform' | 'boat' = 'platform';

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
		// THE CAPTION IS A STENCIL, NOT A LABEL.
		//
		// White, and the plate carried a dark placard behind it so the white had
		// something to sit on. The placard looked like what it was — a black box
		// stuck on the button — so it went, and the words are painted instead.
		//
		// #D1CDB9 sampled off l1.png: it is the exact cream the low symbols' letters
		// are stencilled in, on a panel of the same value. That pairing already
		// reads at cell size on the reels, five times over, which is a stronger
		// argument than any contrast figure I could pick here.
		buyBonusLabelFill: 0xd1cdb9,

		// The brass TICKER plate has to go with the brass: a framed gold plate
		// behind a flat grey strip reads as two different bars stacked. So the
		// readouts fall back to the platform's own panel.
		//
		// The Buy Bonus does NOT fall back, it gets the board's own steel: the same
		// corrugated shipping-container panel every low symbol is stencilled on,
		// empty except for the naval mine sprayed across it. A green rounded
		// rectangle is what every other game's CTA looks like, and this is the one
		// control that should say which game it belongs to.
		//
		// setUiTheme is a shallow Object.assign, so this REPLACES the sprites map
		// rather than merging into it — which is the whole mechanism. gbUiTicker and
		// gbUiBuyBonus stay loaded and untouched, so switching back is instant and
		// needs no rebuild.
		sprites: { buyBonus: 'gbUiBuyBonusContainer', buyBonusGlyph: 'gbUiBuyBonusLit' },

		// HOVER: THE STENCIL CATCHES THE LIGHT.
		//
		// buyBonusHoverSprite is drawn over the plate with blendMode 'add', so it
		// reads as the paint lighting up rather than as a decal laid on it — the
		// same object brighter, which a normal blend at any alpha cannot be.
		//
		// The bloom is BAKED INTO THAT TEXTURE rather than applied as a filter here.
		// An additive child inside a filtered or masked container is composited into
		// an isolated target that starts transparent, so it would be adding to
		// nothing and arrive as a faint film. As a plain sibling sprite it works.
		//
		// A SLOT NAME, NOT AN ASSET KEY. UiSprite resolves whatever it is handed
		// through uiTheme.sprites, so an asset key here matches nothing — and the
		// miss is silent: it falls back to its default rounded rectangle, which,
		// being drawn with blendMode 'add', arrives as a pale glowing box around the
		// whole button. The lit stencil is registered as `buyBonusGlyph` above,
		// which is the slot the shared theme documents for exactly this.
		buyBonusHoverSprite: 'buyBonusGlyph',
		// 0xffffff, not the default warm tint: the texture already carries its own
		// amber, and tinting it again pushes the core past white into a flat blob.
		buyBonusHoverSpriteTint: 0xffffff,

		// Measured off buybonus_container.png: the plate is drawn at x=8 on a 640
		// canvas, so its art covers 97.5% of the box on both axes. Only the
		// 'outline' hover style reads this, which this game does not use — it is set
		// so the number is right if anyone ever switches.
		buyBonusPlateInset: { width: 0.975, height: 0.975 },

		// THE LABEL, SHRUNK — and it is what makes room for the stencil.
		//
		// The shared default is 0.68 of UI_BASE_FONT_SIZE (45), which at this game's
		// 0.8 button scale is 24.5px of type on a 120px plate: two lines standing
		// 52px tall, i.e. 43% of the button's height, centred. That is most of the
		// plate and it sits squarely on top of anything painted behind it.
		//
		// 0.58 gives 26px and a 56px block — the middle of the plate, with the mine
		// stencil in the top third.
		//
		// KEEP THIS IN STEP WITH LABEL_RATIO in design/generate_ui_plates.mjs, which
		// sizes the stencil so it clears exactly this band. Raise one without the
		// other and the mine settles onto the first line of the caption.
		//
		// It has been 0.46 and then 0.52, both held down by something else needing
		// the room — first the stencil, then a placard behind the words. Neither
		// applies now: the caption is painted straight onto the panel, so the only
		// limit is the stencil above it, and bigger type is the cheapest legibility
		// there is.
		buyBonusLabelSizeRatio: 0.58,
		buyBonusLabelWrapWidth: 108,

		// The rounded-rect fallback, for the case where the sprite fails to load.
		// Kept in the platform palette rather than the game's: if the art is missing
		// the button should look like the bar it is sitting on.
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

		// AND THE TINT THAT DIM MULTIPLIES BY, which is the number that was
		// actually wrong.
		//
		// The package's default is 0x767670 — neutral, and dark enough to take
		// roughly half the light out. On a brass plate that is fine. On this one it
		// was not: measured, the plate's face is (127,134,136) lit and 0x767670
		// takes it to (59,62,60), which is both much darker than the board and
		// completely NEUTRAL — the blue that makes it a shipping container is gone,
		// so the disabled button stopped looking like it was made of the same thing
		// as the reels.
		//
		// Blue-leaning on purpose, so what dim takes away is LIGHT and not the
		// colour: the default is neutral and left the disabled plate at b-r +1,
		// i.e. a grey box where a blue container door had been.
		//
		// Lighter than it was, because the plate underneath is no longer lightened
		// to carry white type — it now sits at the board's own value, so the same
		// multiplier would have taken the disabled state well below anything else
		// on screen.
		buyBonusDisabledTint: 0xbcc6cc,

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
