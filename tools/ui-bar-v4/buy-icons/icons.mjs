// Buy-tile glyphs, viewBox -50..50. fill: 'ink' (black) or 'tile' (cut-out in the tile's yellow).
// Shapes: {d, fill} filled path | {c:[cx,cy,r], fill} circle | {s:d, w, fill} round-capped stroke.
export const ICONS = {
 mummy: [ // bandaged mummy-cat head: two ears, wraps across the face, one big eye peeking through
  { d: 'M-30 -14 L-27 -44 L-8 -27 L8 -27 L27 -44 L30 -14 C34 4 30 30 0 36 C-30 30 -34 4 -30 -14 Z', fill: 'ink' },
  { s: 'M-36 -19 L36 -29 M-36 -2 L-4 -6 M24 -10 L36 -12 M-36 15 L36 9 M-26 30 L26 24', w: 3.4, fill: 'tile' },
  { c: [11, -3, 10], fill: 'tile' }, { c: [12.5, -2, 5], fill: 'ink' },
  { d: 'M-16 -1 L-4 -3 L-4 1 L-16 3 Z', fill: 'ink' },
 ],
 fang: [ // coffin: the six-sided toe-pincher, a bevelled lid, a bat on the lid
  { d: 'M-15 -45 L15 -45 L28 -18 L17 45 L-17 45 L-28 -18 Z', fill: 'ink' },
  { d: 'M-11 -38.5 L11 -38.5 L21.2 -17.4 L11.9 38.5 L-11.9 38.5 L-21.2 -17.4 Z', fill: 'tile' },
  { d: 'M-7.6 -33 L7.6 -33 L16 -16.8 L8.4 33 L-8.4 33 L-16 -16.8 Z', fill: 'ink' },
  { d: 'M 0.00 -15.88 C -1.72 -18.75 -3.68 -18.75 -4.60 -17.03 C -7.47 -21.05 -11.50 -20.48 -13.22 -15.30 C -10.35 -16.11 -8.28 -14.27 -8.05 -11.28 C -5.75 -13.35 -2.88 -13.00 0.00 -8.40 C 2.88 -13.00 5.75 -13.35 8.05 -11.28 C 8.28 -14.27 10.35 -16.11 13.22 -15.30 C 11.50 -20.48 7.47 -21.05 4.60 -17.03 C 3.68 -18.75 1.72 -18.75 0.00 -15.88 Z', fill: 'tile' },
 ],
 volt: [ // the monster's head: flat-top hair, zig-zag fringe, eyes, stitched grin, neck bolts
  { d: 'M-35 17 L-26 17 L-26 27 L-35 27 Z', fill: 'ink' },
  { d: 'M35 17 L26 17 L26 27 L35 27 Z', fill: 'ink' },
  { c: [-36, 22, 7.5], fill: 'ink' }, { c: [36, 22, 7.5], fill: 'ink' },
  { d: 'M-27 -30 Q-27 -38 -19 -38 L19 -38 Q27 -38 27 -30 L27 27 Q27 38 15 38 L-15 38 Q-27 38 -27 27 Z', fill: 'ink' },
  { d: 'M-27 -17 L-20 -11 L-13 -17 L-6.5 -11 L0 -17 L6.5 -11 L13 -17 L20 -11 L27 -17 L27 -12 L20 -6 L13 -12 L6.5 -6 L0 -12 L-6.5 -6 L-13 -12 L-20 -6 L-27 -12 Z', fill: 'tile' },
  { c: [-11, 6, 5.5], fill: 'tile' }, { c: [11, 6, 5.5], fill: 'tile' },
  { d: 'M-13 21 L13 21 L13 25.5 L-13 25.5 Z', fill: 'tile' },
  { s: 'M-7 18 L-7 28.5 M0 18 L0 28.5 M7 18 L7 28.5', w: 2.6, fill: 'ink' },
 ],
 muertos: [ // sugar skull: round cranium, flower eyes, heart nose, stitched teeth, forehead flower
  { c: [0, -8, 31], fill: 'ink' },
  { d: 'M-19 8 L19 8 L17 33 Q0 41 -17 33 Z', fill: 'ink' },
  { c: [-12.5, -5, 10], fill: 'tile' }, { c: [12.5, -5, 10], fill: 'tile' },
  { c: [-12.5, -5, 4.2], fill: 'ink' }, { c: [12.5, -5, 4.2], fill: 'ink' },
  { d: 'M0 15 C-2 11 -7 11 -6 7.5 C-5.3 5.2 -2 5.2 0 8 C2 5.2 5.3 5.2 6 7.5 C7 11 2 11 0 15 Z', fill: 'tile' },
  { d: 'M-13 21 L13 21 L12 27 L-12 27 Z', fill: 'tile' },
  { s: 'M-6.5 20 L-6.5 28 M0 20 L0 28 M6.5 20 L6.5 28', w: 2.4, fill: 'ink' },
  { c: [0, -27, 5], fill: 'tile' }, { c: [0, -27, 2], fill: 'ink' },
  { c: [-6.5, -27, 2.6], fill: 'tile' }, { c: [6.5, -27, 2.6], fill: 'tile' },
 ],
 octo: [ // octopus captain: peaked cap with a badge, round head, eyes, four curling tentacles
  { s: 'M-16 12 C-25 23 -32 33 -22 41 M-6 14 C-9 27 -15 35 -7 43 M6 14 C9 27 15 35 7 43 M16 12 C25 23 32 33 22 41', w: 8, fill: 'ink' },
  { d: 'M-25 -4 C-25 -20 -14 -24 0 -24 C14 -24 25 -20 25 -4 C25 12 14 19 0 19 C-14 19 -25 12 -25 -4 Z', fill: 'ink' },
  { d: 'M-20 -25 L-27 -37 Q0 -48 27 -37 L20 -25 Z', fill: 'ink' },
  { d: 'M-21 -25 L21 -25 L21 -22 L-21 -22 Z', fill: 'tile' },
  { d: 'M-24 -22 Q0 -13 24 -22 L24 -18 Q0 -8 -24 -18 Z', fill: 'ink' },
  { c: [0, -33, 4.2], fill: 'tile' },
  { c: [-9.5, -3, 6], fill: 'tile' }, { c: [9.5, -3, 6], fill: 'tile' },
  { c: [-8.5, -2, 2.6], fill: 'ink' }, { c: [10.5, -2, 2.6], fill: 'ink' },
 ],
};
