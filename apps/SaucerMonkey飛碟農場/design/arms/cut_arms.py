"""Cut the Saucer cast's forearms, hands and props off their single drawings
(2026-10-23), so the acting can move them further than the continuous mesh
allows (build_cast_mesh.py: the mesh's joints tear past a few degrees).

Same rules as Putt's design/swing/cut_golfer_arms.py (spine-generator's
生圖交付規格): what a piece hides is painted, pieces overlap at the joints,
no joint shows a flat cut. The upper arms stay in the mesh; each cut arm gets

  fore<S>    the forearm, from the elbow seam to the wrist, with a round cap of
             the upper arm's own drawing under ...
  sleeve<S>  ... the end of the upper arm, copied off the mesh and laid over
             the cap (it rides the mesh's arm bone, so at rest it is the mesh)
  hand<S>    the hand and whatever it holds, capped under the forearm

and a light for the prop (the captain's remote button, the kid's torch beam),
drawn additive, off until a clip turns it on.

The captain (mg) has both forearms cut; the farm kid (fg) only the torch arm
(his free hand crosses his tail, which would have to be repainted).

Writes design/source/saucer/cast/<cast>/arms/{parts,cels}/ and cut.json in the
`rig` form build_cast_mesh.py reads (pieces on the mesh's own bones).

    python -I design/arms/cut_arms.py [mg|fg]
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
SRC = HERE.parent / 'source/saucer/cast'
W, H = 560, 912
INK = np.array([20, 22, 40], float)

# Coordinates on the 560x912 canvas (y down), read off 3x / 6x grids of
# normalized.png. `lower` loosely bounds forearm + hand + prop (the floods
# below trim it to the drawing), `seeds` sit on their paint, `fore` (a flood
# of its own, or a wrist line) splits the forearm from the hand.
CASTS = {
    'mg': dict(
        arms={
            'L': dict(
                shoulder=(170, 390), elbow=(146, 468), wrist=(112, 502), hand_tip=(64, 524),
                lower=[(10, 405), (85, 405), (100, 470), (100, 486), (112, 476), (128, 470), (145, 468), (160, 470), (169, 474), (169, 535), (140, 600), (10, 600)],
                seeds=[(130, 492), (150, 498), (112, 486), (60, 520), (80, 548), (100, 506), (75, 478), (92, 522), (105, 545), (84, 494), (37, 430), (46, 448), (53, 460)],
                # the bell cuff: its own flood (it is ringed by ink)
                fore_seeds=[(130, 492), (150, 498), (112, 486), (158, 506), (140, 512)],
                fore_poly=[(100, 486), (112, 476), (128, 470), (145, 468), (160, 470), (169, 474), (169, 528), (126, 532), (96, 506)],
                # the end of the upper arm (its last two ribs) laid over the cap
                sleeve=[(108, 470), (118, 444), (150, 432), (178, 436), (180, 476), (146, 468)],
                elbow_cap=24, wrist_cap=28,
                light=dict(kind='button', at=(83, 494), r=13),
                signal=(37, 430),
                # the remote's aerial (stick and ball), its own piece on a
                # spring: it boings when he works the remote (physics, baked)
                aerial=dict(tip=(36, 430), base=(60, 470),
                            poly=[(16, 408), (56, 408), (57, 440), (67, 461), (65, 467), (49, 468), (38, 458), (26, 455), (16, 444)]),
            ),
            'R': dict(
                shoulder=(368, 362), elbow=(396, 448), wrist=(413, 512), hand_tip=(418, 640),
                lower=[(366, 456), (396, 460), (428, 448), (446, 470), (450, 506), (468, 560), (470, 600), (462, 640), (440, 654), (420, 660), (398, 655), (385, 620), (380, 560), (384, 524), (372, 482)],
                seeds=[(398, 482), (420, 492), (388, 470), (420, 540), (410, 600), (440, 610), (430, 570), (395, 620)],
                fore_seeds=[(398, 482), (420, 492), (388, 470), (405, 500), (430, 500)],
                fore_poly=[(366, 456), (396, 460), (428, 448), (446, 470), (448, 518), (394, 526), (372, 482)],
                sleeve=[(360, 452), (360, 418), (420, 398), (436, 420), (432, 452), (396, 456)],
                elbow_cap=26, wrist_cap=32,
            ),
        },
        # the cape behind the right forearm: its bottom edge from where it
        # disappears behind the arm to where it comes out
        cape=dict(left=(372, 508), right=(448, 478), zone=[(360, 420), (452, 420), (452, 530), (360, 530)]),
    ),
    'fg': dict(
        arms={
            'L': dict(
                shoulder=(198, 448), elbow=(172, 490), wrist=(128, 542), hand_tip=(70, 610),
                lower=[(4, 560), (100, 520), (140, 486), (155, 482), (170, 492), (186, 506), (178, 520), (170, 560), (165, 600), (130, 660), (90, 690), (4, 690)],
                seeds=[(150, 515), (140, 528), (165, 500), (120, 560), (100, 600), (60, 615), (130, 600), (145, 565), (85, 575), (40, 625)],
                # forearm fur runs straight into the hand: split at the wrist line
                sleeve=[(140, 470), (150, 446), (194, 440), (200, 508), (176, 512), (156, 500)],
                elbow_cap=22, wrist_cap=26,
                # the light spill off the lens is loose halftone dots: taken by area
                extra=[(4, 590), (60, 600), (90, 640), (80, 680), (4, 690)],
                # 2026-10-23 (user): no more beam out of a raised torch — the
                # lens itself lights up, with short comic rays off its face
                light=dict(kind='lens', at=(65, 619), toward=(-0.82, 0.58)),
                # the torch's butt pokes out above the fist, on the forearm's
                # side of the wrist line: it belongs to the torch (2026-10-23,
                # it hung off the wrist as a red chip whenever the hand turned).
                # Its own piece on the hand, drawn over the forearm, which is
                # furred where it was
                hand_extra=[(133, 527), (150, 520), (166, 529), (168, 550), (160, 563), (143, 564), (133, 551)],
                fur_elbow=True,
            ),
            # the free hand, 2026-10-23: its fingers rest on the tail's top
            # edge, so it is flooded off rather than taken by outline
            'R': dict(
                shoulder=(372, 420), elbow=(388, 500), wrist=(402, 572), hand_tip=(405, 645),
                lower=[(372, 500), (396, 494), (414, 508), (424, 540), (440, 575), (448, 610), (444, 640), (432, 662), (400, 664), (372, 650), (366, 620), (372, 592), (382, 560), (376, 530)],
                flood_seeds=[(395, 530), (405, 560), (410, 590), (392, 600), (420, 610), (402, 628), (425, 630), (388, 515)],
                body_seeds=[(280, 600), (500, 620), (470, 690), (360, 470)],
                sleeve=[(345, 470), (395, 452), (418, 470), (422, 514), (380, 522), (350, 506)],
                elbow_cap=26, wrist_cap=22,
                # raised (cheer, control), the elbow cap turned the cuff's
                # check out below the sleeve: fur it, like the wrist caps
                fur_elbow=True,
                # the forearm's outline left a hairline of ink down from the
                # cuff on the body cel and the sleeve
                erase=[(369, 523), (386, 523), (386, 550), (369, 550)],
            ),
        },
        # the pot's aerial (its red ball): a bulb that lights and comic radio
        # waves off it, on the mesh's antenna bone (2026-10-23, user: when
        # he scores, the pot signals)
        aerial_signal=dict(at=(251, 70), r=13),
        reink=[[(340, 560), (460, 560), (460, 700), (340, 700)], [(330, 480), (380, 480), (380, 600), (330, 600)],
               # the right cuff's lip, cut where the forearm left it: shows
               # once the forearm swings up (2026-10-23)
               [(380, 500), (425, 500), (425, 545), (380, 545)]],
    ),
}


def load(p):
    return np.asarray(Image.open(p).convert('RGBA'), float)


def poly_mask(poly):
    m = Image.new('L', (W, H), 0)
    ImageDraw.Draw(m).polygon(poly, fill=255)
    return np.asarray(m) > 0


def disc(c, r):
    yy, xx = np.mgrid[0:H, 0:W]
    return (xx - c[0]) ** 2 + (yy - c[1]) ** 2 <= r * r


def dilate(m, r):
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(2 * r + 1))) > 0


def erode(m, r):
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(2 * r + 1))) > 0


def flood(allowed, seeds):
    out = np.zeros_like(allowed)
    stack = [(y, x) for x, y in seeds if allowed[y, x]]
    while stack:
        y, x = stack.pop()
        if out[y, x] or not allowed[y, x]:
            continue
        x0 = x
        while x0 > 0 and allowed[y, x0 - 1] and not out[y, x0 - 1]:
            x0 -= 1
        x1 = x
        while x1 < W - 1 and allowed[y, x1 + 1] and not out[y, x1 + 1]:
            x1 += 1
        out[y, x0:x1 + 1] = True
        for yy in (y - 1, y + 1):
            if 0 <= yy < H:
                row = allowed[yy, x0:x1 + 1] & ~out[yy, x0:x1 + 1]
                for i in np.flatnonzero(row):
                    stack.append((yy, x0 + i))
    return out


def past(j, a, b):
    """the half-plane past joint j, perpendicular to a->b (True on b's side)"""
    yy, xx = np.mgrid[0:H, 0:W]
    return (xx - j[0]) * (b[0] - a[0]) + (yy - j[1]) * (b[1] - a[1]) >= 0


def ang(a, b):
    """world angle of a->b in Spine's frame (y up), degrees"""
    return math.degrees(math.atan2(-(b[1] - a[1]), b[0] - a[0]))


def fill_holes(m):
    return ~flood(~m, [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1)])


