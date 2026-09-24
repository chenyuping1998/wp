import { GAME_FONT, GAME_FONT_WEIGHT } from './fonts';
import { setUiTheme } from 'components-ui-pixi';
import { stateConfig } from 'state-shared';

// Review (Hot Miami, 2026-09-04 / -06) required an insufficient-balance message
// on EVERY route into a bet — Bet button, spacebar AND Autoplay — not disabled
// controls. This policy lives in state-shared because components-ui-html (the
// Autoplay panel button) cannot read uiTheme. Off by default; opted in here.
stateConfig.explainInsufficientBalance = true;

// Turf War bet bar: concrete-grey plates, sodium-orange trim, bone-white icons —
// ART_BRIEF.md §0 palette. These are the vector/text colours in the shared UI
// package; the sprite ART is themed separately (turfUi*, turfUiIcons/*), so
// until this block was rewritten (2026-09-07) the bar was still Capo Nostra's
// deep-indigo plates with hot-magenta and cyan trim and a mint win accent
// (0x2ee6a8) — a legitimate Miami colour that every jungle-palette grep missed.
setUiTheme({
	// Oswald 700 — the bar's captions and money figures in the game's own
	// condensed street face rather than the shared package's Cinzel default or
	// the Titan One this used to carry. Reasoning and the one-line revert are in
	// fonts.ts, which is also where the weight is declared as a real cut of the
	// family rather than a synthesised bold.
	fontFamily: GAME_FONT,
	fontWeight: GAME_FONT_WEIGHT,

	buttonFill: 0x17191c,
	buttonFillLight: 0x3a3d42,
	buttonFillDisabled: 0x2a343e,
	// sodium-orange-lit so an ON toggle (turbo / autoplay) reads as ON at a
	// glance under the bone-white icon art
	buttonFillActive: 0x9c5a22,
	buttonBorder: 0xf5893d,
	buttonIconFill: 0xd9d6ce,
	buttonIconStroke: 0x0e0f11,

	betFill: 0x17191c,
	betBorder: 0xd9d6ce,

	panelFill: 0x0e0f11,
	panelBorder: 0x3a3d42,
	labelFill: 0xffc38a,
	balanceLabelFill: 0xffc38a,
	// win reads in sodium orange, bet in cool steel so the three readouts stay
	// tellable apart without leaving the palette
	winAccent: { border: 0xf5893d, label: 0xffc38a },
	betAccent: { border: 0x465562, label: 0xd9d6ce },
	// Bone white, not pure white. §0 gives 骨白 #D9D6CE as the text colour and
	// nothing in this game is pure white — a #FFFFFF figure on a #0E0F11 plate is
	// the one object on the bar lit by something other than the sodium lamp
	// everything else is lit by. It is still ~14:1 against the plate, so no
	// legibility is traded for the palette.
	valueFill: 0xd9d6ce,
	valueStroke: 0x0e0f11,
	valueShadow: 0x0e0f11,

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

	// ── strip geometry ──────────────────────────────────────────────────────
	//
	// These three were set ONLY inside the platform-chrome block below, which was
	// fine while that block always ran. It no longer does, and they are not
	// styling: barHeight is what stateGame.svelte.ts derives the board's bottom
	// inset from, so leaving them to the package defaults (140 / 12 / 0.78) would
	// have moved the board and shrunk the spin button as a side effect of a
	// palette change. They are stated here at the values the game was laid out
	// against, so BOTH skins get identical geometry and only the colours and
	// shapes differ. Do not change them here — see stateGame.svelte.ts.
	// 2026-09-14, ported from Capo Nostra after its review tagged "Poor bet UI
	// bar": frame 120 -> 152 tall. Buttons keep their size (placed at barMid
	// with fixed scales).
	barHeight: 188,
	barFrameBottom: 36,
	// 1.12 → 1.14, same fix and same measured ceiling as Capo Nostra, same day
	// (1.20 measured back at 1px clear to autoplay — too tight; 1.14 measured
	// at 4px). Kept in sync with the hacksaw block below.
	spinScale: 1.14,

	// The strip's own casing. 'framed' rather than the platform 'flat': this
	// game's reel housing is a bolted, rusted metal frame, and the drawn housing
	// (corner radius, trim edge, lit inner line, engraved section rules) is the
	// same object language one storey down. Flat chrome under a framed board
	// reads as two products stacked.
	barStyle: 'framed',

	// Panel ground at near-opacity, so the strip is a slab the controls are set
	// into rather than a tint over the alley behind it.
	//
	// This had never been set, which meant the strip inherited the package
	// default 0x0c1206 — Go Bananas' jungle green. It was invisible only because
	// the platform-chrome block below overwrote it before anyone saw it; the
	// moment this game's own skin became the default, the strip under the
	// concrete plates would have been dark green.
	barFill: 0x17191c,
	barAlpha: 0.94,

	// Buy Bonus stays left of the board at its old size rather than joining the
	// strip: buying the feature is an occasional, expensive, deliberate action and
	// does not belong beside the control pressed every few seconds.
	buyBonusOnRail: false,

	// Down from the shared default of 2.4. That drew the plate 353px wide with its
	// centre pinned at railWidth/2, so it ended at x 376 — and it, not the bet
	// bar, was the thing holding BOARD_SHRINK down at 0.89. At 1.35 the plate ends
	// at x 299, which is what lets the board fill its height the way GoBananas
	// does. Still a 199px target on a 1422px canvas — larger than any control in
	// the bet strip — so nothing is hard to hit.
	//
	// This trades directly against BOARD_SHRINK: raising one pushes the other
	// back, 1:1 through the arithmetic written out in stateGame.svelte.ts.
	buyBonusRailScale: 1.35,

	// sodium-orange highlight on the concrete plate, the same caption colour as
	// the Balance/Win labels beside it
	buyBonusLabelFill: 0xffc38a,

	// the Bet panel opens the stake menu when tapped — mark it so players can
	// tell it apart from the static Balance/Win panels
	labelAffordance: true,

	// cursor-over feedback on the rail controls
	hoverHighlight: true,

	// 旋轉鍵的呼吸光暈
	spinButtonGlow: true,

	// Same fix as Capo Nostra, same day: `betIconScale` (components-ui-pixi's
	// shared default is 0.22, tuned for a flat circle) left the refresh mark
	// floating small in the middle of spin_plate.png's recessed well. Measured
	// off the delivered file: recess ~0.661 of the plate width; the mark's
	// visible outer edge is `radius * 1.18`. First pass (0.25, ~0.59) still
	// read as too small on Capo Nostra's identical setup — 0.27 lands it at
	// ~0.64, close to the recess edge rather than leaving visible margin.
	// 0.27 -> 0.225 (2026-09-14): measured, spin_plate.png's dark well ends at 0.61
	// of its radius. At 0.27 the mark's ring reached 0.64 and its arrowheads 0.71 —
	// over the rim, the same defect found on Capo Nostra. 0.225 puts the ring at
	// 0.53 and the arrowhead tips at 0.59, inside.
	betIconScale: 0.225,

	// button_plate.png's own recess (~0.64 of plate width) is close enough to
	// the shared package's 0.62 default that no override is needed here —
	// unlike Capo Nostra's button_plate.png (~0.72 recess), which did.

	// Same box-size complaint as Capo Nostra, same day, same fix
	// (`railButtonScale` — see components-ui-pixi/theme.svelte.ts). 1.15
	// verified there against the rendered gap to the spin button (6px
	// clearance at that value) — reused here without re-deriving since both
	// games share the same UI_BASE_SIZE=150 rail-button geometry; if Turf
	// War's spin/rail spacing ever diverges from Capo's, re-measure rather
	// than assuming this number still holds.
	railButtonScale: 1.15,

	// Same as Capo Nostra, same day: turbo has more slack than the rest of
	// the cluster (only autoplay and the bar's own edge on either side, not
	// bottlenecked by the tight spin-autoplay gap), so it gets its own bigger
	// scale on top of railButtonScale. Reused Capo's measured value without
	// re-deriving — same reasoning as spinScale/railButtonScale above.
	turboButtonScale: 1.6,

	// +/- enlarged ~29% with the spacing raised to match (ported from Capo Nostra).
	stepButtonScale: 0.36,
	stepButtonGap: 33,

	// 2026-09-14 icon redraw (ported from Capo Nostra). The delivered set was drawn
	// with heavy fused shapes (menu's bars one slab, settings a solid flower) and
	// several ran to their canvas corners, so at the shared 0.62 fallback autoSpin
	// reached 0.87 of the button radius — past button_plate.png's rusty rim, which
	// starts near 0.85 (the plate has no dark well; the concrete face is the limit).
	// Redrawn thin with real gaps; every icon's ink is within 0.78 of its canvas, so
	// 0.72 lands them at 0.50-0.55. autoSpin is pinned too, or UiButton's own 0.82
	// would win. The turbo bolt is drawn in code: 0.55 puts its tips at 0.62.
	buttonIconScale: 0.72,
	iconScales: {
		autoSpin: 0.72,
	},
	turboIconScale: 0.55,

	// Platform UX conventions, lifted from Hacksaw's shipped UI bundle. Worth
	// having precisely BECAUSE they are not one game's design: The Luxe 1.5.1 and
	// Densho 1.25.1 ship the same 55 element bindings, the same 24-key table, the
	// same 150/500/50000/100 constants — byte-identical function bodies. That is
	// the house convention two live titles share, and a player arriving from
	// either already has it in their hands.
	//
	// Nothing here is STYLED from Hacksaw. Their controls are DOM and ours are
	// pixi, so their rem values transfer to nothing; the layout stays exactly as
	// measured in stateGame.svelte.ts. What transfers is behaviour.
	//
	// To revert: delete this object. `null` is the default and means the previous
	// behaviour exactly — no hold-repeat, no cooldown, no idle nudge, no
	// shortcuts, panels left as they were. It can also be turned off on a build
	// that is already deployed, without rebuilding:
	//
	//   localStorage.setItem('platformUx', 'off')   previous behaviour
	//   localStorage.removeItem('platformUx')       back to this
	//
	// The numbers are Hacksaw's own, unchanged.
	platformUx: {
		betRepeatMs: 150,
		betToSpinCooldownMs: 500,
		idleReminderMs: 50_000,
		idlePulseMs: 2_000,
		shortcuts: true,
		keybindThrottleMs: 100,
		closePanelsOnSpin: true,
	},

	// Plate art per UiSprite slot. Keys are still named hm* from the source game;
	// the FILES they resolve to in assets.ts are Turf War's own
	// (assets/sprites/turfUi/*), so this is a naming wart, not a leak.
	//
	// Two of the five slots the shared UI exposes are filled. The other three
	// (`bet` — the spin button, `buyBonusGlyph`, `base_mobile_drawer`) still draw
	// a flat themed rounded rect, and `base_ticker` only draws at all in the
	// `tiled` readout: the compactBottom strip passes tiled={false}, so on the
	// shipped layout the ticker plate is not on screen. Drawn plates for the
	// slots that are actually visible are specified in ART_BRIEF.md §8.7.
	sprites: {
		base_ticker: 'hmUiTicker',
		buyBonus: 'hmUiBuyBonus',
		bet: 'turfUiSpinPlate',
		base_mobile_drawer: 'turfUiDrawerPlate',
		// 2026-09-15: the strip was bar_strip.png, a rail with 40px of ink in a 240px
		// file, so the whole bar read as a thin line (「整個太窄」). Now the SAME
		// approach as Capo Nostra: the drawn ticker plaque as the strip's only frame.
		// bar_plate.png is ticker_plate.png at 2x with its two ends kept as caps and
		// the one scrap-free column band mirror-tiled between them, so nothing
		// decorative gets stretched.
		bar: 'turfUiBarPlate',
		button: 'hmUiButtonPlate',
		buttonActive: 'hmUiButtonPlateActive',
		// The strip's own background and the round buttons' plates now HAVE slots
		// in the shared package (`bar`, `button`, `buttonActive` — 2026-09-09), so
		// ART_BRIEF §8.7 #2/#3/#4 are no longer blocked on engine work. They are
		// left unset only because the art does not exist yet; a key pointing at a
		// missing file draws nothing and logs to the console while the build stays
		// green, which is worse than the vector casing. When the files land:
		//
		//   bar: 'hmUiBarStrip',
		//   button: 'hmUiButtonPlate',
		//   buttonActive: 'hmUiButtonPlateActive',
		//
		// and set barSpriteSlice below to the cap width in the SOURCE file's own
		// pixels — 128 for a 2x delivery of the 64-unit cap §8.7 specifies. The
		// mechanism was proven end to end on 2026-09-09 with throwaway plates; see
		// HANDOFF §2.15.
	},
	// cap width in bar_plate.png's own pixels (240 source px at 2x)
	barSpriteSlice: 480,

	// drawn bone-white icons in place of the template's text/emoji button glyphs
	icons: {
		menu: 'hmIconMenu',
		menuExit: 'hmIconMenuExit',
		settings: 'hmIconSettings',
		info: 'hmIconInfo',
		payTable: 'hmIconPayTable',
		soundOn: 'hmIconSoundOn',
		soundOff: 'hmIconSoundOff',
		autoSpin: 'hmIconAutoSpin',
		increase: 'hmIconIncrease',
		decrease: 'hmIconDecrease',
		// turbo deliberately omitted: UiButton draws it as a vector bolt so it can
		// be hollow when off and fill in when active — a static sprite can't toggle
	},
});

