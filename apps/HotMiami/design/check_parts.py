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
# h3's body and head_neck are cut in code (design/cut_flamingo_parts.py) after
# three rounds of generated layers could not separate them; its wing is still
# painted into the body, so there is no wing layer to move. h5's wheels DID come
# back as complete wheels on the third round, but drawn larger and brighter than
# the wheels in the shipped symbol — stacking them changes how the car looks,
# and the car is drawn flat at rest, so it would visibly pop the moment it
# landed. The car keeps its whole-symbol idle and lunge instead.
ORDER = {
    # h1/arm is a sliver of sleeve rather than a movable arm — the art is a bust
    # — but it IS part of the silhouette: dropping it took the stack from IoU
    # 1.00 to 0.83. It stays in the stack as a static layer.
    'h1': ['torso', 'arm', 'head', 'chain'],
    'h2': ['hair_back', 'torso', 'head', 'hair_front'],
    'h3': ['body', 'head_neck'],
    'h4': ['body', 'speaker_top', 'speaker_bottom', 'handle'],
    'h5': ['body'],
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

    for p in problems:
        print('  !!', p)
    print('OK: parts stack' if not problems else f'{len(problems)} part problem(s)')
    return 0 if not problems else 1


if __name__ == '__main__':
    sys.exit(main())
