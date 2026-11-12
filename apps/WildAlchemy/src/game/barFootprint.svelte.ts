// Where the bet bar stands, canvas px — written by ui/MummyBar.svelte (bar v3)
// from its fitted geometry (ui/mummyBarGeometry.ts barGroup), for anything that
// has to stand on or clear it. 0 = no bar has said (the shared bar).
//
//   scale       the group's fitted scale (1 = the template's size in the box)
//   consoleTop  the console's top edge
//   sideTop     the highest bar piece right of the housing — the floor line the
//               side figure would stand on if it read the bar instead of
//               uiTheme.barHeight + its DIAL_RISE (CastAlchemy.svelte)
//
// Why (2026-11-11): the old bar was a strip along the bottom whose spin dial
// stood under the figure's feet, so CastAlchemy put the soles DIAL_RISE above
// uiTheme.barHeight. Bar v3 is fitted around the board and the figure instead
// (its top differs per screen shape), so the bar says where it is.
export const barFootprint = $state({ scale: 0, consoleTop: 0, sideTop: 0 });
