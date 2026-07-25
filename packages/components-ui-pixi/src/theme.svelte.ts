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

	// Show a small chevron on readout panels that open something when tapped.
	// Only the Bet panel is interactive, and it is otherwise identical to the
	// Balance/Win panels, so nothing indicates it can be pressed.
	labelAffordance: false,

	// Brighten a control while the cursor is over it. Off by default so games
	// that never had hover feedback keep their existing look.
	hoverHighlight: false,

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
