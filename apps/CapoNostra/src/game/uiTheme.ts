import {
	BAR_LABEL_FONT,
	BAR_LABEL_FONT_WEIGHT,
	BAR_VALUE_FONT,
	BAR_VALUE_FONT_WEIGHT,
	GAME_FONT,
	GAME_FONT_WEIGHT,
} from './fonts';
import {
	BONE,
	GOLD,
	GOLD_DARK,
	GOLD_LIGHT,
	GUNMETAL,
	GUNMETAL_DARK,
	INK,
	INK_DEEP,
	WINE,
	WINE_DEEP,
} from './palette';
import { setUiTheme } from 'components-ui-pixi';
import { stateConfig } from 'state-shared';

// Review (Hot Miami, 2026-09-04 / -06) required an insufficient-balance message
// on EVERY route into a bet — Bet button, spacebar AND Autoplay — not disabled
// controls. This policy lives in state-shared because components-ui-html (the
// Autoplay panel button) cannot read uiTheme. Off by default; opted in here at
// MODULE SCOPE so it applies to every skin, not only inside the hacksaw branch.
stateConfig.explainInsufficientBalance = true;

// Capo Nostra's own bet bar: near-black warm brown, gold trim, wine accents —
// ART_BRIEF.md §0's palette, imported from game/palette.ts rather than typed in,
// because typing it in by eye is how it went wrong twice already. Applied once
// at module load (imported by Game.svelte); the shared UI package otherwise
// keeps its plum/gold defaults for other games in the workspace.
//
// WHAT WAS HERE BEFORE (2026-09-09). Two reskins deep, and neither of them
// reached this file:
//
//   GoBananas  olive canvas 0x1e2a0e, brass trim, a lime win accent. design/
//              retheme_ui.py remapped the sprite ART and nothing remapped the
//              vector colours, so recoloured plates sat next to olive panels.
//   Hot Miami  the fix for that, and it fixed it into MIAMI: deep indigo plates
//              (0x1b0f3a / 0x140a30 / 0x23113f), hot magenta trim (0xff7ab2,
//              0x7a1a5e), an icy cyan icon fill (0xd8f6ff), a mint win accent
//              (0x2ee6a8 / 0x7dffd4) and a cyan bet accent (0x00a8c8 /
//              0x9fe8ff). Every one of those is a legitimate colour — for the
//              game before this one.
//
// Only buttonBorder (0xC9A227) and panelBorder (0x5C2126) were ever Capo's, and
// they were right by accident: a partial pass set the two borders and stopped.
//
// The three readouts kept their jobs and changed their hues. Miami told Balance,
// Win and Bet apart with gold / mint / cyan — three hues, which §0 forbids. They
// are told apart here by border and by brightness instead, inside two hues:
//
//   BALANCE  wine border, bone label     resting; the quietest of the three
//   WIN      gold border, gold-light     the warm loud one — it is the money
//   BET      gunmetal border, gold label the cool one, and the only one you can
//                                        press (labelAffordance adds a chevron)
//
// That survives a colour-blind player and a washed-out phone, which three hues
// at the same brightness does not.
setUiTheme({
	// Words on the bar — BALANCE / WIN / BET, BUY BONUS, the menu captions — in
	// Cinzel, the same Roman inscriptional face as the plaques, the win banners
	// and the logo. This was Titan One: a rounded bubble face, Hot Miami's, and
	// the last surface in the game still speaking a second alphabet. See
	// game/fonts.ts for why that exception was withdrawn and how to restore it.
	fontFamily: BAR_LABEL_FONT,
	fontWeight: BAR_LABEL_FONT_WEIGHT,
	// …and the NUMBERS in Orbitron. Letters follow the art, digits follow
	// legibility (ART_BRIEF §9.5): Cinzel's figures are narrow and lose at the
	// size a balance is read at. Both keys are new and default to null in the
	// shared package, so no other game is touched.
	valueFontFamily: BAR_VALUE_FONT,
	valueFontWeight: BAR_VALUE_FONT_WEIGHT,
	labelFontWeight: BAR_LABEL_FONT_WEIGHT,

	buttonFill: INK,
	// unused by any control in this workspace (UiButton's 'light' variant is never
	// requested); kept in palette so it cannot leak a hue if one ever is
	buttonFillLight: GOLD_DARK,
	// gunmetal, not a grey: a dead control should go cold while everything around
	// it stays warm, which reads as unavailable rather than as a rendering fault
	buttonFillDisabled: GUNMETAL_DARK,
	// wine, so an ON toggle (turbo / autoplay) reads as ON at a glance under the
	// gold icon art. It is the one lit face on the strip, and §0 allows mid wine
	// exactly here — a small accent block, not a field
	buttonFillActive: WINE,
	buttonBorder: GOLD,
	buttonIconFill: BONE,
	buttonIconStroke: INK_DEEP,

	// The spin button. Wine face with a gold-light ring at 7px: the ring makes it
	// the brightest object on the strip, which is what tells a player it is the
	// primary action, and the face stays dark enough for the white double-arrow
	// drawn on it (ButtonBetSpinIcon is 0xffffff and takes no theme colour).
	betFill: WINE,
	betBorder: GOLD_LIGHT,

	panelFill: INK,
	panelBorder: WINE,
	labelFill: GOLD,
	balanceLabelFill: BONE,
	winAccent: { border: GOLD, label: GOLD_LIGHT },
	betAccent: { border: GUNMETAL, label: GOLD },
	valueFill: BONE,
	valueStroke: INK_DEEP,
	valueShadow: INK_DEEP,

	// The strip itself. These four were never set here at all, so the game's own
	// skin fell through to the shared defaults — barFill 0x0c1206, which is
	// GoBananas' jungle dark green, at 0.72 alpha. Nobody saw it because
	// DEFAULT_SKIN was 'hacksaw' and the platform chrome below sets its own; the
	// moment the skin was switched back the bar would have gone green.
	//
	// 2026-09-09: switched from the drawn 'framed' housing to `sprites.bar`
	// (capoUiPlates/ticker_plate.png, three-sliced — see barSpriteSlice below),
	// at the user's explicit choice after seeing the alternative. The drawn
	// housing had put a gold-framed velvet plaque under each readout with NO
	// place to put the delivered ticker_plate.png at all (`base_ticker` only
	// renders when a label is passed `tiled`, and the compact bottom bar never
	// is — see the note on `sprites.base_ticker` below); putting the SAME art
	// inside the drawn frame as a second, nested plaque was the option that got
	// rejected as "frame inside a frame." This is the third option: the plaque
	// IS the strip's only frame, at any width, via the three-slice mechanism
	// `UiBarStrip` gained on 2026-09-09 for Turf War's `bar_strip.png`. The
	// two are unrelated files with unrelated proportions (this one 4.5:1
	// natively, Turf War's ~15.6:1) — the three-slice is exactly what makes
	// that difference not matter: the caps stay at their own proportions, only
	// the flat velvet middle stretches.
	//
	// `barStyle`/`barFill`/`barAlpha` below are now INERT — `LayoutBottomBar`
	// only draws the vector housing when `sprites.bar` is unset — kept as the
	// fallback if the sprite key is ever removed again.
	barStyle: 'framed',
	barFill: INK_DEEP,
	// near-opaque rather than the 0.72 default: the background behind the strip is
	// a lit interior, and at 0.72 the wall lamps show through the bar
	barAlpha: 0.96,
	// Cut point in ticker_plate.png's OWN pixels (1206×270 native) — measured
	// off the delivered file: the fluted fan medallion's outer edge sits at
	// ~x115, a thin double gold line seam follows to ~x130, and the flat velvet
	// field (safe to stretch) starts after that. 130 keeps the whole seam on
	// the cap side rather than cutting through it.
	barSpriteSlice: 130,

	// Geometry, matching the platform-chrome skin below exactly so that switching
	// skins changes the LOOK and never the LAYOUT. These were only in the hacksaw
	// block, so reverting to this skin also silently moved the bar (140 vs 166)
	// and shrank the spin button (0.78 vs 1.12) — and barHeight is what
	// stateGame.svelte.ts derives BOARD_SHRINK from, so the board moved with it.
	// 2026-09-14: frame 120 -> 152 tall (+27%) after the third review tagged
	// "Poor bet UI bar". Grown both ways (22 up, 10 down). Buttons untouched:
	// LayoutBottomBar places them at barMid with fixed scales, so a taller frame
	// changes the plate, not the controls.
	barHeight: 188,
	barFrameBottom: 36,
	// 1.12 → 1.14 (2026-09-09): user still read the spin plate as too small
	// after the recess-centring fix. First try was 1.20 — measured back from
	// the scene graph at only 1px clear to the autoplay button beside it, too
	// close to trust across canvas sizes. 1.14 measured at 6px clear. This is
	// close to the ceiling this SPACING allows without also widening the gap
	// constants in LayoutBottomBar.svelte (SPIN_X/AUTO_X); re-measure via the
	// rendered scene graph, not by eye, before pushing higher than this.
	spinScale: 1.14,

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

	// HOVER: the plate lights and a gold rim turns behind it.
	//
	// Asked for 2026-09-20 against a collaborator's button that "glows and then
	// spins" on hover. Their plate is a ship's wheel, which can turn because it is
	// round and carries no type; this one is an Art Deco panel with BUY BONUS
	// written across it, so turning the plate itself would put the label upside
	// down. The rays turn instead, behind the plate — only their tips clear its
	// corners, which is the Art Deco sunburst the rest of the game already uses.
	//
	// 38 deg/sec is a little over ten seconds a revolution: clearly moving without
	// reading as a loading spinner, which would say "wait" on the one control that
	// means "spend". 14 rays at 1.14 of the plate's half-diagonal puts a tip in
	// each corner and between them.
	buyBonusHoverSpin: 38,
	buyBonusHoverSpinRays: 14,
	buyBonusHoverSpinColor: GOLD_LIGHT,
	buyBonusHoverSpinRadius: 1.14,

	// Gold-light on the wine plate, matching every other caption in the game. Was
	// 0xffd75e, which is GoBananas' banana gold — a full step brighter and more
	// yellow than this game's own #E8D48B, and the same stray value the modals
	// were carrying (see components/ui/Modals.svelte).
	buyBonusLabelFill: GOLD_LIGHT,

	// the Bet panel opens the stake menu when tapped — mark it so players can
	// tell it apart from the static Balance/Win panels
	labelAffordance: true,

	// cursor-over feedback on the rail controls
	hoverHighlight: true,

	// 旋轉鍵的呼吸光暈
	spinButtonGlow: true,

	// The refresh mark on the spin button, scaled to spin_plate.png's own
	// recess rather than the shared default (which assumes a flat circle with
	// no rim eating into the diameter). Measured off the delivered file: the
	// dark recess is ~0.668 of the plate's width; the mark's visible outer
	// edge is `radius * 1.18` (ButtonBetSpinIcon.svelte). 0.26 (~0.61) was the
	// first pass and still read as too small on a second look (2026-09-09,
	// same day) — 0.28 lands the mark at ~0.66, right up against the recess
	// edge rather than leaving visible margin. The shared default (0.22,
	// ~0.52) left the mark floating small in the middle of the well.
	// 0.28 -> 0.235 (2026-09-14): measured, spin_plate.png's recess ends at 0.63
	// of its radius, not the ~0.67 of width assumed above. At 0.28 the mark's ring
	// reached 0.66 and its arrowheads 0.74 — past the rim. 0.235 puts the ring at
	// 0.555 and the arrowhead tips at 0.62, just inside. Still above the 0.22
	// shared default that read as too small.
	betIconScale: 0.235,

	// Fallback for the OTHER round buttons (menu/settings/sound/paytable/
	// increase/decrease — everything without its own iconSpriteScaleMap
	// entry in UiButton.svelte). button_plate.png's dark recess measures
	// ~0.72 of the plate's width; 0.70 lands the icon's bounding box just
	// inside it. Note this bounds the box, not the icon's own ink — most of
	// these icons only paint 62-90% of their own square canvas, so the
	// VISIBLE mark still sits a little inside 0.70 × 0.72, not flush with the
	// rim. autoSpin/replay keep their own 0.82 (unaffected by this fallback).
	buttonIconScale: 0.70,

	// Box size of the round rail buttons themselves (menu / turbo / autoplay /
	// +/- / drawer), not just the icon inside them — requested 2026-09-09 as a
	// separate complaint from the icon-fill one above. Starting conservative
	// (buttons and their hit areas grow but stay centred where LayoutBottomBar
	// already puts them — nothing here makes room for the bigger circle by
	// moving its neighbours) — verify actual gaps before raising further.
	railButtonScale: 1.15,

	// Turbo specifically, bigger than the rest of the rail cluster: it sits at
	// the end (bar's own right edge on one side, only autoplay on the other),
	// so it has more free room than railButtonScale's 6px-limited spin/
	// autoplay gap lets the whole cluster use. Measured slack before setting
	// this (2026-09-09): ~20 units to autoplay's edge, ~22 to the bar's own
	// right edge — 1.6 leaves several units of margin on both sides. Verify
	// via the scene graph if this is ever raised further; do not eyeball it.
	turboButtonScale: 1.6,

	// 2026-09-14 overflow pass, then the icon REDRAW the same day. The first pass
	// shrank four oversized icons (settings 0.57, paytable 0.63, menu 0.68) to keep
	// them inside button_plate.png's recess, which ends at 0.64 of the radius. The
	// user then reported paytable unreadable — every icon in that set was drawn
	// with heavy, fused strokes and blurred into a blob at the ~30-48px they
	// render at. The set was redrawn thin with real gaps
	// (design/generate_capo_ui_icons.py, old art in design/_legacy_assets/), and
	// every new icon keeps its ink within 0.78 of its canvas, so the plain 0.70
	// fallback lands them all at 0.48-0.53 of the radius. Those per-icon shrinks
	// would now make the new icons tiny, so they are gone.
	//
	// autoSpin stays overridden: UiButton's own map gives it 0.82, which would
	// put the new arrow at 0.62 — on the rim. 0.70 puts it at 0.53.
	turboIconScale: 0.5,          // bolt tips 0.80 -> 0.57 (drawn in code, not a sprite)
	iconScales: {
		autoSpin: 0.7,
	},

	// +/- enlarged ~29% on request, spacing raised with it so the two plates
	// don't overlap. The bar frame is 152 tall now, so the pair (66 between
	// centres + one plate) still fits inside it.
	stepButtonScale: 0.36,
	stepButtonGap: 33,

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

	// Press feedback: the control sinks 7% and takes a shadow while held. It was
	// only ever set in the platform-chrome block below, so this skin — the one
	// with the heavy drawn ring, where a physical press reads best — was the one
	// without it.
	pressFeedback: true,

	// Plate art per slot.
	//
	// `base_ticker` -> capoUiPlates/ticker_plate.png used to be blocked here on
	// two separate grounds: the file was still Hot Miami's unthemed purple/
	// magenta plate (fixed 2026-09-09 — now wine velvet + gold, no purple, no
	// signal red), AND the compact bottom bar's readouts are always passed
	// `tiled={false}` (LayoutBottomBar's own choice, so the strip's drawn frame
	// doesn't nest a second frame under each readout), so `base_ticker` never
	// actually renders there regardless of whether the key is set. It's left
	// set here in case a future layout DOES pass `tiled` to these labels, but
	// don't expect it to do anything on the shipped compact bottom bar — see
	// `bar` below for where this same art actually ended up.
	//
	// `bar` -> the SAME file (capoUiPlates/ticker_plate.png), used a completely
	// different way: not as a per-readout plate, but as the strip's own frame,
	// three-sliced across whatever width the bar renders at (see
	// `barSpriteSlice` above). This was a deliberate choice among three: leave
	// the art unused, nest it inside the strip's OWN drawn frame (rejected —
	// reads as a frame inside a frame), or let it replace that frame outright.
	// The user picked the third.
	//
	// `buyBonus` -> capoUiPlates/buybonus_plate.png IS the reskinned art delivered
	// under §8.6 (verified 2026-09-09: dominant 0x300000/0x180000 wine-brown with
	// 0xc09018 gold, no purple, no signal red).
	//
	// `button` (the round controls) -> capoUiPlates/button_plate.png, delivered
	// and verified 2026-09-09 (gold Art Deco fluted rim, no purple, no signal
	// red). `bet` (the spin button) -> capoUiPlates/spin_plate.png, same check.
	sprites: {
		buyBonus: 'hmUiBuyBonus',
		button: 'capoUiButton',
		bet: 'capoUiSpin',
		base_ticker: 'hmUiTicker',
		bar: 'hmUiTicker',
	},

	// drawn gold icons in place of the template's text/emoji button glyphs
	icons: {
		menu: 'hmIconMenu',
		menuExit: 'hmIconMenuExit',
		settings: 'hmIconSettings',
		info: 'hmIconInfo',
		payTable: 'hmIconPayTable',
		soundOn: 'hmIconSoundOn',
		soundOff: 'hmIconSoundOff',
		autoSpin: 'hmIconAutoSpin',
		// the stake steppers, drawn rather than set as '+' and '−' — see the note
		// on hmIconIncrease in game/assets.ts
		increase: 'hmIconIncrease',
		decrease: 'hmIconDecrease',
		// turbo deliberately omitted: UiButton draws it as a vector bolt so it can
		// be hollow when off and fill in when active — a static sprite can't toggle
	},
});