// ── Platform chrome (opt-IN) ─────────────────────────────────────────────────
//
// Everything above is Turf War's own look: concrete plates on a near-black
// strip, sodium-orange trim, bone-white icons and figures in the game's own
// condensed face. What follows replaces the CASING — not the game — with
// Hacksaw's neutral cross-title platform chrome.
//
// It is no longer the default. It was, and the effect was that the palette
// above was written, reviewed and shipped without ever being on screen: every
// colour in it was overwritten at startup by the grey below.
//
// Why this is worth having as a second skin rather than an opinion: their UI
// files are shared across titles. The Luxe 1.5.1 and Densho 1.25.1 differ by one
// DOM node and five CSS rules, and their 103 theme variables are value-identical.
// So these numbers are not one game's styling — they are the neutral casing a
// player has already seen on other titles, which is exactly what a casing is
// supposed to be. The report that came with the teardown says it in its own
// first section: "UI 層沒有任何遊戲專屬配色或版面".
//
// The values, straight from ui-layout.md §3.1 and §4.1:
//
//   .ActionPanel      background #2a2a2a, border 3px solid #0f0f0f, radius 3px
//   .divider--vertical opacity .15
//   .Button           radius 4px, border 1px, --hg-btn-bg #4ace4a, color #fff,
//                     border-color #343a40, disabled #207820 / #bfbfbf
//   CircleButton      mobile: background rgba(33,37,41,.5), border-width 0
//
// Two things deliberately survive the swap: the drawn icon art and the game
// font. Hacksaw's glyphs are an icon font we do not have, and the fallback here
// is text/emoji — visibly worse than the icons already drawn for this game.
//
// TO PUT THE NEUTRAL CHROME BACK, three ways, shallowest first:
//
//   localStorage.setItem('uiSkin', 'hacksaw')   on a build already deployed
//   localStorage.removeItem('uiSkin')           back to this default ('turf')
//   change DEFAULT_SKIN below to 'hacksaw'      one word, in the build
//
// The test is `skin === 'hacksaw'` and nothing else, so ANY other value leaves
// the themed block above untouched — which means the old
// `localStorage.setItem('uiSkin', 'miami')` written on a deployed build still
// does exactly what it always did (game skin, not platform chrome) and does not
// need to be un-set. Nothing above this line is edited by the swap either way,
// so each skin is byte-for-byte the look it was written as.
const DEFAULT_SKIN: 'hacksaw' | 'turf' = 'turf';

