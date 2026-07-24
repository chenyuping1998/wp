// Shared bet-bar theme. The UI package is used by every game in the workspace,
// so its colours and typeface live here instead of being hard-coded in each
// button. Defaults are the plum/gold party palette (Wild Party); a game opts
// into its own look by calling setUiTheme() once at startup — see
// apps/GoBananas/src/game/uiTheme.ts.
export const uiTheme = $state({
	fontFamily: 'Cinzel, Georgia, serif',
	fontWeight: '600' as const,

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
	// Ignored when betBarLayout is 'sideRail'.
	betBarScale: 1,

	// 'bottom'   — the original single bar across the foot of the screen
	// 'sideRail' — controls split into two vertical rails (menu + Buy Bonus left,
	//              readouts + spin pod right), handing the whole middle of the
	//              screen to the board. Wide layouts only; portrait has no
	//              horizontal room for rails and always uses the bottom bar.
	betBarLayout: 'bottom' as 'bottom' | 'sideRail',

	// Width of one side rail — its centre line sits at railWidth / 2 in from the
	// canvas edge. Raise it to pull both rails further out toward the edges when
	// a game's reel housing is wide. sideRail only.
	railWidth: 400,

	// Scale of the readout panels and of the Buy Bonus CTA on the side rail.
	// sideRail only.
	railPanelScale: 0.62,
	buyBonusRailScale: 2.4,
});

export type UiTheme = typeof uiTheme;

export const setUiTheme = (partial: Partial<UiTheme>) => Object.assign(uiTheme, partial);
