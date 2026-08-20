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

ORDER = {
    'h1': ['torso', 'arm', 'head', 'chain'],
    'h2': ['hair_back', 'torso', 'head', 'hair_front'],
    'h3': ['legs', 'body', 'wing', 'head_neck'],
    'h4': ['body', 'speaker_top', 'speaker_bottom', 'handle'],
    'h5': ['wheel_rear', 'body', 'wheel_front', 'headlight'],
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
