"""Generate the Strike Monkey bowling-lane Buy Bonus badge.

Four vector states share one silhouette: cream scorecard for the default UI,
navy scorecard for the legacy skin, and a ball-and-pins impact on hover.
The BUY BONUS caption is placed by the game, never baked into the art.
"""
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "static/assets/sprites/sushiUi"
INK = "#14262e"
CREAM = "#fff4de"
RED = "#e8502e"


def pin(x: int, y: int, tilt: int) -> str:
    return f'''<g transform="translate({x} {y}) rotate({tilt})">
      <path d="M-16 38 C-20 29-19 18-13 7 Q-8-2-9-13 L-11-31
               Q-11-41 0-42 Q11-41 11-31 L9-13 Q8-2 13 7
               C19 18 20 29 16 38 Q0 47-16 38Z"
            fill="{CREAM}" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M-9-16 Q0-12 9-16" fill="none" stroke="{RED}" stroke-width="8" stroke-linecap="round"/>
    </g>'''


def badge(dark: bool, stage: int) -> str:
    face = "#24383f" if dark else CREAM
    caption_edge = CREAM if dark else INK
    rim = CREAM if stage == 3 and dark else ("#ff7350" if stage == 3 else RED)
    ball_x = (150, 170, 210, 245)[stage]
    ball_y = (151, 149, 147, 146)[stage]
    pins = [(306, 144, (-7, -7, 4, 22)[stage]),
            (358, 139, (5, 5, 10, 36)[stage]),
            (405, 148, (12, 12, 16, 51)[stage])]
    pin_art = "".join(pin(*p) for p in pins)
    movement = ('''<path d="M76 105h57 M61 137h56 M72 169h52" fill="none"
      stroke="#fff4de" stroke-width="8" stroke-linecap="round"/>''' if stage == 0 else '''
      <path d="M86 106h54 M63 141h61 M83 178h49" fill="none"
        stroke="#fff4de" stroke-width="8" stroke-linecap="round"/>''')
    # The impact is one flat action pose, not a glow or a second stacked panel.
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <path d="M82 33 424 33 Q455 33 463 66 L486 166 466 416
           Q462 470 412 475 H100 Q50 470 46 416 L26 166 49 66 Q57 33 82 33Z"
        fill="{INK}"/>
  <path d="M88 53 H418 Q439 53 445 78 L465 168 447 411
           Q444 450 406 454 H106 Q68 450 65 411 L47 168 67 78 Q73 53 88 53Z"
        fill="{rim}"/>
  <path d="M91 70 H415 Q429 70 433 88 L451 170 441 215 H71
           L61 170 79 88 Q83 70 91 70Z" fill="#e8502e"/>
  <!-- The pins have no faces: they stay bowling equipment, not characters. -->
  {movement}
  <path d="M{ball_x-65} {ball_y+58} Q{ball_x+18} {ball_y+84} {ball_x+89} {ball_y+47}"
        fill="none" stroke="{CREAM}" stroke-width="7" stroke-linecap="round"/>
  <circle cx="{ball_x}" cy="{ball_y}" r="58" fill="{INK}" stroke="{CREAM}" stroke-width="7"/>
  <circle cx="{ball_x-18}" cy="{ball_y-14}" r="8" fill="{CREAM}"/>
  <circle cx="{ball_x+7}" cy="{ball_y-25}" r="8" fill="{CREAM}"/>
  <circle cx="{ball_x+15}" cy="{ball_y+1}" r="8" fill="{CREAM}"/>
  {pin_art}
  <!-- A single scorecard face stays empty for the runtime caption. -->
  <path d="M72 217 H440 L445 408 Q444 438 409 439 H103
           Q68 438 67 408Z" fill="{face}" stroke="{INK}" stroke-width="9"/>
  <path d="M103 421 H409" fill="none" stroke="{caption_edge}" stroke-width="5"
        stroke-linecap="round" opacity=".7"/>
</svg>'''


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for dark in (False, True):
        for stage, suffix in enumerate(("", "_roll1", "_roll2", "_lit")):
            name = "buybonus_sign" + ("_dark" if dark else "") + suffix + ".svg"
            (OUT / name).write_text(badge(dark, stage), encoding="utf-8")
            print(name)
