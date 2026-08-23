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

	// Chrome behind the Buy Bonus plate art: a black rounded rectangle with a gold
	// border, hardcoded into ButtonBuyBonus since before the plate could be a
	// sprite at all. It is right for a plate that is a PANEL and wrong for one that
	// is an OBJECT - Soul Seal's is a talisman, and a black rectangle with a gold
	// frame around a piece of hanging paper is a second frame nobody asked for.
	//
	// True by default, so every other game keeps the chrome it has.
	buyBonusPlateChrome: true,

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

	// compactBottom only — height of the strip, in standard-layout units (the
	// standard box is 1920x1080 on wide screens, so this is ~9% of the height).
	// Games that clear the strip by shrinking their board derive the inset from
	// this value, so changing it moves both together.
	barHeight: 140,

	// compactBottom only — draw the strip's own background. Off leaves the
	// controls floating directly on the game art.
	barFill: 0x0c1206,
	barAlpha: 0.72,

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
