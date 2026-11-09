// How far the bet bar's bottom-left cluster (buy tile + menu button) reaches in
// from the screen's left edge, in screen px. Written by ui/SplitBar.svelte (bar
// v4) from its own geometry, read by Background.svelte so the circus props stand
// clear of it. 0 = no corner cluster (the shared bar), and the props keep their
// old places at the screen edges.
//
// Why (2026-11-09): the props were placed against the screen's edges at ground
// level, which suited a bar that ran along the bottom. Bar v4 puts its controls
// in exactly those corners, and the balloons ended up tied to the turbo button
// and the spiral sign standing on the menu button (worst in portrait).
export const barFootprint = $state({ left: 0 });
