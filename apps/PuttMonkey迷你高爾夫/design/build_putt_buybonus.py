"""Generate Putt Monkey's windmill-hole Buy Bonus button (2026-10-17).

The classic mini-golf windmill: the cottage front is the caption face, the
sails turn on its red cap behind the cottage, and the hole is the arched door
under the caption. On hover the sails turn a quarter (four sails, so it ends
where it began) while a ball rolls in from the tee and drops through the
door, kicking up a little turf; the last frame holds with the door lit.

Seven states per skin, one silhouette:
  buybonus_sign[_dark].svg          idle
  buybonus_sign[_dark]_roll1..5.svg the hover run (uiTheme.buyBonusHoverFrames)
  buybonus_sign[_dark]_lit.svg      held while hovered
The caption is placed by the game (uiTheme.buyBonusLabelOffsetY), never baked
in. The caption sits at y≈232–372 (offset 0.1) on the 512 canvas for it.

Flat fills, one ink weight, round caps (PUTT_美術需求單 §0); no glow.
"""
from math import cos, radians, sin
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "static/assets/sprites/sushiUi"
INK = "#1b2a22"
CREAM = "#fff6df"
CREAM2 = "#f4eacb"
TURF = "#3e7a45"
TURF_DARK = "#2f5e36"
TURF_LIGHT = "#7fb06a"
RED = "#e5432f"
RED_LIT = "#ff5c4a"
W = 10  # outline, ~1.5% of the 512 canvas plus a touch for the small size

HUB = (256, 172)
DOOR = (256, 440, 32, 54)  # centre x, sill y, half width, height to the arch top
# the hover run: sail turn (deg), ball x (None: in the hole / gone), ball scale, turf puff
FRAMES = {
    "": (0, 100, 1.0, 0),
    "_roll1": (15, 136, 1.0, 0),
    "_roll2": (30, 178, 1.0, 0),
    "_roll3": (45, 216, 1.0, 0),
    "_roll4": (60, 252, 0.8, 1),
    "_roll5": (75, None, 0, 2),
    "_lit": (90, None, 0, 0),
}


def sail(angle: float) -> str:
    """One lattice sail from the hub outward at `angle` (0 = straight up)."""
    r0, r1, half = 22, 142, 22
    rows = "".join(
        f'<path d="M{-half + 4} {-r} H{half - 4}" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>'
        for r in (56, 84, 112)
    )
    return f'''<g transform="translate({HUB[0]} {HUB[1]}) rotate({angle})">
    <path d="M-5 -6 V{-r1}" stroke="{INK}" stroke-width="12" stroke-linecap="round"/>
    <rect x="{-half}" y="{-r1}" width="{half * 2}" height="{r1 - r0}" rx="9"
          fill="{CREAM}" stroke="{INK}" stroke-width="{W - 2}"/>
    <path d="M0 {-r1 + 6} V{-r0 - 4}" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>
    {rows}
  </g>'''


def ball(x: float, scale: float) -> str:
    r = 22 * scale
    y = DOOR[1] - r - 2
    return f'''<g>
    <ellipse cx="{x}" cy="{DOOR[1] + 1}" rx="{r * 0.9}" ry="4" fill="{TURF_DARK}"/>
    <circle cx="{x}" cy="{y}" r="{r}" fill="{CREAM}" stroke="{INK}" stroke-width="6"/>
    <circle cx="{x - r * 0.35}" cy="{y - r * 0.2}" r="3.6" fill="{CREAM2}" stroke="{INK}" stroke-width="1.5"/>
    <circle cx="{x + r * 0.25}" cy="{y + r * 0.3}" r="3.6" fill="{CREAM2}" stroke="{INK}" stroke-width="1.5"/>
  </g>'''