def main(cast):
    BEAM_POLY.clear()
    cfg = CASTS[cast]
    folder = SRC / cast
    out = folder / 'arms'
    for d in ('parts', 'cels'):
        (out / d).mkdir(parents=True, exist_ok=True)
    N = load(folder / 'normalized.png')
    A = N[..., 3] > 8
    # the ink is near black; the darkest fur is a deep brown (max channel ~60)
    ink = N[..., :3].max(-1) < 48

    gone = np.zeros((H, W), bool)
    pieces, bones, order = {}, [], []

    for side, a in cfg['arms'].items():
        S, E, Wr, T = a['shoulder'], a['elbow'], a['wrist'], a['hand_tip']
        # the arm is everything of the drawing inside its outline: the outlines
        # follow the gaps to the body (the fur is too dark to flood reliably)
        lower = poly_mask(a['lower']) & A
        if 'flood_seeds' in a:
            # where the arm touches something drawn in the same fur (the
            # kid's right fingers on his tail), the outline alone would take
            # some of it: flood the arm's paint inside the outline instead,
            # with its own ink rim
            inkF = N[..., :3].max(-1) < 60
            paint = flood(lower & ~inkF, a['flood_seeds'])
            inside = lower
            lower = paint | (dilate(paint, 5) & lower & inkF)
            # specks of the arm's outline the rim missed: whatever is left
            # inside the outline that no longer joins the body or the tail
            kept = flood(A & ~lower, a['body_seeds'])
            lower |= inside & A & ~kept
        if 'extra' in a:
            lower |= poly_mask(a['extra']) & A
        lower = fill_holes(lower) & A
        if 'hand_extra' in a:
            hx = poly_mask(a['hand_extra']) & lower
        else:
            hx = np.zeros((H, W), bool)
        if 'fore_seeds' in a:
            fp = flood(poly_mask(a['fore_poly']) & ~ink & lower, a['fore_seeds'])
            fore = fp | (dilate(fp, 5) & lower & ink & poly_mask(a['fore_poly']))
            hand = lower & ~fore
        else:
            beyond = past(Wr, E, Wr)
            fore = lower & ~beyond & ~hx
            hand = lower & beyond
        # the upper arm's end, copied off the mesh (it stays there too)
        upper = A & ~lower
        if 'erase' in a:
            stray = poly_mask(a['erase']) & upper & (N[..., :3].max(-1) < 90)
            gone |= stray
            upper &= ~stray
        sleeve = poly_mask(a['sleeve']) & upper
        # caps: the forearm reaches up under the sleeve, the hand into the cuff
        fore_c = fore | (A & disc(E, a['elbow_cap']) & ~hand & (sleeve | fore))
        # the hand's cap: a disc into the cuff, painted in the hand's own fur
        # (not the cuff's metal or check) and inked round its edge, so if a
        # turn shows any of it, it reads as the wrist (seam check, 10-23)
        hand_cap = disc(Wr, a['wrist_cap']) & (fore | hand) & ~hand
        hand_c = hand | hand_cap
        gone |= lower

        def finish(m, top_edges=(), ink_edges=()):
            """smooth the silhouette, feather edges laid over something drawn
            the same (top_edges), ink the edges that are the piece's own
            outline now (ink_edges)"""
            m = erode(dilate(m, 1), 1) & A
            m = fill_holes(m)
            img = N.copy()
            al = m.astype(float)
            ring = dilate(m, 1) & ~m & A
            for e in top_edges:
                edge = ring & dilate(e, 1)
                near = np.zeros(m.shape)
                for k in range(1, 7):
                    near = np.where((near == 0) & dilate(edge, k) & m, k, near)
                al = np.where(near > 0, np.clip((near - 0.5) / 6, 0.05, 1), al)
            for e in ink_edges:
                band = m & dilate(ring & dilate(e, 1), 2)
                img[band, :3] = INK
                al = np.where(band, 1.0, al)
            img[..., 3] = N[..., 3] * al
            return img

        # the sleeve sits on the mesh's identical pixels: feather all of it
        # but its bottom (the seam, already inked in the drawing)
        # (with a furred elbow the forearm swings clear of the cuff, so the
        # cuff's own edge where the forearm left it gets inked too)
        pieces[f'sleeve{side}'] = finish(sleeve, top_edges=[upper & ~sleeve], ink_edges=[lower] if a.get('fur_elbow') else [])
        # the forearm's cap shows only as the outline of a bent elbow: ink it
        # where it leaves the sleeve's silhouette; the hand's likewise
        if hx.any():
            # the forearm under the butt: the forearm's own fur
            fore_c = fore_c | hx
        if a.get('fur_elbow'):
            # a round elbow in the forearm's own fur, inked round its rim:
            # wherever a turn shows it below the sleeve it reads as the bend
            fore_c = fore | hx | (A & disc(E, a['elbow_cap']) & ~hand) | (disc(E, a['elbow_cap'] - 3) & ~hand)
            pieces[f'fore{side}x'] = paint_cap(finish(fore_c), fore & ~ink & ~disc(E, a['elbow_cap'] + 4) & ~dilate(hx, 2), fore_c & ~fore)
        else:
            pieces[f'fore{side}x'] = finish(fore_c, ink_edges=[upper & ~sleeve & ~disc(E, a['elbow_cap'] + 2)])
        aer = None
        if 'aerial' in a:
            aer = poly_mask(a['aerial']['poly']) & hand_c & A
            hand_c = hand_c & ~aer
            # its foot reaches down into the remote (hidden under the box)
            foot = disc(a['aerial']['base'], 6) & A & hand
            aer = aer | foot
        pieces[f'hand{side}'] = paint_cap(finish(hand_c), hand & ~ink, hand_cap)
        bones += [
            dict(name=f'sleeve{side}', parent=f'arm{side}', at=E, angle=ang(S, E), length=12),
            dict(name=f'fore{side}x', parent=f'arm{side}', at=E, angle=ang(E, Wr), length=round(math.dist(E, Wr), 2)),
            dict(name=f'hand{side}', parent=f'fore{side}x', at=Wr, angle=ang(Wr, T), length=round(math.dist(Wr, T), 2)),
        ]
        order += [f'hand{side}', f'fore{side}x', f'sleeve{side}']
        if hx.any():
            pieces[f'butt{side}'] = finish(hx)
            bones.append(dict(name=f'butt{side}', parent=f'hand{side}', at=Wr, angle=ang(Wr, T), length=10))
            order.insert(order.index(f'fore{side}x') + 1, f'butt{side}')
        if 'light' in a:
            lt = a['light']
            name = f'light{side}'
            if lt['kind'] == 'button':
                pieces[name] = glow_disc(lt['at'], lt['r'])
            elif lt['kind'] == 'lens':
                pieces[name] = lens_glow(lt['at'], lt['toward'])
            else:
                pieces[name] = beam(lt['at'], lt['toward'])
            bones.append(dict(name=name, parent=f'hand{side}', at=lt['at'], angle=0, length=10))
            # the button lights on top of the remote; the beam comes out from
            # behind the torch's rim
            order.insert(order.index(f'hand{side}') + (0 if lt['kind'] == 'beam' else 1), name)
        if aer is not None:
            ad = a['aerial']
            name = f'aerial{side}'
            pieces[name] = finish(aer)
            bones.append(dict(name=name, parent=f'hand{side}', at=ad['base'], angle=ang(ad['base'], ad['tip']), length=round(math.dist(ad['base'], ad['tip']), 2)))
            order.insert(order.index(f'hand{side}'), name)  # behind the remote
        if 'signal' in a:
            # radio waves off the remote's aerial: on while he flies the saucer
            name = f'signal{side}'
            pieces[name] = signal(a['signal'])
            bones.append(dict(name=name, parent=f'aerial{side}' if aer is not None else f'hand{side}', at=a['signal'], angle=0, length=10))
            order.insert(order.index(f'light{side}') + 1, name)

    if 'aerial_signal' in cfg:
        at, r = cfg['aerial_signal']['at'], cfg['aerial_signal']['r']
        pieces['lightA'] = bulb_burst(at, r)
        pieces['signalA'] = waves(at)
        # signalA's bone is what its rings pulse with (scale), so it sits on
        # the ball's centre
        bones += [dict(name='lightA', parent='antenna', at=at, angle=0, length=10),
                  dict(name='signalA', parent='antenna', at=at, angle=0, length=10)]
        order += ['lightA', 'signalA']

    # the arms come off every cel; what they hid is painted
    cape = cfg.get('cape')
    cape_fill = paint_cape(N, gone, cape) if cape else None
    # where a cut arm touched the drawing (the kid's tail under his fingers),
    # what is left gets an inked edge of its own
    reink = np.zeros((H, W), bool)
    for zone in cfg.get('reink', []):
        reink |= dilate(gone, 2) & ~gone & A & poly_mask(zone)
    boxes, hulls = {}, {}
    for name, img in pieces.items():
        ox = oy = 0
        if isinstance(img, tuple):
            img, ox, oy = img
        al = img[..., 3]
        ys, xs = np.nonzero(al > 3)
        h, w = al.shape
        x0, y0, x1, y1 = max(0, xs.min() - 2), max(0, ys.min() - 2), min(w, xs.max() + 3), min(h, ys.max() + 3)
        Image.fromarray(img[y0:y1, x0:x1].round().clip(0, 255).astype(np.uint8)).save(out / 'parts' / f'{name}.png')
        boxes[name] = [int(x0 + ox), int(y0 + oy), int(x1 - x0), int(y1 - y0)]
        hulls[name] = hull([(int(x) + ox, int(y) + oy) for y, x in zip(*np.nonzero(al > 40))])
    for p in sorted((folder / 'registered').glob('*.png')):
        if p.stem == 'laugh_teeth':
            continue  # build_cast_mesh.py composes it from the cut cels
        cel = load(p)
        cel[..., 3] = np.where(gone, 0, cel[..., 3])
        if cape_fill is not None:
            m = cape_fill[..., 3] > 0
            cel[m] = cape_fill[m]
        cel[reink, :3] = INK
        cel[reink, 3] = 255
        Image.fromarray(cel.round().clip(0, 255).astype(np.uint8)).save(out / 'cels' / p.name)
    # the boxes of the pieces in the rig are what build_cast_mesh.py positions by
    meta = {
        '_note': 'design/arms/cut_arms.py, 2026-10-23: forearms, hands and props as pieces on the mesh\'s own arm bones.',
        'joints': {f'{k}{s}': v for s, a in cfg['arms'].items() for k, v in a.items() if k in ('shoulder', 'elbow', 'wrist', 'hand_tip')},
        'boxes': boxes, 'order': order, 'ik_arms': [],
        # each piece's inked outline (convex), for check_reach.mjs
        'hulls': hulls,
        'rig': {'bones': bones},
        'lights': [n for n in order if n.startswith(('light', 'signal'))],
        # the lit beam's outline on the canvas, for check_reach.mjs
        **({'beam': BEAM_POLY} if BEAM_POLY else {}),
    }
    (out / 'cut.json').write_text(json.dumps(meta, indent=1))
    print(cast, 'pieces', {k: v for k, v in boxes.items()})


