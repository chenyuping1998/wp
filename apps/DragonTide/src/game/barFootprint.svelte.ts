// Where the background's props' row (spiral sign, balloons) stands under the
// bet bar, screen px: `left` where the row starts, `ground` the line the props
// stand on. Written by ui/MummyBar.svelte (bar v3) from its own geometry
// (ui/mummyBarGeometry.ts propsAnchor), read by Background.svelte. 0 = no bar
// has said (the shared bar): the props keep their old places at the screen
// edges, on the old ground line.
//
// Why (2026-11-09): the props were placed against the screen's edges at ground
// level, which suited a bar that ran along the bottom. The game's own bars put
// controls where they stood — v4 in the corners (the balloons tied to the turbo
// button), v3 in portrait a row of round controls over the console (the sign
// standing behind the buy tile) — so the bar says where there is room.
export const barFootprint = $state({ left: 0, ground: 0 });
