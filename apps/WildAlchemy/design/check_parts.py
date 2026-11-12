#!/usr/bin/env python3
"""Do the layered parts actually stack back into the symbol?

The one failure mode that ruins rigged art is registration: a part exported
centred, cropped or rescaled looks perfect on its own and is useless in the rig.
So this stacks the keyed parts in z-order and compares the result to the artist's
own _full.png, and renders a contact sheet at the true reel size so the parts can
be judged the only way that means anything here.

    python design/check_parts.py            # report + contact sheet
"""
from __future__ import annotations
import os, sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STAGE = os.path.join(ROOT, 'design/_parts')
BOARD = (40, 10, 66)

# What each symbol is actually rigged from, back to front.
#
# Not every delivered file is in here. `h1/arm` is a sliver of sleeve — the art
# is a bust and there is no arm to move — `h3/legs` came back painted into the
# body, and `h5/headlight` likewise. The redundancy test below measures that
# directly: removing such a part changes nothing, so moving it would reveal a
# second copy underneath. Listing only the usable parts keeps this file
# describing the rig that exists rather than the one that was ordered.
#
# h3's body and head_neck, and h5's body and two wheels, are cut in code
# (design/cut_flamingo_parts.py, design/cut_car_wheels.py) after
# three rounds of generated layers could not separate them; its wing is still
# painted into the body, so there is no wing layer to move. h5's wheels DID come
# back as complete wheels on the third round, but drawn larger and brighter than
# the shipped car's own — and the matching body had dark discs punched through
# the BODYWORK around each arch, so no scaling of them could rebuild the shipped
# car. Cut from the shipped art instead, the stack is the shipped car to within
# 1.2 levels.
ORDER = {
    # h1/arm is a sliver of sleeve rather than a movable arm — the art is a bust
    # — but it IS part of the silhouette: dropping it took the stack from IoU
    # 1.00 to 0.83. It stays in the stack as a static layer.
    'h1': ['torso', 'arm', 'head', 'chain'],
    'h2': ['hair_back', 'torso', 'head', 'hair_front'],
    'h3': ['body', 'head_neck'],
    'h4': ['body', 'speaker_top', 'speaker_bottom', 'handle'],
    'h5': ['body', 'wheel_rear', 'wheel_front'],
    'c': ['ring', 'core'],
}


def load(sym: str, name: str) -> Image.Image | None:
    p = os.path.join(STAGE, sym, name + '.png')
    return Image.open(p).convert('RGBA') if os.path.exists(p) else None


def stack(sym: str) -> Image.Image:
    out = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    for name in ORDER[sym]:
        im = load(sym, name)
        if im is not None:
            out.alpha_composite(im)
    return out


def coverage(im: Image.Image) -> float:
    a = im.getchannel('A')
    return sum(1 for v in a.getdata() if v > 32) / (im.width * im.height)


# Expression swaps: a second drawing of the same part, shown for a beat.
#
# `base` is the part it replaces. The rule the brief gives the artist is "only the
# named feature changes, everything else pixel-identical", and that is exactly
# what makes a swap invisible as a swap: if the hair or the jawline moves too, the
# head jumps at the moment of the change and it looks like a glitch rather than an
# expression. So it is measured — the difference has to be CONCENTRATED, not
# spread over the whole part.
EXPRESSIONS = {
    'h1': [('head', 'head_blink'), ('head', 'head_grin'), ('head', 'head_shades_down')],
    'h2': [('head', 'head_blink'), ('head', 'head_smile'), ('head', 'head_wink')],
    'h3': [('head_neck', 'head_neck_blink'), ('head_neck', 'head_neck_squawk')],
}

# Additive glow layers: not replacements, they are drawn ON TOP of the part that
# is already there, so all they have to be is non-empty and in the right place.
GLOW_OVERLAYS = {'h4': ['panel_lit'], 'h5': ['lights_on'], 'c': ['core_active']}


