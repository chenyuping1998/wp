import { GAME_FONT } from './fonts';
import { setUiTheme } from 'components-ui-pixi';

// Jungle-commando bet bar: deep olive-canvas buttons with the same brass trim
// as the reel frame and the free-spin plaques, plus the game's sans typeface.
// Applied once at module load (imported by Game.svelte) — the shared UI package
// otherwise keeps its plum/gold defaults for other games in the workspace.
setUiTheme({
	fontFamily: GAME_FONT,
	fontWeight: '700',

	buttonFill: 0x1e2a0e,
	buttonFillLight: 0xffd75e,
	buttonFillDisabled: 0x3a3a30,
	buttonBorder: 0xd8a334,
	buttonIconFill: 0xfff3bd,
	buttonIconStroke: 0x1a2208,

	betFill: 0x2c3812,
	betBorder: 0xffe282,

	panelFill: 0x1a2409,
	panelBorder: 0xd8a334,
	labelFill: 0xffd75e,
	balanceLabelFill: 0xffe98a,
	// win reads in jungle green, bet in a cooler brass so the three readouts
	// stay tellable apart without leaving the palette
	winAccent: { border: 0x9ec44a, label: 0xd4f07a },
	betAccent: { border: 0xc08a20, label: 0xffd0a0 },
	valueFill: 0xfff7d6,
	valueStroke: 0x1a2208,
	valueShadow: 0x0a1004,

	// The reel housing art carries a wide structural margin (FRAME_SCALE 1.28 in
	// BoardFrame), so the board's real footprint is ~1.3x the playfield. At the
	// stock bar height there was no room left to grow it. Pulling the bar in
	// frees the vertical space the bigger board needs.
	betBarScale: 0.84,

	// framed plate art for the readouts and the Buy Bonus CTA (the other slots
	// keep the themed rounded rect, which suits the round buttons)
	sprites: {
		base_ticker: 'gbUiTicker',
		buyBonus: 'gbUiBuyBonus',
	},
});
