#!/usr/bin/env python3
"""Catch source art that was DRAWN BY A SCRIPT rather than by an artist or a model.

Written after 2026-08-27, when a batch of 42 source images arrived that was
technically perfect — right canvas sizes, right chroma keys, right filenames —
and was flat polygons produced by a PIL script in design/ whose own docstring
named this repo's gate thresholds as its targets:

    "Anchored directly to base _full.png silhouette so centroid drift < 3.0%,
     bbox area change < 15%, and ink change >= 8.0%"

Those are check_parts.py's numbers. The batch was written against the checker.

── THE TEST ────────────────────────────────────────────────────────────────────

Distinct colour count, qualified by how much of the canvas the subject covers.

Painted and model-generated art carries thousands of colours even when it is flat
cel work, because every edge ramps and every fill has variance. A polygon filled
by a drawing library carries one colour per polygon. Measured:

    art that ships          3,348   4,100   14,729   colours   (subject >= 5%)
    the rejected cast           4       8        4   colours   (subject >= 5%)

Nothing sits between 8 and 3,348, so the limit is set at 256 with room on both
sides. The coverage qualifier is what keeps small flat GRAPHICS legitimate —
h4/panel_lit.png is three colours and correct, and covers 0.8% of its canvas.

── IT WAS DEFEATED ON THE NEXT ATTEMPT. READ THIS BEFORE TRUSTING IT ───────────

The batch regenerated after this file was written PASSED it, and was the same
flat mannequins with the same rectangles pasted on. The colour counts went from
4-8 to 2,000-24,000: adding noise to a polygon fill is a one-line change once you
know the metric, and the metric is written down here.

That is the shape of the problem, and it is not fixable by choosing a better
number. Anything measurable can be satisfied directly by whatever is producing
the files. A third metric would buy a third round.

So this gate is kept for what it is — a cheap catch for the crude case — and NOT
treated as evidence that a batch is usable. The check that actually worked both
times was design/review_sheet.py and two seconds of looking.

── WHAT THIS CANNOT DO ─────────────────────────────────────────────────────────

It cannot tell whether a pose is a pose, or whether the character is the right
character. Three metrics were tried for that and all three were dropped after
being measured against controls. Recording them so they are not tried again:

  · colour count on the POSE sheets. They inherit the base art, so they measure
    13,000-39,000 colours and look perfect. This gate is blind to them.
  · fraction of the subject byte-identical to the base. The rejected poses score
    66-85%. So do the expression variants that ship today (97-99.9%) — because an
    expression swap is REQUIRED to leave everything else untouched. The metric
    cannot separate "correctly edited" from "cheaply pasted".
  · hard-edge fraction inside the changed region. Controls that an image model
    genuinely drew score 64-99%; the rejected poses score 14-85%. They overlap
    completely, and some of the bad art scores lower than the good.

So for the pose sheets there is deliberately no gate. A gate that passes bad art
is worse than no gate — that is the whole lesson of the batch this file exists
because of. Render them with design/review_sheet.py and look.

    python design/check_source_art.py            # every source image
    python design/check_source_art.py --report   # print the numbers
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'design/source'

MIN_COLOURS = 256
# Below this the subject is a small graphic — an icon, a lit panel, a chain —
# where a handful of flat colours is the correct answer.
MIN_SUBJECT_PCT = 5.0
KEYS = ((0, 255, 0), (255, 0, 255))


def measure(path: Path) -> tuple[float, int]:
    """Subject coverage as a percentage, and the number of distinct colours.

    Sampled every third pixel for coverage: it decides only whether the image is
    big enough to judge, and a third of a percent either way changes nothing.
    """
    image = Image.open(path).convert('RGB')
    px = image.load()
    width, height = image.size

    subject = 0
    xs = range(0, width, 3)
    ys = range(0, height, 3)
    for y in ys:
        for x in xs:
            colour = px[x, y]
            if any(all(abs(c - k) < 60 for c, k in zip(colour, key)) for key in KEYS):
                continue
            if all(c > 245 for c in colour):
                continue
            subject += 1

    colours = image.getcolors(maxcolors=1_000_000)
    return subject / (len(xs) * len(ys)) * 100, (len(colours) if colours else 1_000_000)


def main() -> int:
    report = '--report' in sys.argv
    problems: list[str] = []
    rows: list[str] = []

    # Rig placement guides are intentionally programmatic flat geometry, not
    # shippable art.  Judge only actual source art with this gate.
    paths = sorted(
        path for path in SOURCE.rglob('*.png')
        if not any(part.startswith('images_placeholder') for part in path.parts)
        and not path.name.endswith('_pose_master_debug.png')
    )
    for path in paths:
        with Image.open(path) as source_image:
            if 'A' in source_image.getbands() and source_image.getchannel('A').getbbox() is None:
                rows.append(f'{str(path.relative_to(ROOT)):58} empty transparent canvas')
                continue
        coverage, colours = measure(path)
        rel = path.relative_to(ROOT)
        rows.append(f'{str(rel):58} subject {coverage:5.1f}%  colours {colours:>7}')
        if coverage < MIN_SUBJECT_PCT:
            continue
        if colours < MIN_COLOURS:
            problems.append(
                f'{rel}: {colours} distinct colours over {coverage:.0f}% of the canvas '
                f'(limit {MIN_COLOURS}). Art that is drawn carries thousands even when it '
                f'is flat cel work; this many means flat polygons, i.e. drawn by a script.'
            )

    if report:
        print(f'{len(paths)} source images\n')
        print('\n'.join(rows))
        print('')

    if problems:
        print('check_source_art FAILED')
        for problem in problems:
            print('  - ' + problem)
        return 1

    print(f'check_source_art ok ({len(paths)} images)')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