def _ss(draw_fn, size=(W, H), S=4):
    """draw supersampled with PIL on a layer of `size`, return RGBA float"""
    big = Image.new('RGBA', (size[0] * S, size[1] * S), (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(big), S)
    return np.asarray(big.resize(size, Image.LANCZOS), float)


INK_T = tuple(int(v) for v in INK)


def paint_cap(img, src, cap):
    """fill `cap` with the colour of the nearest `src` pixel (grown outward a
    pixel at a time), then ink its outer rim"""
    out = img.copy()
    rgb = out[..., :3]
    have = src.copy()
    todo = cap & ~have
    for _ in range(60):
        if not todo.any():
            break
        acc = np.zeros_like(rgb)
        n = np.zeros(have.shape)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
            sh = np.roll(np.roll(have, dy, 0), dx, 1)
            acc += np.roll(np.roll(rgb, dy, 0), dx, 1) * sh[..., None]
            n += sh
        grow = todo & (n > 0)
        rgb[grow] = acc[grow] / n[grow, None]
        have |= grow
        todo &= ~grow
    out[cap, 3] = 255
    # the rim: cap pixels at the edge of the whole piece
    piece = out[..., 3] > 40
    rim = cap & dilate(~piece, 2)
    out[rim, :3] = INK
    out[rim, 3] = 255
    return out


def hull(pts):
    """convex hull (monotone chain) of integer points"""
    pts = sorted(set(pts))
    if len(pts) < 3:
        return pts

    def half(ps):
        h = []
        for p in ps:
            while len(h) >= 2 and (h[-1][0] - h[-2][0]) * (p[1] - h[-2][1]) - (h[-1][1] - h[-2][1]) * (p[0] - h[-2][0]) <= 0:
                h.pop()
            h.append(p)
        return h
    lo, hi = half(pts), half(pts[::-1])
    return lo[:-1] + hi[:-1]


def signal(c):
    """three radio arcs off the aerial's ball, up and out, inked like the
    pings round the button"""
    cx, cy = c

    def draw(g, S):
        for r in (17, 27, 37):
            box = [(cx - r) * S, (cy - r) * S, (cx + r) * S, (cy + r) * S]
            g.arc(box, 205, 300, fill=INK_T + (255,), width=int(6.5 * S))
            g.arc(box, 207, 298, fill=(255, 226, 92, 255), width=int(3 * S))
    return _ss(draw)


def waves(c):
    """comic radio waves off the pot's aerial: three inked arcs either side
    of the ball"""
    cx, cy = c

    def draw(g, S):
        # 2026-10-23 (user): it is the score's own effect, so it shouts —
        # four rings, heavy ink, reaching well past the pot
        for r in (32, 54, 76, 98):
            box = [(cx - r) * S, (cy - r) * S, (cx + r) * S, (cy + r) * S]
            span = 40 - r * 0.08
            for a0, a1 in ((180 - span, 180 + span), (-span, span)):
                g.arc(box, a0, a1, fill=INK_T + (255,), width=int(12 * S))
                g.arc(box, a0 + 2.5, a1 - 2.5, fill=(255, 226, 92, 255), width=int(6 * S))
    return _ss(draw)


def lens_glow(c, u):
    """the torch lens lit: its face burnt to white-hot over the drawn glass
    and a fan of short inked rays off it (printed, not additive: the cast's
    hard shadow would drag a dark halo off a soft glow)"""
    cx, cy = c
    n = math.hypot(*u)
    ux, uy = u[0] / n, u[1] / n
    # the face is an ellipse across the torch: long axis perpendicular to it
    vx, vy = -uy, ux

    def ell(a, b):
        return [(cx + vx * a * math.cos(t) + ux * b * math.sin(t), cy + vy * a * math.cos(t) + uy * b * math.sin(t))
                for t in [i * math.pi / 24 for i in range(48)]]

    def draw(g, S):
        for i in range(5):
            ang = math.radians(-44 + i * 22)
            dx, dy = ux * math.cos(ang) - uy * math.sin(ang), ux * math.sin(ang) + uy * math.cos(ang)
            r0, r1 = 31, 31 + (22 if i % 2 == 0 else 15)
            p0 = ((cx + dx * r0) * S, (cy + dy * r0) * S)
            p1 = ((cx + dx * r1) * S, (cy + dy * r1) * S)
            g.line([p0, p1], fill=INK_T + (255,), width=int(6.5 * S))
            g.line([p0, p1], fill=(255, 226, 92, 255), width=int(3 * S))
        g.polygon([(x * S, y * S) for x, y in ell(25, 17)], fill=(255, 238, 170, 255))
        g.polygon([(x * S, y * S) for x, y in ell(18, 12)], fill=(255, 251, 226, 255))
        g.polygon([((x - 5) * S, (y - 5) * S) for x, y in ell(7, 5)], fill=(255, 255, 255, 255))
    return _ss(draw)


def bulb_burst(c, r):
    """the pot's bulb lit for a score: a jagged comic flash round it, then the
    ball burning hot"""
    cx, cy = c

    def draw(g, S):
        pts = []
        for i in range(24):
            a = math.radians(i * 15 + 7)
            rr = (r + 22 + (6 if i % 4 == 0 else 0)) if i % 2 == 0 else r + 9
            pts.append(((cx + rr * math.cos(a)) * S, (cy + rr * math.sin(a)) * S))
        g.polygon(pts, fill=(255, 226, 92, 255), outline=INK_T + (255,), width=int(5 * S))
        g.ellipse([(cx - r) * S, (cy - r) * S, (cx + r) * S, (cy + r) * S], fill=(255, 92, 54, 255), outline=INK_T + (255,), width=int(3 * S))
        k = r * 0.62
        g.ellipse([(cx - k) * S, (cy - k) * S, (cx + k) * S, (cy + k) * S], fill=(255, 214, 120, 255))
        k = r * 0.3
        g.ellipse([(cx - k - 2) * S, (cy - k - 3) * S, (cx + k - 2) * S, (cy + k - 3) * S], fill=(255, 252, 236, 255))
    return _ss(draw)


def glow_disc(c, r, pings=True):
    """the remote's button lit, printed like everything else (the cast has a
    hard ink shadow, so a soft additive glow would drag a dark halo): a hot
    yellow core in the red button and six short 'ping' strokes round it"""
    cx, cy = c

    def draw(g, S):
        for i in range(6 if pings else 0):
            a = math.radians(-100 + i * 60)
            r0, r1 = (r + 7) * S, (r + 19) * S
            p0 = (cx * S + r0 * math.cos(a), cy * S + r0 * math.sin(a))
            p1 = (cx * S + r1 * math.cos(a), cy * S + r1 * math.sin(a))
            g.line([p0, p1], fill=INK_T + (255,), width=int(6.5 * S))
            g.line([p0, p1], fill=(255, 226, 92, 255), width=int(3 * S))
        g.ellipse([(cx - r) * S, (cy - r) * S, (cx + r) * S, (cy + r) * S], fill=(255, 92, 54, 255))
        k = r * 0.62
        g.ellipse([(cx - k) * S, (cy - k) * S, (cx + k) * S, (cy + k) * S], fill=(255, 214, 120, 255))
        k = r * 0.3
        g.ellipse([(cx - k - 2) * S, (cy - k - 3) * S, (cx + k - 2) * S, (cy + k - 3) * S], fill=(255, 252, 236, 255))
    return _ss(draw)


BEAM_POLY = []


def beam(c, u):
    """the torch's beam as a comic draws it: a flat pale wedge with an inked
    edge, its far end dissolving in halftone dots"""
    cx, cy = c
    n = math.hypot(*u)
    ux, uy = u[0] / n, u[1] / n
    vx, vy = -uy, ux
    L, w0, w1 = 190, 26, 26 + 190 * math.tan(math.radians(12))
    pts = [(cx + vx * w0, cy + vy * w0), (cx + ux * L + vx * w1, cy + uy * L + vy * w1),
           (cx + ux * L - vx * w1, cy + uy * L - vy * w1), (cx - vx * w0, cy - vy * w0)]

    # its own layer: the beam reaches past the drawing's left edge
    ox = int(math.floor(min(x for x, _ in pts))) - 4
    oy = int(math.floor(min(y for _, y in pts))) - 4
    size = (int(math.ceil(max(x for x, _ in pts))) + 4 - ox, int(math.ceil(max(y for _, y in pts))) + 4 - oy)
    lx, ly = cx - ox, cy - oy

    def draw(g, S):
        P = [((x - ox) * S, (y - oy) * S) for x, y in pts]
        g.polygon(P, fill=(255, 243, 178, 255))
        core = [(cx + vx * w0 * 0.45, cy + vy * w0 * 0.45), (cx + ux * L + vx * w1 * 0.4, cy + uy * L + vy * w1 * 0.4),
                (cx + ux * L - vx * w1 * 0.4, cy + uy * L - vy * w1 * 0.4), (cx - vx * w0 * 0.45, cy - vy * w0 * 0.45)]
        g.polygon([((x - ox) * S, (y - oy) * S) for x, y in core], fill=(255, 252, 228, 255))
        g.line([P[0], P[1]], fill=INK_T + (255,), width=int(3 * S))
        g.line([P[3], P[2]], fill=INK_T + (255,), width=int(3 * S))
    img = _ss(draw, size)
    # the far end goes to halftone: a dot screen whose dots shrink to nothing
    yy, xx = np.mgrid[0:size[1], 0:size[0]]
    along = (xx - lx) * ux + (yy - ly) * uy
    across = -(xx - lx) * uy + (yy - ly) * ux
    fade = np.clip((L - along) / (L * 0.45), 0, 1)
    period = 6.0
    gx = (along / period) % 1 - 0.5
    gy = (across / period + 0.5 * np.floor(along / period)) % 1 - 0.5
    dot = np.hypot(gx, gy) < 0.62 * np.sqrt(fade)
    keep = np.where(fade >= 1, 1.0, dot.astype(float))
    img[..., 3] *= keep * (along > 0)
    BEAM_POLY[:] = [(round(x, 1), round(y, 1)) for x, y in pts]
    return img, ox, oy


def paint_cape(N, gone, cape):
    """continue the cape behind the right forearm: its paint borrowed across
    the hole row by row (so its halftone carries on), an inked bottom edge
    between where it goes behind the arm and where it comes out"""
    out = np.zeros((H, W, 4))
    zone = poly_mask(cape['zone'])
    (lx, ly), (rx, ry) = cape['left'], cape['right']
    yy, xx = np.mgrid[0:H, 0:W]
    u = np.clip((xx - lx) / (rx - lx), 0, 1)
    # a sagging curve rather than a straight cut
    edge = ly + (ry - ly) * u + 6 * np.sin(math.pi * u)
    red = (N[..., 0] > 150) & (N[..., 1] < 120) & (N[..., 3] > 200)
    dark = (N[..., 0] > 60) & (N[..., 0] > N[..., 1] + 30) & (N[..., 2] < 110) & ~gone
    cloth = (red | dark) & ~gone & zone
    hole = gone & zone & (yy < edge + 3)
    for y in np.flatnonzero(hole.any(1)):
        xs = np.flatnonzero(hole[y])
        src = np.flatnonzero(cloth[y])
        if not len(src):
            continue
        for x in xs:
            # the nearest cloth in this row, stepped back 8px at a time so
            # the halftone's period is kept
            i = np.argmin(np.abs(src - x))
            sx = src[i]
            k = math.ceil(abs(x - sx) / 8) * 8
            cand = x - k if sx < x else x + k
            if 0 <= cand < W and cloth[y, cand]:
                out[y, x] = N[y, cand]
            else:
                out[y, x] = N[y, sx]
            out[y, x, 3] = 255
    band = hole & (np.abs(yy - edge) < 2.6)
    out[band, :3] = INK
    out[band, 3] = 255
    return out


if __name__ == '__main__':
    for c in sys.argv[1:] or ['mg', 'fg']:
        main(c)
