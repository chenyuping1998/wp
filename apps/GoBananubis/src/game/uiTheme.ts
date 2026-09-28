import { GAME_FONT, GAME_FONT_WEIGHT } from './fonts';
import { setUiTheme } from 'components-ui-pixi';
import { stateConfig } from 'state-shared';
// animates the Buy Bonus hover glow; see the file
import './buyBonusGlow';

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
	winFlashTint: 0xffd75e,

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
//   localStorage.setItem('uiSkin', 'bananubis')   on a build already deployed
//   localStorage.removeItem('uiSkin')            back to whatever DEFAULT_SKIN is
//   change DEFAULT_SKIN below to 'bananubis'      one word, in the build
//
// Nothing above this line is edited by the swap, so 'bananubis' is byte-for-byte
// the look that shipped before it.
const DEFAULT_SKIN: 'platform' | 'bananubis' = 'platform';

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
		// GOLD, NOT THE PLATFORM GREEN.
		//
		// Everything else on this strip is deliberately theirs — flat grey casing,
		// cool-grey rings, white glyphs — because the bar is furniture the player
		// presses every few seconds and furniture should be generic. The ACCENT is
		// the exception: green is the one colour the platform palette contributes,
		// and on a game whose every other lit thing is gilt (the housing, the held
		// tablets, the oracle's lip, the buy plate's eye) it was the single note
		// that belonged to another game.
		//
		// Same ladder as the rest of this game: #ffd75e lit, #e8b53a at rest,
		// #6b5518 drained — which is exactly the relationship #4ace4a / #207820
		// had, so the states still read apart by brightness rather than by hue.
		buttonFillLight: 0xffd75e,
		buttonFillDisabled: 0x6b5518,
		buttonFillActive: 0xffd75e,
		buttonBorder: 0x565e66,
		buttonBorderWidth: 2,
		buttonBorderWidthActive: 5,
		buttonIconFill: 0xffffff,
		buttonIconStroke: 0x0f0f0f,

		// the spin button is the one control the bar actually colours, so it takes
		// this game's gold rather than the platform's green. A shade under the lit
		// gilt above: it is the resting state of the biggest thing on the strip,
		// and at full #ffd75e it glared against a white icon.
		betFill: 0xe8b53a,
		betBorder: 0x343a40,

		// THE READOUTS: Balance and Bet quiet, WIN in gold. The same rule Go
		// Bananas Boat runs on this bar.
		//
		// Win is the only one of the three that changes because of the GAME rather
		// than because of the player, and it is the number the eye goes looking for
		// after every spin. So it is the one readout that carries this game's
		// accent — the gold of the spin button, the held tablets and the win
		// brackets — and the other two stay in the platform's grey.
		//
		// On this layout it is the CAPTION that carries it. compactBottom draws the
		// readouts untiled (the whole strip is one frame), so accent.border is not
		// drawn, and UiLabel deliberately keeps the digits one colour across all
		// three. The border is set anyway so a tiled layout would match.
		//
		// LabelWin already flashes its accent towards white when a win lands; with
		// a gold base that flash now reads as the gold catching the light, instead
		// of a grey word blinking.
		labelFill: 0xbfbfbf,
		balanceLabelFill: 0xbfbfbf,
		winAccent: { border: 0xd8a334, label: 0xffd75e },
		betAccent: { border: 0x343a40, label: 0xbfbfbf },
		valueFill: 0xffffff,
		valueStroke: 0x0f0f0f,
		valueShadow: 0x000000,
		// White, at the user's call: the dark carved ink sank into the grey granite
		// and the label read as part of the stone rather than as a caption.
		buyBonusLabelFill: 0xffffff,

		// The brass TICKER plate has to go with the brass: a framed gold plate
		// behind a flat grey strip reads as two different bars stacked. So the
		// tickers lose their art and become part of the flat casing.
		//
		// The BUY BONUS does not, and that is the one deliberate exception on this
		// strip. The bar is every-few-seconds furniture and belongs to the platform;
		// buying the feature is this game's own thing, is pressed rarely and
		// deliberately, and is the last screen before the player spends 200x. It
		// gets the board's own rock: the same dark basalt plate every symbol stands
		// on, with the same gilt inner bevel and square bronze studs, empty except
		// for the sealed tablet's eye cut into it.
		//
		// setUiTheme is a shallow Object.assign, so this REPLACES the sprites map
		// rather than merging into it. gbUiTicker and gbUiBuyBonus stay loaded and
		// untouched, so switching back to the brass skin is instant and needs no
		// rebuild.
		//
		// THE SUN DISC REPLACED THE STONE. The stone plate was the low symbols'
		// plate and sat beside a board made of them, where it read as a loose
		// tile. Go Bananas Boat solved the same thing with a ship's wheel that
		// turns under the pointer; this is the palace's answer — a lapis ceiling
		// set in inlaid gold with the sun's rays round it. The stone art stays
		// registered, so switching back is one line.
		//
		// AND THEN THE SCARAB REPLACED THE SUN, at the user's call for something
		// more Egyptian: Khepri lifting the sun disc, winged in inlay, as on the
		// royal pectorals. The sun disc art stays registered too.
		sprites: { buyBonus: 'gbUiBuyBonusScarab', buyBonusGlyph: 'gbUiBuyBonusScarabLit' },

		// NO HOVER SPIN. The sun disc turned (30 degrees a second, one ray period),
		// but the shared button rotates the WHOLE plate, and a scarab orbiting its
		// own sun reads as broken. Hover lights the emblem instead.
		buyBonusHoverRotate: 0,

		// THE EMBLEM IS DRAWN BIGGER THAN THE BUTTON. The caption's size is tied to
		// the button box, and at 1:1 the word BONUS ran into the rim. 1.25 grows
		// only the picture (the box, the hit area and the text stay put), which is
		// what "a bigger frame that clears the words" means. The art's own clear
		// zone is worked out for this number in design/generate_ui_plates.mjs.
		buyBonusPlateScale: 1.25,

		// THE PLATE WAS STUCK DIM, and this is the fix.
		//
		// ButtonBuyBonus passes `tint` only in the states that want one: dim while
		// disabled, gold while active, nothing while simply ready. But "nothing" does
		// not put the tint back — a prop that stops being passed keeps its last
		// value on the pixi sprite. The button is disabled while the game loads, so
		// it picked up the 0x767670 disabled tint on the first frame and kept it for
		// the whole session: the art was being drawn at under half brightness, which
		// is why the emblem looked muddy in play however bright the PNG was.
		//
		// buyBonusIdleTint is the one tint the package passes in the ready state, so
		// setting it to white makes "ready" explicit and resets the sprite.
		buyBonusIdleTint: 0xffffff,

		// HOVER: THE EMBLEM LIGHTS UP. (The notes below were written for the stone
		// plate's eye; the mechanism is the same for the scarab, its wings and the rim.)
		//
		// buyBonusHoverSprite is drawn over the plate with blendMode 'add', so it
		// reads as the stone catching light rather than as a decal laid on it — the
		// same object brighter, which a normal blend at any alpha cannot be.
		//
		// The bloom around the eye is BAKED INTO THAT TEXTURE rather than applied as
		// a filter here. An additive child inside a filtered or masked container is
		// composited into an isolated target that starts transparent, so it would be
		// adding to nothing and arrive as a faint film. As a plain sibling sprite it
		// simply works.
		//
		// At rest the eye is barely there: a shade darker than the stone with a lit
		// catch along its lower lid, which is what an incised relief looks like. It
		// has to be, because the button's own two-line label sits on top of it —
		// that collision is what ruled out using the sealed tablet's face directly,
		// where the obsidian seal and the words wanted the same centre. Hovering is
		// what wakes it, and since the label is drawn AFTER the hover sprite, the
		// eye brightens behind the words rather than through them.
		// A SLOT NAME, NOT AN ASSET KEY. UiSprite resolves whatever it is handed
		// through uiTheme.sprites, so an asset key here matches nothing, and its
		// miss is silent: it falls back to drawing its default rounded rectangle,
		// which — being rendered with blendMode 'add' in this branch — arrived on
		// screen as a pale glowing box around the whole button. The lit eye is
		// registered as `buyBonusGlyph` above, which is the slot the shared theme
		// documents for exactly this.
		buyBonusHoverSprite: 'buyBonusGlyph',
		// 0xffffff, not the default warm tint: the texture already carries its own
		// gold, and tinting it again pushes the core past white into a flat blob.
		buyBonusHoverSpriteTint: 0xffffff,

		// Measured off buybonus_stone.png: the plate is drawn at x=8 on a 640
		// canvas, so its art covers 97.5% of the box on both axes. Only the
		// 'outline' hover style reads this, which this game does not use — it is set
		// so the number is right if anyone ever switches.
		buyBonusPlateInset: { width: 0.975, height: 0.975 },

		// THE LABEL, SHRUNK — and it is what makes room for the eye.
		//
		// The shared default is 0.68 of UI_BASE_FONT_SIZE (45), which at this
		// game's 0.8 button scale is 24.5px of type on a 120px plate: two lines
		// standing 52px tall, i.e. 43% of the button's height, centred. That is
		// most of the plate, it crowds the gilt bevel, and it sits squarely on top
		// of anything carved behind it.
		//
		// 0.46 gives 16.6px and a 36px block, so the label occupies the middle
		// third and the eye has the top third to itself. The wrap width comes down
		// with it, or "BUY BONUS" fits on one line and stops being two.
		//
		// Raised to 0.52 with the sun disc: there is no eye above the words now,
		// only the lapis face, whose clear zone generate_ui_plates.mjs sizes for
		// exactly this ratio. Keep the two in step.
		buyBonusLabelSizeRatio: 0.52,
		buyBonusLabelWrapWidth: 90,

		// The rounded-rect fallback, for the case where the sprite fails to load.
		// Kept in the platform palette rather than the game's, because if the art is
		// missing the button should look like the bar it is sitting on.
		buyBonusFill: 0x14171a,
		buyBonusBorder: 0xffd75e,
		buyBonusBorderWidth: 4,
		buyBonusCornerRadius: 8,

		// The auto-spins counter. Its edge matches the spin button it sits on —
		// which is now gold, so this is too. (It was green for the same reason:
		// the badge belongs to the button, not to the strip.)
		autoSpinsCounterFill: 0x14171a,
		autoSpinsCounterBorder: 0xffd75e,
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

// A player who cannot afford the bet is TOLD SO, on every route into a bet —
// the Bet button, the spacebar and Autoplay. It used to be the uiTheme key
// betButtonMessageOnInsufficientBalance; it moved to state-shared because the
// Autoplay start button lives in a package that cannot see uiTheme. Paired with
// <ModalMessage /> in ui/Modals.svelte — without that the press would raise a
// modal this app does not render.
stateConfig.explainInsufficientBalance = true;
