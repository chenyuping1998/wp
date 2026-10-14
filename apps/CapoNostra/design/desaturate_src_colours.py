#!/usr/bin/env python3
"""Art Deco B recolour: replace every hard-coded colour in src/ with the grey of the
same luminance (ART_BRIEF §0.3: black, greys and paper; red only for multipliers).

Desaturating rather than snapping to the four inks keeps each surface's value
design — a glow that was brighter than its plate stays brighter — which is what
the noir conversion of the art did too. Light values lean toward paper (#ECE8DF)
instead of pure white so text and trims match the art's paper.

Only code is touched; comment lines (// … , * … , <!-- … -->) keep the values
they describe. Files that own red or were recoloured by hand are skipped:

  game/palette.ts               the table itself
  components/NeonFrames.svelte  the multiplier reds
  components/WildColumns.svelte rewritten for the Violin Case
  game/assets.ts                no colours, only comments

  desaturate_src_colours.py           dry run: list every replacement
  desaturate_src_colours.py --write   apply
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

APP = Path(__file__).resolve().parent.parent
SRC = APP / "src"
SKIP = {
    "game/palette.ts",
    "components/NeonFrames.svelte",
    "components/WildColumns.svelte",
    "game/assets.ts",
}
PAPER = (0xEC, 0xE8, 0xDF)
PAPER_L = 0.299 * PAPER[0] + 0.587 * PAPER[1] + 0.114 * PAPER[2]

HEX_NUM = re.compile(r"0x([0-9a-fA-F]{6})\b")
HEX_CSS = re.compile(r"#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b(?![0-9a-fA-F])")
RGB_CSS = re.compile(r"rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})")
COMMENT = re.compile(r"^\s*(//|\*|/\*|<!--)")


# The old palette's own colours map by ROLE, exactly as game/palette.ts does, so a
# literal 0xC9A227 and the GOLD constant land on the same grey. Desaturating gold
# by luminance alone would give #A0A0A0 where palette.ts says the trim role is
# #D4D0C6, and the same trim would be two greys depending on how it was typed.
ROLE = {
    0x14100D: 0x121212,  # INK_DEEP
    0x1E1813: 0x1C1C1C,  # INK
    0x3A1A1C: 0x262626,  # WINE_DEEP
    0x5C2126: 0x333333,  # WINE
    0x8A6D1F: 0x8C8C8C,  # GOLD_DARK
    0xC9A227: 0xD4D0C6,  # GOLD
    0xE8D48B: 0xF7F4EC,  # GOLD_LIGHT
    0xE6DFD1: 0xECE8DF,  # BONE
    0x2B3138: 0x333333,  # GUNMETAL_DARK
    0x4A545E: 0x5E5E5E,  # GUNMETAL
}


def grey(r: int, g: int, b: int) -> tuple[int, int, int]:
    value = (r << 16) | (g << 8) | b
    role = ROLE.get(value)
    if role is not None:
        return (role >> 16) & 255, (role >> 8) & 255, role & 255
    if value in ROLE.values():
        return r, g, b  # already a role grey: a second run must not move it
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    k = lum / PAPER_L
    if all(abs(c - p * k) <= 3 for c, p in zip((r, g, b), PAPER)):
        return r, g, b  # already on the paper line
    if max(r, g, b) - min(r, g, b) <= 6:
        return r, g, b  # already neutral: leave it exactly as designed
    if lum >= 200:
        k = min(lum / PAPER_L, 255 / max(PAPER))
        return tuple(round(c * k) for c in PAPER)  # type: ignore[return-value]
    v = round(lum)
    return v, v, v


def convert_line(line: str) -> str:
    def num(m: re.Match) -> str:
        h = m.group(1)
        r, g, b = (int(h[i : i + 2], 16) for i in (0, 2, 4))
        return "0x%02x%02x%02x" % grey(r, g, b)

    def css(m: re.Match) -> str:
        h = m.group(1)
        if len(h) == 3:
            h = "".join(c * 2 for c in h)
        r, g, b = (int(h[i : i + 2], 16) for i in (0, 2, 4))
        return "#%02x%02x%02x" % grey(r, g, b)

    def rgb(m: re.Match) -> str:
        r, g, b = (int(m.group(i)) for i in (1, 2, 3))
        nr, ng, nb = grey(r, g, b)
        whole = m.group(0)
        head = whole[: whole.index("(") + 1]
        return f"{head}{nr}, {ng}, {nb}"

    line = HEX_NUM.sub(num, line)
    line = HEX_CSS.sub(css, line)
    line = RGB_CSS.sub(rgb, line)
    return line


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    a = ap.parse_args()
    total = 0
    for path in sorted(SRC.rglob("*")):
        if path.suffix not in {".ts", ".svelte", ".css"}:
            continue
        rel = path.relative_to(SRC).as_posix()
        if rel in SKIP:
            continue
        lines = path.read_text().split("\n")
        changed = 0
        in_html_comment = False
        for i, line in enumerate(lines):
            if "<!--" in line and "-->" not in line:
                in_html_comment = True
            if in_html_comment or COMMENT.match(line):
                if "-->" in line:
                    in_html_comment = False
                continue
            new = convert_line(line)
            if new != line:
                changed += 1
                if not a.write:
                    print(f"{rel}:{i + 1}: {line.strip()[:70]}  ->  {new.strip()[:70]}")
                lines[i] = new
        if changed:
            total += changed
            if a.write:
                path.write_text("\n".join(lines))
                print(f"{rel}: {changed} lines")
    print(f"{'wrote' if a.write else 'would change'} {total} lines")


if __name__ == "__main__":
    main()
