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
	// Plate art per slot. `buyBonusGlyph` is the one part of a buy-bonus plate that
	// lights on hover - see buyBonusHoverSprite - and is a slot rather than a bare
	// asset key because UiSprite resolves every key through this map.
	sprites: {} as Partial<
		Record<'base_ticker' | 'buyBonus' | 'buyBonusGlyph' | 'bet' | 'base_mobile_drawer', string>
	>,

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

	// Chrome behind the Buy Bonus plate art: a black rounded rectangle with a gold
	// border, hardcoded into ButtonBuyBonus since before the plate could be a
	// sprite at all. It is right for a plate that is a PANEL and wrong for one that
	// is an OBJECT - Soul Seal's is a talisman, and a black rectangle with a gold
	// frame around a piece of hanging paper is a second frame nobody asked for.
	//
	// True by default, so every other game keeps the chrome it has.
	buyBonusPlateChrome: true,

	// The plate colour under a DIMMED disabled Buy Bonus.
	//
	// This was 0x1a2208 written into ButtonBuyBonus — GoBananas' olive, in a
	// package shared by fifteen games. It only shows when a game opts into
	// buyBonusDisabledStyle 'dim', which is why it went unnoticed: every other
	// game takes the 'grey' branch. GoBananas takes 'dim', so its own colour was
	// both correct and invisible as a bug — until the same game grew a second
	// skin, where a flat grey CTA turned olive the moment it was disabled.
	//
	// The default is that same 0x1a2208, so nothing anywhere changes until a
	// theme sets it.
	buyBonusDisabledFill: 0x1a2208,

	// ── the auto-spins counter ────────────────────────────────────────────────
	// The badge drawn over the spin button while an auto run is counting down.
	//
	// All four were hardcoded in ButtonBetAutoSpinsCounter, and one of them was
	// wrong for every game in the workspace: the numeral's outline was 0x6d2692,
	// the TEMPLATE's plum. No game here is plum. The defaults below keep exactly
	// what was being drawn so nothing changes uninvited, but a themed game should
	// set at least the border and the stroke.
	autoSpinsCounterFill: 0x000000,
	autoSpinsCounterBorder: 0xffd26a,
	autoSpinsCounterLabel: 0xffffff,
	autoSpinsCounterLabelStroke: 0x6d2692,

	// Wrap width and size of the label drawn over that plate, in the shared UI's
	// base font units. Defaults are the numbers that were hardcoded.
	//
	// They are here because a plate that is an object rather than a panel has a
	// smaller writable area than the button it sits in: Soul Seal's talisman is
	// 0.72 as wide as it is tall, so on a square button the paper is about two
	// thirds of the width and a label wrapped to the BUTTON overhangs the paper.
	buyBonusLabelWrapWidth: 116,
	buyBonusLabelSizeRatio: 0.68,

	// How large the plate art draws relative to the button's own box.
	//
	// 1 is the button, which is right for a plate that IS the button - a panel
	// filling its own frame. A plate that is an object drawn inside a square canvas
	// covers only part of that square (Soul Seal's talisman is 0.72 as wide as it
	// is tall, so about 70% of the width), and the label then has to shrink to fit
	// an object smaller than the control it labels. Drawing the art larger than the
	// box fixes that without moving the button or its hit area.
	// Scales the WHOLE Buy Bonus control: its box, its hit area, its plate art and
	// its label, all together. Distinct from buyBonusPlateScale below, which grows
	// or shrinks only the picture and leaves the button the same size — that one
	// is for art that overflows its box on purpose, this one is for a button that
	// should simply be smaller. 1 leaves every game exactly as it was.
	// What the bet button does when the balance will not cover the stake.
	//
	//   false  the template's original: the button is disabled and says nothing.
	//   true   it stays pressable and raises the insufficient-balance notice.
	//
	// Certification asked for this on Go Bananas 100 — "the bet button should
	// remain clickable and the appropriate message should be displayed" — but a
	// game that opts in MUST also render <ModalMessage /> in its own Modals
	// component, or the press sets a modal nothing is listening for and the
	// button becomes silently unresponsive, which is worse than disabled.
	//
	// Every app in this workspace has its own Modals.svelte and imports the
	// shared modals one by one; the shared Modals.svelte is not used by any of
	// them. So this cannot be switched on centrally, and it defaults to false.
	betButtonMessageOnInsufficientBalance: false,

	buyBonusButtonScale: 1,

	// How the Buy Bonus control shows that it cannot be pressed right now.
	//
	//   'grey'  the template's original: lighten the plate towards mid-grey.
	//   'dim'   darken the plate and fade the caption with it, so the control
	//           reads as UNLIT rather than as a grey rectangle laid over the art.
	//
	// 'grey' is the default, so no existing game changes. It has a specific
	// failure that 'dim' exists to fix: the tint only lightens the plate, while
	// the caption keeps its full brightness, so a disabled button ends up as a
	// pale slab with bright text on it - louder than the enabled state it is
	// meant to be quieter than.
	buyBonusDisabledStyle: 'grey' as 'grey' | 'dim',

	buyBonusPlateScale: 1,

	// The fraction of the plate's drawn box that the ART actually covers, width
	// and height. Used to size the hover highlight, which otherwise wraps the
	// square button and floats well outside an object-shaped plate.
	buyBonusPlateInset: { width: 1, height: 1 },

	// Light the plate while it can be pressed.
	//
	// The button had three visual states - default, disabled, active - and default
	// and "ready to press" were the same thing, because for a panel-shaped plate
	// they are. For an object they are not: a talisman sitting unlit reads as
	// scenery, and the one moment it matters that it is a control is the moment the
	// reels stop. Off by default; a game opts in.
	buyBonusIdleGlow: false,

	// Tint for the plate at REST.
	//
	// The active state already lifts the plate to 0xfff2c0, and on a painted
	// talisman that difference reads as "the resting button is the dim one" rather
	// than as "the active button is lit" - the same picture, one version of it
	// duller, which looks like a fault in the art.
	//
	// A game can therefore ask for the resting plate to be drawn at full strength
	// and let the border alone carry the active state. Undefined means no tint,
	// which is what every existing game gets.
	buyBonusIdleTint: undefined as number | undefined,

	// How far the hover highlight stands off the plate art, as a fraction of the
	// plate's own size on each axis.
	//
	// 0.03 is what it has always been, so nothing moves for a game whose plate
	// fills its square button - which is every game but Soul Seal, whose plate is
	// a tall talisman and wants a tighter one.
	buyBonusHighlightPad: 0.03,

	// Corner radius of the hover highlight, as a fraction of its own height.
	//
	// It was hardcoded at 0.05, which is right for a plate whose corners are
	// gently rounded and wrong for one that is not: a highlight squarer than the
	// plate under it pushes its corners out past the artwork even when its sides
	// line up. 0.05 is the default, so nothing changes for a game that does not
	// set it — measure the plate art and match it.
	buyBonusHighlightRadius: 0.05,

	// How the hover state is drawn.
	//
	// 'fill' is the default and what every other game gets: a translucent panel
	// over the plate. 'outline' strokes the plate's own edge instead and adds no
	// light to its face at all.
	//
	// The distinction is not cosmetic. On a plate that is an OBJECT rather than a
	// panel, anything laid over its face competes with the art: Soul Seal's
	// talisman is a painted piece of paper with an incantation on it, and both a
	// translucent panel and a lit glyph turned the middle of it into a pale smear
	// with the label sitting in the haze. An outline says the same thing - this is
	// the thing under the cursor - by drawing only its boundary.
	buyBonusHoverStyle: 'fill' as 'fill' | 'outline',
	buyBonusHoverOutlineColor: 0xffffff,
	buyBonusHoverOutlineWidth: 3,

	// A sprite to light on hover INSTEAD of the highlight rectangle.
	//
	// The rectangle is the generic answer and it looks like one: a translucent box
	// laid over whatever art the plate happens to be. A game whose plate is an
	// object can supply the part of that object that should light up - Soul Seal
	// hands over the incantation cut off its talisman - and get a hover state that
	// belongs to the picture rather than to the widget.
	//
	// The sprite is expected to be white on transparent and the same size as the
	// plate, so it registers without any positioning of its own. Undefined keeps
	// the rectangle, which is what every other game gets.
	/**
	 * Degrees per second the buy-bonus plate turns while the pointer is over it.
	 * 0 — the default — means it never turns, so no game that does not ask for
	 * this changes at all.
	 *
	 * It exists because a plate whose art is a WHEEL has an obvious thing to do on
	 * hover, and a static highlight on one is a missed open goal. The caption is
	 * drawn separately and stays upright, so only the plate moves.
	 *
	 * The button spins up quickly and coasts down slowly — see ButtonBuyBonus —
	 * because that is what something with mass does, and a plate that stops dead
	 * the instant the pointer leaves reads as a video being paused.
	 */
	buyBonusHoverSpin: 0,

	buyBonusHoverSprite: undefined as string | undefined,
	buyBonusHoverSpriteTint: 0xffd98a,
	/**
	 * How buyBonusHoverSprite is composited over the plate.
	 *
	 * 'add' (the default, and every game's behaviour before this existed) makes
	 * the glyph read as the plate catching light - right for a lit rune on dark
	 * stone. It can only ever BRIGHTEN, though, and on a pale plate a bright line
	 * is close to invisible: additive light on a near-white ground just reaches
	 * white. 'normal' lets the hover layer carry dark detail as well - cracks, a
	 * shadow, an engraving - composited by its own alpha.
	 */
	buyBonusHoverSpriteBlend: 'add' as 'add' | 'normal',
	/**
	 * The multiply applied to a DISABLED plate. Undefined keeps the fixed value
	 * each buyBonusDisabledStyle has always used (0x767670 for 'dim', 0x8a8a8a for
	 * 'grey'), so nothing changes for a game that does not set it. Those values
	 * were tuned on dark plates; on a pale one they turn it into dark rock for the
	 * whole of every spin, and a lighter multiply still reads as off.
	 */
	buyBonusDisabledTint: undefined as number | undefined,

	// What colour that glow is.
	//
	// It used to borrow buyBonusLabelFill, on the reasoning that the plate's own
	// accent is the right accent for its light. That is true right up until a game
	// writes its label in INK: Soul Seal's is wood-dark #2a1a10, because dark type
	// is what reads on gold paper - and a wood-dark glow at ten percent alpha on a
	// night board is not a dim glow, it is nothing at all. The button looked
	// exactly as unlit as before the glow was added.
	//
	// A light has to be light. This is a separate colour for that reason.
	buyBonusIdleGlowFill: 0xffffff,

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

	// What the spin button should look like while a given bet mode is ACTIVE.
	//
	// An activate-type mode charges every spin rather than being bought once, and
	// nothing on the bar said so: the button looked identical whether a player was
	// spending 1x or 10x per press. This lets a game light the button for the
	// duration, and light it DIFFERENTLY per mode, so the two active modes are
	// told apart by the control itself and not only by the amount beside it.
	//
	// Keyed by the uppercased bet-mode key, matching stateBet.activeBetModeKey.
	// Empty by default, so a game that names nothing here is untouched - including
	// games with no activate modes at all.
	//
	//   color     the charge's own colour, replacing the button's
	//   strength  multiplies the halo; 1 is the ordinary glow
	//   speed     multiplies the breathing rate
	//   orbits    how many motes circle the button, 0 for none
	spinButtonCharge: {} as Record<
		string,
		{ color: number; strength: number; speed: number; orbits: number }
	>,

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

	// compactBottom only — geometry, in standard-layout units (a 1920x1080 box on
	// wide screens). All three were constants inside LayoutBottomBar; the defaults
	// here are those constants exactly.
	//
	// The numbers a game would want instead come from Hacksaw's own rendered UI,
	// measured at 1280x720 in ui-appearance.html §1 and §7:
	//
	//   MainPanel      830.4 x 70   inset (4.8, 10) in an 840 x 110.4 wrapper
	//   clear below    30.4         the strip FLOATS, it is not on the floor
	//   PlaceBetBtn    112 x 112    at y −11, so it stands 21 ABOVE the panel top
	//                               and is 1.60x the panel's own height
	//
	// That last line is the whole visual idea of their bar, and their report says
	// so outright: the spin button is the only element allowed to break the strip,
	// and it is what the eye lands on. As fractions of screen height those are
	// panel 9.7%, float 4.2%, spin 15.6% — which is what a game porting them
	// should set, rather than the raw pixels.
	//
	// barFrameBottom  how far the drawn frame stops short of the canvas floor.
	//                 barHeight − barFrameBottom is the frame's own height.
	// spinScale       spin button diameter as a multiple of UI_BASE_SIZE (150).
	//                 It is centred on the frame, so anything above
	//                 (barHeight − barFrameBottom) / 150 overhangs top and bottom.
	barFrameBottom: 12,
	spinScale: 0.78,

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