const skin =
	(typeof localStorage !== 'undefined' && localStorage.getItem('uiSkin')) || DEFAULT_SKIN;

if (skin === 'hacksaw') {
	setUiTheme({
		// ── geometry, from ui-appearance.html §1 (measured at 1280x720) ─────────
		//
		// Their bar is not a band along the bottom edge; it is a slim panel LAID
		// ON the screen with clear space under it, and one control that breaks
		// out of it. As fractions of screen height, on our 1080 standard box:
		//
		//   wrapper      110.4/720 = 15.3%  ->  barHeight 166
		//   clear below   30.4/720 =  4.2%  ->  barFrameBottom 46
		//     (leaves the panel itself 120 tall = 11.1%, against their 9.7%)
		//   spin button  112/720   = 15.6%  ->  168 across = spinScale 1.12
		//
		// The spin button is the point. Theirs is 1.60x the panel's height and
		// stands 21px proud of its top edge — their own report calls it the only
		// element that breaks the strip and says the visual centre of gravity
		// rests on it. Ours was 0.91x the frame: the same size as everything else
		// and therefore not the primary action at all.
		//
		// Ours is CENTRED on the frame, so it overhangs equally top and bottom
		// (24 each way) rather than their asymmetric 21 up / flush down. Doing it
		// their way would need the button to hang below the canvas floor.
		// synced with the base skin above (2026-09-14: 166/46 -> 188/36)
		barHeight: 188,
		barFrameBottom: 36,
		// Kept in sync with the base skin above (1.14).
		spinScale: 1.14,

		// the strip: flat casing, their panel grey on their near-black edge
		barStyle: 'flat',
		barFill: 0x2a2a2a,
		barAlpha: 1,
		panelBorder: 0x0f0f0f,
		panelFill: 0x2a2a2a,

		// round controls: a dark translucent disc with no ring at all, which is
		// what `--hg-btn-border-width: 0` gives their mobile CircleButtons. The ring
		// comes back only to mark a toggle that is ON.
		// Their mobile CircleButtons float on the game art, where a flat dark disc
		// separates itself. On a grey strip it does not: 0x212529 against a
		// 0x2a2a2a bar is a 9-level difference and the control disappears. Darker
		// disc, and the 1px `.Button` border comes back (at 2, since one unit here
		// is about a third of a CSS pixel at this bar's scale).
		buttonFill: 0x14171a,
		// Hacksaw's primary green (0x4ace4a) is gone from every control below.
		//
		// The teardown notes above are still right that their bar colours exactly
		// one thing — but a green CTA sitting under a board lit entirely by one
		// sodium lamp reads as another product's widget parked on this game.
		// The hierarchy it was carrying is kept, moved from hue to VALUE: the spin
		// button is the brightest object on the strip, the toggles go one step
		// down when ON, and everything else stays dark. That survives a
		// colour-blind player and a washed-out phone screen, which a green/grey
		// distinction does not.
		buttonFillLight: 0x8e9499,
		buttonFillDisabled: 0x3a3a3a,
		buttonFillActive: 0x6b7278,
		buttonBorder: 0x565e66,
		buttonBorderWidth: 2,
		buttonBorderWidthActive: 5,
		buttonIconFill: 0xffffff,
		buttonIconStroke: 0x0f0f0f,

		// The spin button: a mid grey, not the near-white this first became.
		// #E6E6E6 on a #2a2a2a strip is a 12:1 jump and the button glared — it
		// stopped reading as a control and started reading as a light source.
		// #8E9499 is still the brightest object on the bar (the icons on it are
		// pure white) with about half that contrast against the strip.
		betFill: 0x8e9499,
		betBorder: 0x343a40,

		// readouts: their disabled grey for labels, plain white for values. No
		// per-metric accent colours; the platform bar does not tint its readouts.
		labelFill: 0xbfbfbf,
		balanceLabelFill: 0xbfbfbf,
		winAccent: { border: 0x343a40, label: 0xbfbfbf },
		betAccent: { border: 0x343a40, label: 0xbfbfbf },
		valueFill: 0xffffff,
		valueStroke: 0x0f0f0f,
		valueShadow: 0x000000,
		buyBonusLabelFill: 0xffffff,

		// the brass plate art has to go with the brass: a framed plate behind a
		// flat grey strip reads as two different bars stacked
		sprites: {},

		// with the plate art gone the CTA falls back to its rounded rect. A light
		// border marks it as a call to action the same way the spin button does —
		// by being brighter than the strip, not by being a different colour.
		buyBonusFill: 0x14171a,
		buyBonusBorder: 0x7d848a,
		buyBonusBorderWidth: 4,
		buyBonusCornerRadius: 8,

		// their .CircleButton has :hover and :active states and a 125ms transition;
		// it does not have a halo
		spinButtonGlow: false,
		hoverHighlight: true,
		pressFeedback: true,
	});
}
