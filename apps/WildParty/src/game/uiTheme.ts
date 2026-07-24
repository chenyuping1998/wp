import { setUiTheme } from 'components-ui-pixi';

// Wild Party keeps the shared package's plum/gold defaults for colour — those
// defaults ARE this game's palette — so this file only opts into the layout.
//
// sideRail splits the controls into two vertical rails (menu + Buy Bonus on the
// left, readouts + spin pod on the right) instead of one bar across the foot of
// the screen, the same arrangement GoBananas uses. It hands the whole middle of
// the canvas back to the board, which matters here because the ornate reel
// housing carries a wide structural margin around the playfield.
//
// Applied once at module load (imported by Game.svelte). Portrait has no
// horizontal room for rails and falls back to the bottom bar automatically.
setUiTheme({
	betBarLayout: 'sideRail',

	// Wild Party's board is 720 wide against GoBananas' 590, so the ornate housing
	// (x≈322–1100 on the 1422 layout box) leaves ~320px a side for the rails
	// rather than ~390. The readout plate is 603px wide natively, so at this rail
	// width scale 0.50 is the largest that still clears the frame AND stays on
	// canvas — it lands the plate in 1110–1412, i.e. 10px clear at both ends.
	railWidth: 322,
	railPanelScale: 0.5,

	// Buy Bonus CTA 30% smaller than the side-rail default (2.4 → 1.68)
	buyBonusRailScale: 1.68,

	// The spin button shipped white-on-near-black, the one control not speaking
	// the plum/gold palette. Bring it in, but keep its hierarchy as the primary
	// CTA by trimming it in a brighter champagne than the other buttons' #d8a84e.
	betFill: 0x1a0a26,
	betBorder: 0xffe9a8,
});