def puff(stage: int) -> str:
    """Turf kicked out of the hole: close and full, then higher and thinning."""
    if not stage:
        return ""
    lift, size = (0, 1.6) if stage == 1 else (22, 1.15)
    cx, sill = DOOR[0], DOOR[1]
    bits = [(-54, -18), (-38, -44), (40, -40), (56, -14), (0, -72)]
    out = []
    for i, (dx, dy) in enumerate(bits):
        x, y = cx + dx * (1 + 0.25 * (stage - 1)), sill + dy - lift
        if i % 2:
            out.append(f'<circle cx="{x}" cy="{y}" r="{5 * size}" fill="{CREAM}" stroke="{INK}" stroke-width="4"/>')
        else:
            out.append(
                f'<path d="M{x - 7 * size} {y + 4 * size} Q{x} {y - 9 * size} {x + 7 * size} {y + 4 * size}Z" '
                f'fill="{TURF_LIGHT}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
            )
    return "".join(out)


def badge(dark: bool, suffix: str) -> str:
    turn, ball_x, ball_s, puff_stage = FRAMES[suffix]
    lit = suffix == "_lit"
    face = "#22352a" if dark else CREAM
    keyline = TURF_LIGHT if dark else CREAM2
    roof = RED_LIT if lit else RED
    cx, sill, dw, dh = DOOR
    door_fill = CREAM if lit else ("#0f1913" if dark else INK)
    door_edge = TURF_LIGHT if dark and not lit else INK
    sails = "".join(sail(45 + turn + 90 * k) for k in range(4))
    # cottage: square-shouldered, a little wider at the foot
    body = "M74 214 Q74 196 94 196 H418 Q438 196 438 214 L452 446 H60 Z"
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <!-- sails behind everything: only their outer halves show -->
  {sails}
  <!-- the putting green under the cottage -->
  <rect x="34" y="430" width="444" height="44" rx="22" fill="{TURF}" stroke="{INK}" stroke-width="{W}"/>
  <path d="M74 452 H160 M196 452 H230 M290 452 H330 M366 452 H440" stroke="{TURF_LIGHT}"
        stroke-width="6" stroke-linecap="round"/>
  <!-- the cottage front is the caption face -->
  <path d="{body}" fill="{face}" stroke="{INK}" stroke-width="{W + 2}" stroke-linejoin="round"/>
  <path d="M90 216 Q90 210 98 210 H414 Q422 210 422 216 L434 430" fill="none" stroke="{keyline}"
        stroke-width="4" stroke-linecap="round" opacity=".8"/>
  <path d="M90 216 L78 430" fill="none" stroke="{keyline}" stroke-width="4" stroke-linecap="round" opacity=".8"/>
  <!-- the red cap with its wave hem -->
  <path d="M84 214 C92 176 168 160 256 160 C344 160 420 176 428 214
           {''.join(f'Q{428 - 17 - 34 * i} {232} {428 - 34 * (i + 1)} {214} ' for i in range(10))}Z"
        fill="{roof}" stroke="{INK}" stroke-width="{W}" stroke-linejoin="round"/>
  <!-- the hole: an arched door at the foot -->
  <path d="M{cx - dw} {sill} V{sill - dh + dw} A{dw} {dw} 0 0 1 {cx + dw} {sill - dh + dw} V{sill} Z"
        fill="{door_fill}" stroke="{door_edge}" stroke-width="{W - 2}" stroke-linejoin="round"/>
  {ball(cx, ball_s) if ball_x == 252 else ''}
  {ball(ball_x, ball_s) if ball_x is not None and ball_x != 252 else ''}
  {puff(puff_stage)}
  <!-- the hub, on top of the cap -->
  <circle cx="{HUB[0]}" cy="{HUB[1]}" r="20" fill="{CREAM}" stroke="{INK}" stroke-width="{W - 2}"/>
  <circle cx="{HUB[0]}" cy="{HUB[1]}" r="7" fill="{INK}"/>
</svg>'''


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:  # preview into another folder
        OUT = Path(sys.argv[1])
    OUT.mkdir(parents=True, exist_ok=True)
    for dark in (False, True):
        for suffix in FRAMES:
            name = "buybonus_sign" + ("_dark" if dark else "") + suffix + ".svg"
            (OUT / name).write_text(badge(dark, suffix), encoding="utf-8")
            print(name)
