// Shared bet-bar theme. The UI package is used by every game in the workspace,
// so its colours and typeface live here instead of being hard-coded in each
// button. Defaults are the plum/gold party palette (Wild Party); a game opts
// into its own look by calling setUiTheme() once at startup — see
// apps/GoBananas/src/game/uiTheme.ts.
// Pixi's TextStyle weight union, declared here so the theme needs no direct
// pixi.js dependency. It matters that this is a union and not `as const`: the
// default was written `'600' as const`, which pinned the field's type to the
// literal '600' and quietly made every game's override a type error — invisible
// because the vite build does no typechecking.
type FontWeight =
	| 'normal'
	| 'bold'
	| 'bolder'
	| 'lighter'
	| '100'
	| '200'
	| '300'
	| '400'
	| '500'
	| '600'
	| '700'
	| '800'
	| '900';

export const uiTheme = $state({
	fontFamily: 'Cinzel, Georgia, serif',
	fontWeight: '600' as FontWeight,

	// buttons
	buttonFill: 0x1d0b28,
	buttonFillLight: 0x8fe6ff,
	buttonFillDisabled: 0x5a5a5a,
	// Fill for a toggle button that is currently ON (turbo, autoplay). null keeps
	// the previous behaviour, where an active button was signalled only by a
	// thicker border — too subtle to read as a state.
	buttonFillActive: null as number | null,
	buttonBorder: 0xd8a84e,
	buttonIconFill: 0xffffff,
	buttonIconStroke: 0x000000,
	// Ring thickness on a round control, idle and while it is ON. These were
	// hard-coded 6 and 10 in UiButton; they are keys now because a flat platform
	// chrome has no ring at all (Hacksaw's mobile circle buttons ship
	// `--hg-btn-border-width: 0`) and the heavy brass ring is the single loudest
	// thing about the drawn look. The defaults are the old constants exactly.
	buttonBorderWidth: 6,
	buttonBorderWidthActive: 10,

	// the big bet button
	betFill: 0x131313,
	betBorder: 0xffffff,

	// balance / win / bet readouts
	panelFill: 0x1d0b28,
	panelBorder: 0xd8a84e,
	labelFill: 0xfff08c,
	balanceLabelFill: 0xffd77a,
	// per-metric accents: win flashes toward white on a change, bet sits apart
	winAccent: { border: 0x5dd67e, label: 0x8effad },
	betAccent: { border: 0xa879ff, label: 0xc9a8ff },
	valueFill: 0xffffff,
	valueStroke: 0x7133a4,
	valueShadow: 0x5a1977,

	// Optional plate artwork per UiSprite slot. A game supplies asset keys here
	// to swap the flat rounded-rect placeholders for real framed art; slots left
	// undefined keep drawing the themed rectangle.
	sprites: {} as Partial<Record<'base_ticker' | 'buyBonus' | 'bet' | 'base_mobile_drawer', string>>,

	// Optional drawn icon art per button, keyed by the button's ButtonIcon name
	// (menu, settings, soundOn, …). When a key is present UiButton draws that
	// sprite instead of the text/emoji glyph. Empty by default, so games that
	// don't supply icons keep the glyphs unchanged.
	icons: {} as Partial<Record<string, string>>,

	// Buy Bonus caption colour. Defaults to white, which is what the template
	// hardcoded — a game with a warm plate overrides it so the CTA does not read
	// as a different game's button dropped onto the board.
	buyBonusLabelFill: 0xffffff,

	// The Buy Bonus plate, for the case where no plate ART is supplied and the
	// rounded rect is what the player sees. These four were hard-coded in
	// ButtonBuyBonus; the defaults here are those constants exactly, so a game
	// that sets none of them is unchanged. They exist because a game can now
	// change its casing (uiTheme.barStyle) without the CTA staying behind in the
	// old one — a black-and-gold plate beside a flat grey strip reads as two
	// different games' controls sitting next to each other.
	buyBonusFill: 0x000000,
	buyBonusBorder: 0xffcf66,
	buyBonusBorderWidth: 7,
	buyBonusCornerRadius: 36,

	// Show a small chevron on readout panels that open something when tapped.
	// Only the Bet panel is interactive, and it is otherwise identical to the
	// Balance/Win panels, so nothing indicates it can be pressed.
	labelAffordance: false,

	// Brighten a control while the cursor is over it. Off by default so games
	// that never had hover feedback keep their existing look.
	hoverHighlight: false,

	// Push a control in while it is held down. `pressed` has always been handed to
	// UiButton by Button, and nothing has ever drawn it — so a tap produced no
	// acknowledgement at all until whatever it triggered began, which on a slow
	// connection is long enough to press again. Off by default, like hoverHighlight.
	pressFeedback: false,

	// Breathing halo behind the spin button's rotating mark — idle invitation,
	// brighter while the reels run. Off by default.
	spinButtonGlow: false,

	// Uniform scale on the bottom bet bar, applied about its bottom edge so the
	// bar stays flush with the canvas floor and only its height above that edge
	// changes. Below 1 gives the board more room — useful for games whose reel
	// housing has a wide structural margin. 1 keeps the original layout.
	// Ignored unless betBarLayout is 'bottom' — the sideRail and compactBottom
	// layouts size their own controls.
	betBarScale: 1,

	// 'bottom'        — the original single bar across the foot of the screen
	// 'sideRail'      — controls split into two vertical rails (menu + Buy Bonus
	//                   left, readouts + spin pod right), handing the whole middle
	//                   of the screen to the board
	// 'compactBottom' — one slim strip along the foot: menu and readouts left,
	//                   bet + stepper + spin + autospin/turbo right. The industry
	//                   convention, and the arrangement players arrive already
	//                   knowing. Buy Bonus is NOT in the strip — a game that wants
	//                   it keeps it wherever its own layout puts it.
	//
	// Wide layouts only; portrait has no horizontal room for rails or a compact
	// strip and always falls back to the full bottom bar.
	betBarLayout: 'bottom' as 'bottom' | 'sideRail' | 'compactBottom',

	// ── Platform UX conventions ──────────────────────────────────────────────
	//
	// Behaviours pulled out of Hacksaw's shipped UI bundle (Densho 1.25.1 —
	// docs/handoff/moooo_STATE.md records the teardown). Worth having precisely
	// BECAUSE they are not Densho's design: its UI files and The Luxe's differ by
	// one DOM node and five CSS rules, so what is written here is the house
	// convention two live titles share, not one game's styling.
	//
	// NOTHING is styled from it — Moooo's controls are pixi, Hacksaw's are DOM, so
	// their rem values transfer to nothing. What transfers is behaviour: hold-to-
	// repeat on the stake stepper, a cooldown between changing the stake and
	// betting it, an idle nudge, keyboard shortcuts, and closing every open panel
	// when a round starts.
	//
	// `null` is the default and means the previous behaviour EXACTLY: no repeat,
	// no cooldown, no idle animation, no shortcuts, panels left as they were. A
	// game opts in by assigning the object. One word reverts it.
	//
	// It can also be turned off at run time on a build that is already deployed:
	//
	//   localStorage.setItem('platformUx', 'off')   previous behaviour
	//   localStorage.removeItem('platformUx')       back to the game's own
	//
	platformUx: null as null | {
		// Hold the +/- stake buttons and step every N ms (Hacksaw: 150). 0 disables
		// the repeat and leaves one press = one step.
		betRepeatMs: number;
		// Changing the stake locks the bet button for N ms (Hacksaw: 500). This is
		// a money guard, not a nicety: without it a press that lands in the same
		// gesture as a stake change bets an amount the player has not seen yet.
		betToSpinCooldownMs: number;
		// Idle for N ms with a round already played -> nudge the bet button
		// (Hacksaw: 50_000, animation 2_000, first delay 300). 0 disables.
		idleReminderMs: number;
		idlePulseMs: number;
		// Shift-gated keyboard shortcuts, throttled to N ms (Hacksaw: 100).
		shortcuts: boolean;
		keybindThrottleMs: number;
		// Starting a round closes the drawer and any open modal. Hacksaw closes
		// seven panels on every `placeBet()`; this app has two.
		closePanelsOnSpin: boolean;
	},

	// compactBottom only — height of the strip, in standard-layout units (the
	// standard box is 1920x1080 on wide screens, so this is ~9% of the height).
	// Games that clear the strip by shrinking their board derive the inset from
	// this value, so changing it moves both together.
	barHeight: 140,

	// compactBottom only — draw the strip's own background. Off leaves the
	// controls floating directly on the game art.
	barFill: 0x0c1206,
	barAlpha: 0.72,

	// compactBottom only — which chrome the strip is drawn in.
	//
	// 'framed'   the drawn housing: 26px corners, a 7px trim edge, a lit inner
	//            line and engraved section rules. Matches a game whose reel
	//            housing is itself a framed object. This is the default and is
	//            byte-for-byte what shipped.
	// 'flat'     platform chrome: 4px corners, a 3px dark edge, no inner line,
	//            hairline dividers at 15% white. These proportions are Hacksaw's
	//            `.ActionPanel` (#2a2a2a on a 3px #0f0f0f border, radius 3px,
	//            `.divider--vertical { opacity: .15 }`) — the neutral casing two
	//            of their live titles share, deliberately game-agnostic.
	//
	// Colours still come from barFill / barAlpha / panelBorder either way; this
	// key only changes the SHAPES, so a game can take the flat casing without
	// giving up its palette, or vice versa.
	barStyle: 'framed' as 'framed' | 'flat',

	// compactBottom only — keep the oversized Buy Bonus where the side-rail layout
	// put it (left of the board, vertically centred) instead of dropping it into
	// the strip. Buying the feature is a deliberate, occasional action; it does not
	// belong next to the button players press every few seconds.
	buyBonusOnRail: false,

	// Width of one side rail — its centre line sits at railWidth / 2 in from the
	// canvas edge. Raise it to pull both rails further out toward the edges when
	// a game's reel housing is wide. Also used by compactBottom to place the
	// off-strip Buy Bonus on that same centre line, so the CTA sits in the same
	// spot whichever of the two layouts is active.
	railWidth: 400,

	// Scale of the readout panels and of the Buy Bonus CTA on the side rail.
	// sideRail only.
	railPanelScale: 0.62,
	buyBonusRailScale: 2.4,
});

export type UiTheme = typeof uiTheme;

export const setUiTheme = (partial: Partial<UiTheme>) => Object.assign(uiTheme, partial);
