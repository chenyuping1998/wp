// Original radio-studio choreography. All channels return to rest at 1400ms.
// Contact at 240ms, readable held pose, delayed secondary action, clean settle.
export type WinMove = {
  rotate: [number, number][];
  scale: [number, number, number][];
  translate: [number, number, number][];
  tint: [number, number][];
};
export const WIN_MOVE_MS = 1400;
const move = (
  angle: number,
  lift: number,
  peak: number,
  side = 0,
): WinMove => ({
  rotate: [
    [0, 0],
    [0.12, -angle * 0.3],
    [0.24, angle],
    [0.42, angle * 0.7],
    [0.67, -angle * 0.28],
    [0.92, angle * 0.12],
    [1.4, 0],
  ],
  scale: [
    [0, 1, 1],
    [0.12, 0.96, 0.96],
    [0.24, peak, peak],
    [0.48, peak - 0.025, peak - 0.025],
    [0.86, 1.06, 1.06],
    [1.4, 1, 1],
  ],
  translate: [
    [0, 0, 0],
    [0.12, -side * 0.2, 0.012],
    [0.24, side, -lift],
    [0.5, side * 0.7, -lift * 0.85],
    [0.84, -side * 0.15, -lift * 0.22],
    [1.4, 0, 0],
  ],
  tint: [],
});
const MOVES: Record<string, WinMove> = {
  H1: move(-3, 0.045, 1.18), // DJ: firm beat, head leads
  H2: move(4, 0.025, 1.17, -0.025), // selector: listening tilt
  H3: move(-5, 0.065, 1.2, 0.025), // caller: forward, hair trails
  H4: move(2, 0.035, 1.16), // matriarch: chin up, deliberate settle
  L1: move(-4, 0.055, 1.14, -0.012), // ceramic: one short lift, steam follows
  L2: move(2, 0.025, 1.15), // headband: cup recoil in the mesh
  L3: move(-7, 0.015, 1.16, 0.018), // mic: angular pendulum, anchored base
  L4: move(5, 0.03, 1.14, -0.018), // cassette: reels turn inside a rigid shell
  L5: move(-9, 0.035, 1.14, 0.025), // sneaker: heel-toe flick
  W: move(0, 0.015, 1.21), // heavy relay: solid planted base
  S: move(-2, 0.02, 1.19), // tape transport: heavy case, accelerating spools
  P: move(3, 0.015, 1.12), // signal pack: label remains readable
};
MOVES.X = MOVES.L1;
export const winMoveOf = (symbol: string): WinMove => MOVES[symbol] ?? MOVES.L1;
