import { GAME_FONT, GAME_FONT_WEIGHT } from './fonts';
import { setUiTheme } from 'components-ui-pixi';

// ── Bet bar: timber cabinet, brass fittings (2026-08-26) ────────────────────
//
// It was Hot Miami's, whole. All 22 colour values in this file were byte-equal
// to apps/HotMiami/src/game/uiTheme.ts — zero of them unique — so a dusk county
// fair was being played through a magenta-and-cyan neon bar. `check_provenance`
// could not see it: that gate hashes ASSET FILES, and these are constants.
//
// The comment that used to sit here made the history plain without anyone
// noticing what it said: the values started as GoBananas' olive-and-lime, then
// design/retheme_ui.py remapped the sprite ART into Miami's ramp and these
// vector colours were pulled across with it. Third-hand, and never this game's.
//
// SAMPLED, NOT INVENTED. Everything below is measured off the art already on
// screen (PIL, 12-level quantised, alpha > 200):
//
//   frame_edge.png   0x603c24 at 48% of its opaque pixels — the housing timber,
//                    with 0x786048 / 0x846c60 highlights and 0x483018 shadow
//   frame_bg.png     0x181830 at 92% — the board plate behind the reels
//   fs_sign.png      0x84243c at 87% — the free-spin sign's fairground red
//
// ONE RULE CONSTRAINS THIS, and it is the rule the whole art direction hangs
// off (see BELL_COLORS in constants.ts): brass, silver and gold at full
// metallic saturation belong to the BELL and nothing else. So the fittings here
// are an aged brass (0xb8863f) one step down from the bell's own 0xc98a3c, and
// champion gold (0xffc43d) appears nowhere in this file at all. A gold glint at
// the edge of vision has to mean a Champion bell landed.
//
// That is also why the bet button is the fair red rather than gold: it must be
// the loudest thing in the strip, and the only loud colour in this game that is
// not a metal is the one already painted on the free-spin sign.
setUiTheme({
	fontFamily: GAME_FONT,
	// Titan One is single-weight; 700 would only get a synthesised bold
	fontWeight: GAME_FONT_WEIGHT,

	buttonFill: 0x2e1d11,
	buttonFillLight: 0x6b4a24,
	buttonFillDisabled: 0x2a231c,
	// lit brass so an ON toggle (turbo / autoplay) reads as ON at a glance. Warm
	// enough to be obvious, dull enough not to be mistaken for a bell.
	buttonFillActive: 0x7d5620,
	buttonBorder: 0xb8863f,
	buttonIconFill: 0xffeccd,
	buttonIconStroke: 0x1a0f06,

	// The fairground red off fs_sign.png, ringed in warm cream — the brightest
	// edge in the strip, and not a metal. See the note above.
	betFill: 0x8c2a40,
	betBorder: 0xffe3ad,

	panelFill: 0x1d1209,
	panelBorder: 0x8a6330,
	labelFill: 0xd8b075,
	balanceLabelFill: 0xffd166,
	// The three readouts still have to be tellable apart at a glance, which the
	// old palette did with three different hues. Inside one warm family the
	// separation is VALUE instead: win is the brightest, bet the dimmest,
	// balance sits between them.
	winAccent: { border: 0xe8b45c, label: 0xffedc4 },
	betAccent: { border: 0x8a6330, label: 0xd8b075 },
	valueFill: 0xfff6e6,
	valueStroke: 0x1a0f06,
	valueShadow: 0x0a0603,

	// The strip's own plate. Not overridden before, so it was falling through to
	// the shared default 0x0c1206 — GoBananas' olive, under Miami's borders.
	barFill: 0x140c06,

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

	// ── Platform UX conventions (Densho UI teardown, 2026-08-26) ─────────────
	//
	// Behaviours lifted out of Hacksaw's shipped UI bundle. Worth having exactly
	// BECAUSE they are not one game's design: Densho's UI files and The Luxe's
	// differ by a single DOM node and five CSS rules, so this is the house
	// convention two live titles share. A player arriving from either already
	// knows it.
	//
	// Nothing here is styling. Hacksaw's UI is DOM and Moooo's is pixi, so its rem
	// values transfer to nothing; what transfers is behaviour.
	//
	// TO REVERT, either:
	//   · set this to `null` — one word, and every one of these behaves exactly
	//     as it did before (no repeat, no cooldown, no nudge, no shortcuts,
	//     panels left open through a spin), or
	//   · on a build already deployed, in the console:
	//         localStorage.setItem('platformUx', 'off')
	//         localStorage.removeItem('platformUx')     // back to this
	//
	// The numbers are Hacksaw's own, unchanged, except where this game has no
	// equivalent of the feature they belong to.
	platformUx: {
		betRepeatMs: 150,
		betToSpinCooldownMs: 500,
		idleReminderMs: 50_000,
		idlePulseMs: 2_000,
		shortcuts: true,
		keybindThrottleMs: 100,
		closePanelsOnSpin: true,
	},

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
		base_ticker: 'mooooUiTicker',
		buyBonus: 'mooooUiBuyBonus',
	},

	// drawn brass icons in place of the template's text/emoji button glyphs
	icons: {
		menu: 'mooooIconMenu',
		menuExit: 'mooooIconMenuExit',
		settings: 'mooooIconSettings',
		info: 'mooooIconInfo',
		payTable: 'mooooIconPayTable',
		soundOn: 'mooooIconSoundOn',
		soundOff: 'mooooIconSoundOff',
		autoSpin: 'mooooIconAutoSpin',
		// turbo deliberately omitted: UiButton draws it as a vector bolt so it can
		// be hollow when off and fill in when active — a static sprite can't toggle
	},
});
