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
