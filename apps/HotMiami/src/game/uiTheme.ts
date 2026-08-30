import { GAME_FONT, GAME_FONT_WEIGHT } from './fonts';
import { setUiTheme } from 'components-ui-pixi';

// Neon bet bar: deep indigo plates with magenta and cyan trim, matching the
// reel frame and the free-spin plaques. Applied once at module load (imported by
// Game.svelte) — the shared UI package otherwise keeps its plum/gold defaults
// for other games in the workspace.
//
// These values were GoBananas' jungle-commando palette — olive canvas
// (0x1e2a0e), brass trim, and a lime "jungle green" win accent. design/
// retheme_ui.py had already remapped the sprite ART into the Miami ramp, but
// these are the vector and text colours and nothing remapped them, so
// recoloured magenta plates were sitting next to olive panels and lime text.
setUiTheme({
	fontFamily: GAME_FONT,
	// Titan One is single-weight; 700 would only get a synthesised bold
	fontWeight: GAME_FONT_WEIGHT,

	buttonFill: 0x1b0f3a,
	buttonFillLight: 0xff7ab2,
	buttonFillDisabled: 0x2a2440,
	// hot magenta so an ON toggle (turbo / autoplay) reads as ON at a glance,
	// while still keeping enough contrast under the icy icon art
	buttonFillActive: 0x7a1a5e,
	buttonBorder: 0xff2e88,
	buttonIconFill: 0xd8f6ff,
	buttonIconStroke: 0x14082e,

	betFill: 0x23113f,
	betBorder: 0x00e5ff,

	panelFill: 0x140a30,
	panelBorder: 0x8a3ffc,
	labelFill: 0xff7ab2,
	balanceLabelFill: 0xffd166,
	// win reads in mint, bet in a cooler cyan so the three readouts stay
	// tellable apart without leaving the palette
	winAccent: { border: 0x2ee6a8, label: 0x7dffd4 },
	betAccent: { border: 0x00a8c8, label: 0x9fe8ff },
	valueFill: 0xfff4ff,
	valueStroke: 0x1a0838,
	valueShadow: 0x0a0420,

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

	// gold on the indigo plate, matching every other caption in the game
	buyBonusLabelFill: 0xffd75e,

	// the Bet panel opens the stake menu when tapped — mark it so players can
	// tell it apart from the static Balance/Win panels
	labelAffordance: true,

	// cursor-over feedback on the rail controls
	hoverHighlight: true,

	// 旋轉鍵的呼吸光暈
	spinButtonGlow: true,

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

	// framed plate art for the readouts and the Buy Bonus CTA (the other slots
	// keep the themed rounded rect, which suits the round buttons)
	sprites: {
		base_ticker: 'hmUiTicker',
		buyBonus: 'hmUiBuyBonus',
	},

	// drawn neon icons in place of the template's text/emoji button glyphs
	icons: {
		menu: 'hmIconMenu',
		menuExit: 'hmIconMenuExit',
		settings: 'hmIconSettings',
		info: 'hmIconInfo',
		payTable: 'hmIconPayTable',
		soundOn: 'hmIconSoundOn',
		soundOff: 'hmIconSoundOff',
		autoSpin: 'hmIconAutoSpin',
		// turbo deliberately omitted: UiButton draws it as a vector bolt so it can
		// be hollow when off and fill in when active — a static sprite can't toggle
	},
});

// ── Platform chrome (opt-out) ────────────────────────────────────────────────
//
// Everything above is Hot Miami's own drawn look: brass-edged plates, a heavy
// ring on every round control, a lit inner line along the strip. What follows
// replaces the CASING — not the game — with Hacksaw's platform chrome.
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
// TO GO BACK, three ways, shallowest first:
//
//   localStorage.setItem('uiSkin', 'miami')   on a build already deployed
//   localStorage.removeItem('uiSkin')         back to this default
//   change DEFAULT_SKIN below to 'miami'      one word, in the build
//
// Nothing above this line is edited by the swap, so 'miami' is byte-for-byte the
// look that shipped.
const DEFAULT_SKIN: 'hacksaw' | 'miami' = 'hacksaw';

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
		barHeight: 166,
		barFrameBottom: 46,
		spinScale: 1.12,

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

		// with the plate art gone the CTA falls back to its rounded rect, which was
		// black-and-gold to match the brass. Their green marks it as the one
		// coloured call to action, the same job --hg-btn-bg does in their table.
		buyBonusFill: 0x14171a,
		buyBonusBorder: 0x4ace4a,
		buyBonusBorderWidth: 4,
		buyBonusCornerRadius: 8,

		// their .CircleButton has :hover and :active states and a 125ms transition;
		// it does not have a halo
		spinButtonGlow: false,
		hoverHighlight: true,
		pressFeedback: true,
	});
}