// ── Platform chrome (opt-IN) ─────────────────────────────────────────────────
//
// Everything above is Capo Nostra's own drawn look: gold-edged plates on warm
// near-black, a heavy ring on every round control, a lit inner line and engraved
// grooves along the strip, Cinzel captions over Orbitron figures. What follows
// replaces the CASING — not the game — with Hacksaw's neutral platform chrome.
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
// One thing deliberately survives the swap: the drawn icon art. Hacksaw's glyphs
// are an icon font we do not have, and the fallback here is text/emoji — visibly
// worse than the icons already drawn for this game. The FONT no longer survives
// it: this block now names its own neutral stack, because the game font above is
// Cinzel and Roman inscriptional capitals are the loudest possible contradiction
// of a casing whose whole job is to be game-agnostic.
//
// ⚠ THE DEFAULT CHANGED ON 2026-09-09, from 'hacksaw' to 'capo'.
//
// It was 'hacksaw', which meant the block above — the whole themed bar — was
// dead code in every build that ever shipped or was reviewed. The player saw a
// flat #2a2a2a grey strip under a board that is entirely warm brown and gold.
// The reasoning for 'hacksaw' (a neutral casing is a casing a player already
// knows) is still sound and is why this block is kept and kept working, but a
// neutral casing is not the same thing as a MISMATCHED one, and a cold grey bar
// beneath a gilt Art Deco board is the second.
//
// TO GO BACK TO THE NEUTRAL PLATFORM CHROME, three ways, shallowest first:
//
//   localStorage.setItem('uiSkin', 'hacksaw')   on a build already deployed
//   localStorage.removeItem('uiSkin')           back to whatever DEFAULT_SKIN is
//   change DEFAULT_SKIN below to 'hacksaw'      one word, in the build
//
// Nothing in the block above is deleted by the swap — it is one setUiTheme call
// overwriting keys of another — so 'hacksaw' is byte-for-byte the look that
// shipped before this change, with the single exception of the geometry keys
// (barHeight / barFrameBottom / spinScale), which the block above now also sets
// to the same values so the two skins differ in look and never in layout.
const DEFAULT_SKIN: 'hacksaw' | 'capo' = 'capo';