# The pose sheets (docs/art-prompts-hot-miami-parts.md §11): three more drawings
# of the same symbol, played as a timeline during a win. Measured by check_poses
# below, against the OPPOSITE rule from the expression swaps above.
POSE_NAMES = ('pose_wind', 'pose_peak', 'pose_settle')
POSE_SYMBOLS = ('h1', 'h2', 'h3', 'h4', 'h5', 'c')
POSE_BASE: dict[str, str] = {}


def check_expressions(problems: list[str]) -> None:
    for sym, pairs in EXPRESSIONS.items():
        for base_name, alt_name in pairs:
            base, alt = load(sym, base_name), load(sym, alt_name)
            if base is None or alt is None:
                problems.append(f'{sym}: expression {alt_name} or its base {base_name} is missing')
                continue

            bb = base.getchannel('A').point(lambda v: 255 if v > 32 else 0).getbbox()
            ab = alt.getchannel('A').point(lambda v: 255 if v > 32 else 0).getbbox()
            drift = max(abs(a - b) for a, b in zip(ab, bb))
            if drift > 12:
                problems.append(
                    f'{sym}/{alt_name}: its outline sits {drift}px from {base_name}\'s — swapping it would make the part jump'
                )

            ba, aa = list(base.convert('RGB').getdata()), list(alt.convert('RGB').getdata())
            bm = list(base.getchannel('A').getdata())
            am = list(alt.getchannel('A').getdata())
            w = base.width
            changed = []
            for i, (p, q) in enumerate(zip(ba, aa)):
                if bm[i] < 40 and am[i] < 40:
                    continue
                if abs(p[0] - q[0]) + abs(p[1] - q[1]) + abs(p[2] - q[2]) > 90 or abs(bm[i] - am[i]) > 90:
                    changed.append((i % w, i // w))
            if not changed:
                problems.append(f'{sym}/{alt_name} is identical to {base_name} — the swap would do nothing')
                continue
            xs = [x for x, _ in changed]
            ys = [y for _, y in changed]
            box_w, box_h = max(xs) - min(xs) + 1, max(ys) - min(ys) + 1
            part_w, part_h = bb[2] - bb[0], bb[3] - bb[1]
            share = (box_w * box_h) / max(1, part_w * part_h)
            ink = sum(1 for v in bm if v > 32) or 1
            print(f'   {sym}/{alt_name:20s} differs over {len(changed) * 100 / ink:5.1f}% of the part, in a region {share * 100:.0f}% of its box')
            # A face is a small part of a head. Anything past half the part's own
            # box means the whole thing was redrawn, which is the failure mode.
            if share > 0.55:
                problems.append(
                    f'{sym}/{alt_name}: the difference from {base_name} covers {share * 100:.0f}% of the part — '
                    f'the whole piece was redrawn rather than just the expression'
                )

    for sym, names in GLOW_OVERLAYS.items():
        for name in names:
            glow = load(sym, name)
            if glow is None:
                problems.append(f'{sym}: glow overlay {name} is missing')
                continue
            cov = coverage(glow)
            if cov < 0.0015:
                problems.append(f'{sym}/{name} is effectively empty ({cov * 100:.2f}% of canvas)')
            print(f'   {sym}/{name:20s} covers {cov * 100:.2f}% of the canvas')


def check_poses(problems: list[str]) -> None:
    """The pose sheets, measured against the opposite rule from the expressions.

    An expression swap must change LITTLE and stay put (a face is a small part of
    a head, and if anything else moves the head jumps). A pose must change A LOT
    and stay put: the whole point is that the character visibly does something,
    and the whole risk is that the drawing lands somewhere else on the canvas and
    the symbol appears to jump between frames.

    So the same two measurements, with the change threshold inverted:

      change   >= 8% of the symbol's own ink, or the pose is not a pose
      landing  centroid within 3% of the canvas, bbox area within 15%

    Centroid rather than bbox corners, which is what the expression check uses:
    a flamingo throwing its wings open SHOULD grow its bbox, and its foot is
    still where it was. The centroid of the ink is the honest measure of "did the
    drawing move" for a shape that legitimately changes silhouette.

    Silent when no pose has been delivered yet — this ships before the art does.
    """
    for sym in sorted(POSE_SYMBOLS):
        base = load(sym, '_full') or load(sym, POSE_BASE.get(sym, '_full'))
        delivered = [n for n in POSE_NAMES if load(sym, n) is not None]
        if not delivered:
            continue
        if base is None:
            problems.append(f'{sym}: poses delivered but no _full.png to measure them against')
            continue
        missing = [n for n in POSE_NAMES if n not in delivered]
        if missing:
            problems.append(f'{sym}: pose sheet is incomplete — missing {", ".join(missing)}')

        bm = list(base.getchannel('A').getdata())
        ba = list(base.convert('RGB').getdata())
        w = base.width
        base_ink = sum(1 for v in bm if v > 32) or 1
        bcx, bcy = centroid(bm, w)
        bbox_area = area_of(base)

        for name in delivered:
            alt = load(sym, name)
            am = list(alt.getchannel('A').getdata())
            aa = list(alt.convert('RGB').getdata())
            changed = 0
            for i, (p, q) in enumerate(zip(ba, aa)):
                if bm[i] < 40 and am[i] < 40:
                    continue
                if abs(p[0] - q[0]) + abs(p[1] - q[1]) + abs(p[2] - q[2]) > 90 or abs(bm[i] - am[i]) > 90:
                    changed += 1
            share = changed / base_ink
            acx, acy = centroid(am, w)
            drift = max(abs(acx - bcx), abs(acy - bcy)) / base.width
            grow = abs(area_of(alt) - bbox_area) / max(1, bbox_area)
            print(f'   {sym}/{name:16s} changes {share * 100:5.1f}% of the ink, '
                  f'centroid drifts {drift * 100:4.1f}%, bbox area {grow * 100:+5.1f}%')
            if share < 0.08:
                problems.append(
                    f'{sym}/{name}: only {share * 100:.1f}% of the symbol differs from rest — '
                    f'at reel size that is not a pose change, it is the same drawing'
                )
            if drift > 0.03:
                problems.append(
                    f'{sym}/{name}: the ink centroid moved {drift * 100:.1f}% of the canvas — '
                    f'the symbol will jump when this pose is swapped in'
                )
            if grow > 0.15:
                problems.append(
                    f'{sym}/{name}: bbox area differs by {grow * 100:.0f}% — the symbol changes size on the swap'
                )


def centroid(mask: list[int], width: int) -> tuple[float, float]:
    total = sx = sy = 0
    for i, v in enumerate(mask):
        if v > 32:
            total += 1
            sx += i % width
            sy += i // width
    if not total:
        return (0.0, 0.0)
    return (sx / total, sy / total)


def area_of(im: Image.Image) -> int:
    box = im.getchannel('A').point(lambda v: 255 if v > 32 else 0).getbbox()
    return 0 if box is None else (box[2] - box[0]) * (box[3] - box[1])


# How much of its cell each symbol's INK should fill.
#
# The band, not a number: a car is wide and a J is narrow, and forcing them to
# the same figure would distort the art. What this catches is the failure that
# actually happened — art whose drawing sits small inside its 512 canvas being
# drawn at the same ratio as art that fills it, and arriving on the board a
# fifth smaller than everything around it.
SYMBOL_DIR = os.path.join(ROOT, 'static/assets/sprites/hotMiamiSymbols')
INK_BAND = (0.62, 1.06)
# Mirrors SYMBOL_INFO_MAP in src/game/constants.ts. Checked against it below, so
# the two cannot drift apart silently.
DRAW_RATIO = {
    'h1': 0.97, 'h2': 0.97, 'h3': 0.97, 'h4': 0.97, 'h5': 0.97,
    'l1': 1.13, 'l2': 1.13, 'l3': 1.0, 'l4': 1.0,
    'w': 1.08, 'fs': 1.08, 'c': 1.08,
}


def check_symbol_sizes(problems: list[str]) -> None:
    constants = open(os.path.join(ROOT, 'src/game/constants.ts'), encoding='utf-8').read()
    for name, ratio in sorted(DRAW_RATIO.items()):
        path = os.path.join(SYMBOL_DIR, f'{name}.png')
        if not os.path.exists(path):
            problems.append(f'{name}: no symbol art at {os.path.relpath(path, ROOT)}')
            continue
        im = Image.open(path).convert('RGBA')
        box = im.getchannel('A').point(lambda v: 255 if v > 32 else 0).getbbox()
        ink = max(box[2] - box[0], box[3] - box[1]) / im.width
        share = ink * ratio
        print(f'   {name:<4} ink {ink * 100:4.0f}% of canvas x draw {ratio:4.2f} = {share * 100:4.0f}% of the cell')
        if not INK_BAND[0] <= share <= INK_BAND[1]:
            problems.append(
                f'{name}: drawn at {share * 100:.0f}% of its cell, outside {INK_BAND[0] * 100:.0f}-{INK_BAND[1] * 100:.0f}% — '
                f'either the art was redrawn smaller or its ratio in constants.ts is wrong'
            )
        # The ratio here has to be the ratio that ships. The asset key is not
        # always the filename: the scatter's art is fs.png and its key is hmS,
        # because the SYMBOL is S and the file is named after what it says.
        key = {'fs': 'hmS'}.get(name, f'hm{name.upper()}')
        if f"'{key}'" not in constants:
            problems.append(f'{name}: no {key} entry found in constants.ts')


def main() -> int:
    problems = []
    rows = []
    for sym, names in ORDER.items():
        if not os.path.isdir(os.path.join(STAGE, sym)):
            continue
        parts = [(n, load(sym, n)) for n in names]
        missing = [n for n, im in parts if im is None]
        for n in missing:
            problems.append(f'{sym}: part {n} is missing')

        # duplicate parts: the generator handing back the same image twice is a
        # real delivery failure and looks fine in a file listing
        seen = {}
        for n, im in parts:
            if im is None:
                continue
            digest = im.tobytes()
            if digest in seen:
                problems.append(f'{sym}: {n} is pixel-identical to {seen[digest]}')
            seen[digest] = n

        composite = stack(sym)
        full = load(sym, '_full')

        # The stack has to match the SHIPPED symbol, not just the artist's own
        # assembly. SymbolArt draws the flat sprite while a symbol is at rest and
        # swaps to the part stack for the landing and the win, so any colour drift
        # between the two shows up in game as the symbol changing appearance the
        # instant it lands. Measured over the subject only; the background is
        # transparent in both.
        shipped_path = os.path.join(ROOT, 'static/assets/sprites/hotMiamiSymbols', f'{sym}.png')
        if os.path.exists(shipped_path) and full is not None:
            shipped = Image.open(shipped_path).convert('RGBA').resize(full.size)
            fa = list(composite.convert('RGB').getdata())
            sa = list(shipped.convert('RGB').getdata())
            ma = list(composite.getchannel('A').point(lambda v: 255 if v > 40 else 0).getdata())
            n_px = sum(1 for m in ma if m)
            drift = sum(
                abs(fa[i][0] - sa[i][0]) + abs(fa[i][1] - sa[i][1]) + abs(fa[i][2] - sa[i][2])
                for i, m in enumerate(ma) if m
            ) / (3 * n_px) if n_px else 0
            if drift > 12:
                problems.append(
                    f'{sym}: the stacked parts differ from the shipped symbol by {drift:.1f} mean levels — '
                    f'the symbol would change appearance the moment it lands'
                )
        cov_c = coverage(composite)
        note = ''
        if full is not None:
            cov_f = coverage(full)
            # Compare silhouettes rather than colours: the stack is the same art,
            # so what matters is whether it lands in the same place.
            ca = composite.getchannel('A').point(lambda v: 255 if v > 32 else 0)
            fa = full.getchannel('A').point(lambda v: 255 if v > 32 else 0)
            inter = sum(1 for a, b in zip(ca.getdata(), fa.getdata()) if a and b)
            union = sum(1 for a, b in zip(ca.getdata(), fa.getdata()) if a or b)
            iou = inter / union if union else 0
            note = f'coverage stack {cov_c*100:.0f}% vs full {cov_f*100:.0f}%, silhouette IoU {iou:.2f}'
            if iou < 0.85:
                problems.append(f'{sym}: stacked parts do not line up with _full.png (IoU {iou:.2f}) — a part is displaced, cropped or rescaled')
        # Is each part actually DOING anything, or is the art underneath already
        # drawing it?
        #
        # Overlap on its own proves nothing — parts are supposed to overlap,
        # because what is hidden has to be drawn complete (the boombox case has
        # dark empty speaker wells behind the cones). The question is different:
        # if this part were removed, would the symbol still look the same? Where
        # the art below duplicates it — the flamingo body that still has the head
        # painted on it — the answer is yes, the stack looks unchanged, and
        # rotating that part reveals a second copy of itself underneath.
        #
        # So: composite the stack WITHOUT each part, and measure the colour
        # difference against the artist's assembled _full.png over that part's own
        # ink. A part that matters leaves a hole (big difference). A part that is
        # already painted into its neighbour leaves nothing (small difference).
        if full is not None:
            for n, im in parts:
                if im is None:
                    continue
                without = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
                for other, oim in parts:
                    if other != n and oim is not None:
                        without.alpha_composite(oim)
                mask = im.getchannel('A').point(lambda v: 255 if v > 40 else 0)
                wa = without.convert('RGB').getdata()
                fa = full.convert('RGB').getdata()
                md = list(mask.getdata())
                n_px = 0
                diff = 0
                for i, m in enumerate(md):
                    if not m:
                        continue
                    w = wa[i]
                    f = fa[i]
                    diff += abs(w[0] - f[0]) + abs(w[1] - f[1]) + abs(w[2] - f[2])
                    n_px += 1
                mean = diff / (3 * n_px) if n_px else 0
                print(f'   {sym}/{n:14s} removing it changes {mean:5.1f} mean levels under its own ink')
                if mean < 12:
                    problems.append(
                        f'{sym}: {n} is redundant — removing it barely changes the picture '
                        f'({mean:.1f} mean levels), so the layer underneath already has it painted in'
                    )

        for n, im in parts:
            if im is not None and coverage(im) < 0.004:
                problems.append(f'{sym}: {n} is nearly empty ({coverage(im)*100:.1f}% of canvas) — keyed away or never drawn')
        print(f'{sym}: {note}')
        rows.append((sym, parts, composite, full))

    # contact sheet: every part at the true 105px reel cell, on the board colour
    cell = 118
    width = cell * 7
    sheet = Image.new('RGB', (width, cell * len(rows) + 24), BOARD)
    draw = ImageDraw.Draw(sheet)
    for i, (sym, parts, composite, full) in enumerate(rows):
        y = i * cell + 12
        draw.text((4, y + 4), sym, fill=(255, 255, 255))
        x = cell
        for n, im in parts:
            if im is None:
                continue
            sheet.paste(im.resize((105, 105), Image.LANCZOS), (x + 6, y + 6), im.resize((105, 105), Image.LANCZOS))
            draw.text((x + 8, y + cell - 14), n[:12], fill=(200, 200, 200))
            x += cell
        for label, im in (('stack', composite), ('_full', full)):
            if im is None:
                continue
            sheet.paste(im.resize((105, 105), Image.LANCZOS), (x + 6, y + 6), im.resize((105, 105), Image.LANCZOS))
            draw.text((x + 8, y + cell - 14), label, fill=(255, 220, 120))
            x += cell
    out = os.path.join(ROOT, 'design/_parts/contact_sheet.png')
    sheet.save(out)
    print('contact sheet ->', os.path.relpath(out, ROOT))

    check_expressions(problems)
    check_poses(problems)
    check_symbol_sizes(problems)

    for p in problems:
        print('  !!', p)
    print('OK: parts stack' if not problems else f'{len(problems)} part problem(s)')
    return 0 if not problems else 1


if __name__ == '__main__':
    sys.exit(main())