const skin =
	(typeof localStorage !== 'undefined' && localStorage.getItem('uiSkin')) || DEFAULT_SKIN;

if (skin === 'hacksaw') {
	setUiTheme({
		// ── type ────────────────────────────────────────────────────────────────
		//
		// Back to the neutral single face for the whole strip. The skin above sets
		// three type keys the platform chrome must undo, or reverting leaves the
		// grey bar lettered in Roman inscriptional capitals — half-applied, which
		// is the one outcome a revert path exists to prevent.
		//
		// null on the two value keys is the shared package's own default and means
		// "use fontFamily", i.e. exactly what this block rendered before the keys
		// existed.
		fontFamily: GAME_FONT,
		fontWeight: GAME_FONT_WEIGHT,
		valueFontFamily: null,
		valueFontWeight: null,
		labelFontWeight: null,

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
		// Kept in sync with the base skin above (1.14) — these two blocks must
		// share identical geometry so switching skins changes the LOOK only.
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
		// one thing — but a green CTA sitting under a board that is entirely warm
		// brown and gold reads as another product's widget parked on this game.
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

		// The general rule below this comment used to be "the brass plate art has
		// to go with the brass: a framed plate behind a flat grey strip reads as
		// two different bars stacked" — true for the readouts (base_ticker), which
		// is why that key is still left out here. Buy Bonus is the one exception,
		// wired back in 2026-09-07 at the user's request so a new, purpose-built
		// plate (mob-themed, not Hot Miami's) can be compared side-by-side against
		// the flat rect fallback before deciding whether to keep it.
		//
		// That comparison is now possible: the asset this key resolves to
		// (hmUiBuyBonus -> assets/sprites/capoUiPlates/buybonus_plate.png) was
		// replaced on 2026-09-09 with the §8.6 art and is no longer Hot Miami's
		// neon-purple plate. Sampled: dominant 0x300000 / 0x180000 wine-brown with
		// 0xc09018 gold rivets, no purple, no signal red. If the side-by-side still
		// favours the flat rect, delete this `buyBonus` line rather than leaving a
		// dead custom asset wired in.
		//
		// base_ticker is still left out here for the original reason — a framed
		// plate behind a flat grey strip reads as two different bars stacked — and
		// is now also left out of the game's own skin above, for a different reason
		// (that art has NOT been reskinned).
		sprites: {
			buyBonus: 'hmUiBuyBonus',
		},

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
