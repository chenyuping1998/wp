# -*- coding: utf-8 -*-
"""
Look at a single flat character image and say whether it can be animated, what
can move, and what cannot -- before any time is spent rigging it.

    python rig/inspect_art.py character.png

Writes a report to stdout and an annotated overlay next to the image so you can
see what it found.

The question it is really answering is "does this POSE work". A figure can be
beautifully drawn and still be un-riggable, and the giveaways are measurable:

* **Are the arms clear of the body?** Measured by counting separate horizontal
  runs of silhouette at each height. Three runs means arm / torso / arm with
  daylight between them, and the arms can be cut into their own layers. One run
  means they are against the body -- or in pockets -- and cutting them means
  reconstructing the torso behind them. That single number decided the whole
  approach on the Hot Miami guy.
* **Is anything hanging free?** A pony tail, a cloth tail, a held object. These
  are the cheap wins: nothing sits behind them, so they need no repair and can
  swing as hard as you like. The reference character's biggest-amplitude
  movement by far is his mask tail at +/-6.7 deg.
* **Is it upright and planted?** The chain runs bottom to top. A figure that is
  leaning, seated, or cropped at the knees needs the bones placed by hand.
* **Is there hard-edged detail sitting on a joint?** The mesh shears hardest at
  the neck, the waist and the elbow. A seam, a zip, a stripe or a check pattern
  crossing one of those lines gets visibly bent. Measured as local edge density
  against the figure's own average.
* **Is there room around the figure?** The reference reaction stretches an arm
  to 1.23x and swings a prop tip 70 units clear of the body. A figure drawn hard
  against the canvas edge has nowhere to do that.

Nothing here blocks you: it prints what will be easy, what will be work, and
what will need new art.

The thresholds come from measuring Hacksaw's Miami Mayhem rig; the numbers and
where they came from are in the bundled `reference/character-reactions.md`
section 10. The short version of what that rig demands of the art:

    one torso image, two arm images, one head, props separate.
    77-90% of mesh vertices bind to 2+ bones, so the art must NOT arrive
    pre-cut at the joints. The elbow, the waist and the knee are never cut --
    they bend inside the image.
"""
from __future__ import print_function
import os
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageDraw


# --------------------------------------------------------------------------

def runs(row):
    """[(start, end)] of each contiguous True run"""
    xs = np.where(row)[0]
    if not len(xs):
        return []
    out, st, pv = [], xs[0], xs[0]
    for x in xs[1:]:
        if x > pv + 1:
            out.append((st, pv))
            st = x
        pv = x
    out.append((st, pv))
    return out


def components(mask, min_px=1):
    H, W = mask.shape
    lab = np.zeros((H, W), np.int32)
    cur, out = 0, []
    ys, xs = np.where(mask)
    for y0, x0 in zip(ys, xs):
        if lab[y0, x0]:
            continue
        cur += 1
        q = deque([(y0, x0)])
        lab[y0, x0] = cur
        n = 0
        while q:
            cy, cx = q.popleft()
            n += 1
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not lab[ny, nx]:
                        lab[ny, nx] = cur
                        q.append((ny, nx))
        if n >= min_px:
            out.append((n, lab == cur))
    out.sort(key=lambda t: -t[0])
    return out


def erode(m, r):
    out = m.copy()
    for _ in range(r):
        p = np.pad(out, 1, constant_values=False)
        out = (p[1:-1, 1:-1] & p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:])
    return out


def dilate(m, r):
    out = m.copy()
    for _ in range(r):
        p = np.pad(out, 1, constant_values=False)
        out = (p[1:-1, 1:-1] | p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:])
    return out


# --------------------------------------------------------------------------

class Report(object):
    def __init__(self):
        self.lines, self.blockers, self.warnings = [], [], []

    def say(self, s=''):
        self.lines.append(s)

    def block(self, s):
        self.blockers.append(s)

    def warn(self, s):
        self.warnings.append(s)

    def dump(self):
        print('\n'.join(self.lines))
        if self.blockers:
            print('\nSTOP -- fix these first')
            for b in self.blockers:
                print('  * ' + b)
        if self.warnings:
            print('\nWorth knowing')
            for w in self.warnings:
                print('  * ' + w)
        print('\nVERDICT: ' + ('not usable as-is' if self.blockers else 'usable'))
        return 1 if self.blockers else 0


def inspect(path, overlay=True):
    r = Report()
    im = Image.open(path)
    r.say('%s   %dx%d   mode=%s' % (os.path.basename(path), im.width, im.height, im.mode))

    # ---------------------------------------------------------------- alpha
    if im.mode != 'RGBA':
        im = im.convert('RGBA')
    A = np.asarray(im).astype(int)
    a = A[..., 3]
    if (a > 8).mean() > 0.985:
        corner = tuple(A[0, 0, :3])
        key = np.abs(A[..., :3] - np.array(corner)).max(2) < 40
        if key.mean() > 0.15:
            r.block('no transparency -- the background is a flat colour #%02X%02X%02X '
                    '(%.0f%% of the image). Key it out and re-save as RGBA. '
                    'Chroma-keying anti-aliased art fringes, so ask for a transparent '
                    'PNG rather than keying it afterwards.' % (corner + (100 * key.mean(),)))
        else:
            r.block('no transparency and no flat background to key -- '
                    'the figure has to be cut out first.')
        return r

    mask = a > 8
    cs = components(mask)
    if not cs:
        r.block('the image is empty')
        return r
    main = cs[0][1]
    specks = sum(n for n, _ in cs[1:])
    if len(cs) > 1:
        big = [n for n, _ in cs[1:] if n > 400]
        if big:
            r.warn('%d detached piece(s) of %s px -- if those are parts of the '
                   'character (a held object, a loose strand) they will not follow '
                   'the body; if they are dirt, clean them.'
                   % (len(big), '/'.join(str(b) for b in big)))
        if specks - sum(big) > 0:
            r.say('  %d px of small detached speck, ignored' % (specks - sum(big)))

    ys, xs = np.where(main)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    FW, FH = x1 - x0, y1 - y0
    r.say('figure       %d x %d px, %.0f%% of the canvas, ink %.1f%%'
          % (FW, FH, 100.0 * FW * FH / (im.width * im.height), 100.0 * main.mean()))

    # ---------------------------------------------------------------- size
    if FH < 300:
        r.warn('only %d px tall. The mesh deforms by sub-pixel amounts at idle '
               'amplitudes, so under ~300 px the motion starts to alias. Draw '
               'bigger and downscale.' % FH)

    # ------------------------------------------------------------- upright
    pts = np.stack([xs.astype(float), ys.astype(float)], 1)
    pts -= pts.mean(0)
    cov = pts.T @ pts / len(pts)
    ev, evec = np.linalg.eigh(cov)
    axis = evec[:, np.argmax(ev)]
    tilt = abs(np.degrees(np.arctan2(axis[0], axis[1])))
    tilt = min(tilt, 180 - tilt)
    r.say('upright      main axis %.1f deg off vertical, aspect %.2f (h/w)'
          % (tilt, float(FH) / FW))
    if tilt > 20:
        r.warn('leaning %.0f deg. The auto chain runs straight up the silhouette '
               'centre, which will cut across a leaning figure. Place the bones '
               'by hand (edit bones[] in the rig json).' % tilt)

    # -------------------------------------------------------- limb clearance
    hs = np.linspace(y0, y1 - 1, 60).astype(int)
    prof = [len(runs(main[y])) for y in hs]
    three = [h for h, p in zip(hs, prof) if p >= 3]
    r.say('limbs        %d of 60 sampled heights show 3+ separate runs'
          % len(three))
    if len(three) >= 6:
        lo, hi = min(three), max(three)
        r.say('             arms read as CLEAR of the body, y %d..%d '
              '(%.0f%%..%.0f%% of height)'
              % (lo, hi, 100.0 * (lo - y0) / FH, 100.0 * (hi - y0) / FH))
        r.say('             -> they can be cut into their own layers')
    else:
        r.say('             arms read as AGAINST the body (or hidden)')
        r.say('             -> cutting them means rebuilding the torso behind them.')
        r.say('                Check first whether the art already has a finished')
        r.say('                outline under the arm: if it does the cut is free,')
        r.say('                and if it does not you need new art.')
        r.say('             for scale: Hot Miami guy (hands in pockets) 0/60,')
        r.say('                girl (arms at her sides) 2/60. Both are rigs that')
        r.say('                can only do body sway and head.')

    # An arm image in the reference runs shoulder-to-fingertip in one piece --
    # 659 px on a 1066 px figure, 62% of height. A short clear band means the
    # arm only separates for part of its length, so the bones stop early.
    if len(three) >= 6:
        span = 100.0 * (max(three) - min(three)) / FH
        r.say('             clear band spans %.0f%% of figure height '
              '(reference arm image: 62%%)' % span)
        if span < 25:
            r.warn('the arms are only clear over %.0f%% of the height. They can '
                   'be given bones, but only the part that separates will move '
                   '-- the rest stays welded to the torso.' % span)

    # ---------------------------------------------------- protruding parts
    # An opening at ~13% of the torso width separates whatever is thinner than
    # the trunk. On a human that is arms, legs and anything held or hanging,
    # so the pieces are classified by where they sit rather than assumed to be
    # appendages -- the useful one is anything reaching outside the torso's own
    # horizontal envelope, because that is the piece with nothing behind it.
    midrows = range(y0 + int(FH * .35), y0 + int(FH * .65), 3)
    widths = [len(np.where(main[y])[0]) for y in midrows]
    torso = int(np.median(widths)) if widths else FW
    cxs = []
    for y in midrows:
        rr = runs(main[y])
        if rr:
            cxs.append((rr[0][0] + rr[-1][1]) / 2.0)
    torso_cx = float(np.median(cxs)) if cxs else (x0 + x1) / 2.0
    rad = max(4, int(torso * .13))
    stick = main & ~dilate(erode(main, rad), rad)
    cand = [(n, m) for n, m in components(stick) if n > FW * FH * 0.004]
    r.say('protrusions  opening at r=%d (13%% of a %d px torso) separates %d piece(s)'
          % (rad, torso, len(cand)))
    free = []
    for n, m in cand[:8]:
        cy, cx = np.where(m)
        fy = (cy.mean() - y0) / FH
        out_of_torso = max(torso_cx - cx.min(), cx.max() - torso_cx) / (torso / 2.0)
        if fy > .70:
            what = 'leg / foot'
        elif fy < .18:
            what = 'hair or headwear'
        elif out_of_torso > 1.25:
            what = 'HELD OBJECT or free appendage'
            free.append((n, m))
        else:
            what = 'arm'
        r.say('             %7d px  x %4d..%-4d y %4d..%-4d  %3.0f%% down   %s'
              % (n, cx.min(), cx.max(), cy.min(), cy.max(), 100 * fy, what))
    if free:
        r.say('             -> the free one(s) are the cheapest motion you can add:')
        r.say('                nothing sits behind them, so no repair and no')
        r.say('                amplitude ceiling.')
    else:
        r.warn('nothing reaches clear of the torso. Body sway alone reads as '
               'subtle -- the reference character gets most of its life from a '
               'mask tail at +/-6.7 deg. Consider adding hair, cloth, a chain '
               'or a held object to the art.')

    # ------------------------------------------------- the shear budget
    # The reference fakes a turn on flat art by sliding the front and back of
    # ONE image in opposite directions: transform-constraint mixes of +0.90 and
    # -0.65 off a controller bone, landing about 4% of the image width of
    # internal shear on the torso and 4.7% on the head. That only works if the
    # torso and the head are each a single piece painted edge to edge.
    headrows = range(y0 + int(FH * .02), y0 + int(FH * .15), 2)
    hw = [len(np.where(main[y])[0]) for y in headrows]
    head_w = int(np.median(hw)) if hw else 0
    r.say('shear budget torso %d px wide -> front/back edges slide ~%.0f px apart'
          % (torso, torso * 0.04))
    if head_w:
        r.say('             head  %d px wide -> face/back-of-head slide ~%.0f px apart'
              % (head_w, head_w * 0.047))
    r.say('             so the torso and the head each have to be ONE piece,')
    r.say('             painted right to both edges. Split them into a front and')
    r.say('             a back layer and that slide becomes a visible gap.')

    # ------------------------------------------------- detail on the joints
    # The mesh shears hardest where the bone chain bends. What actually breaks
    # there is not busy texture -- it is a HORIZONTAL feature that runs across
    # the figure: a belt, a waistband, a collar, a hem, a stripe, a seam. The
    # mesh bends it into a curve and the eye reads a snapped joint.
    #
    # So the measure is not edge density (photographic art is full of texture
    # noise and drowns the signal). It is: at this row, does a strong
    # horizontal edge cross most of the silhouette?
    gy = A[..., :3].mean(2)
    dv = np.zeros_like(gy)
    dv[1:] = np.abs(np.diff(gy, axis=0))
    cross = (dv > 40) & main

    widths = np.array([len(np.where(main[y])[0]) for y in range(y0, y1)], float)
    widths[widths == 0] = 1e9

    def dip(lo, hi):
        """row of narrowest silhouette inside a fraction band"""
        a_, b_ = int(FH * lo), int(FH * hi)
        if b_ <= a_:
            return None
        return y0 + a_ + int(np.argmin(widths[a_:b_]))

    joints = [('neck', dip(.10, .30)), ('waist', dip(.35, .68))]
    if len(three) >= 6:
        joints.append(('elbow', int((min(three) + max(three)) / 2)))
    joints.append(('knee', dip(.68, .92)))

    def coverage(row):
        """strongest single row of horizontal edge near `row`, as a fraction
        of the silhouette width there"""
        band = max(3, int(FH * .03))
        best, at = 0.0, row
        for y in range(max(1, row - band), min(im.height, row + band + 1)):
            w = main[y].sum()
            if w < FW * 0.15:
                continue
            f = cross[y].sum() / float(w)
            if f > best:
                best, at = f, y
        return best, at

    r.say('joint detail strongest horizontal edge crossing each joint '
          '(rows found by silhouette pinch, approximate)')
    hot = []
    for name, row in joints:
        if row is None:
            continue
        f, at = coverage(row)
        flag = ''
        if f >= 0.50:
            flag = '   <-- crosses the figure'
            hot.append(name)
        elif f >= 0.30:
            flag = '   <-- worth a look'
        r.say('             %-6s pinch y=%-5d worst row y=%-5d %3.0f%% of width%s'
              % (name, row, at, 100 * f, flag))
    if hot:
        r.warn('a horizontal feature runs right across the %s. The mesh shears '
               'hardest there, so a belt / waistband / collar / hem / stripe on '
               'that line gets bent into a curve and reads as a snapped joint. '
               'Move it a few percent up or down, or soften it.'
               % ' and '.join(hot))

    # ------------------------------------------------------ canvas headroom
    # The reference reaction stretches an arm to 1.23x, squashes a forearm to
    # 0.80, and throws a prop tip 70 units clear. All of that needs empty
    # canvas around the figure -- the renderer pads, but the ART has to have
    # somewhere to go without meeting its own edge.
    pad_l, pad_r = x0, im.width - x1
    pad_t, pad_b = y0, im.height - y1
    r.say('headroom     left %d  right %d  top %d  bottom %d px '
          '(%.0f%% / %.0f%% / %.0f%% / %.0f%% of figure)'
          % (pad_l, pad_r, pad_t, pad_b,
             100.0 * pad_l / FW, 100.0 * pad_r / FW,
             100.0 * pad_t / FH, 100.0 * pad_b / FH))
    tight = [n for n, v, ref in (('left', pad_l, FW), ('right', pad_r, FW),
                                 ('top', pad_t, FH)) if v < ref * 0.04]
    if tight:
        r.warn('almost no margin on the %s. The reaction stretches limbs to '
               '1.23x and swings a prop clear of the body; a figure drawn hard '
               'against the canvas edge has nowhere to do that. Re-export on a '
               'canvas ~10%% larger.' % '/'.join(tight))

    # ---------------------------------------------------------- foot line
    bottom = main[y1 - max(2, FH // 60):y1]
    feet = len(runs(bottom.any(0)))
    r.say('base         %d contact run(s) at the bottom edge' % feet)
    if feet == 0:
        r.warn('the figure touches the bottom of the canvas -- it may be cropped.')

    # ------------------------------------------------------------- style
    rgb = A[..., :3][main]
    colours = len(set(map(tuple, rgb)))
    g = A[..., :3].mean(2)
    edge = ((np.abs(np.diff(g, axis=1)) > 40)[:, :] & main[:, 1:]).sum()
    dens = 100.0 * edge / max(1, main.sum())
    soft = 100.0 * ((a > 0) & (a < 255)).mean()
    r.say('style        %d distinct colours, edge density %.2f%%, soft alpha %.2f%%'
          % (colours, dens, soft))
    if colours < 200:
        r.warn('%d colours means flat vector with no anti-aliasing. It will '
               'stair-step the moment the mesh rotates it, because every '
               'deformed pixel is resampled. Ask for anti-aliased art.' % colours)
    if soft < 1.0:
        r.warn('only %.2f%% of pixels have partial alpha -- the cut-out is a hard '
               'binary edge. The mesh rotates that edge every frame and the '
               'stair-steps crawl. Re-cut with a feathered/anti-aliased alpha '
               '(the bundled example sits at 4.2%%).' % soft)

    # -------------------------------------------------- what it does NOT need
    r.say('')
    r.say('not needed   glow / highlight layers. The reference lights its')
    r.say('             character by drawing the SAME attachment a second time')
    r.say('             with "blend":"additive" and fading alpha 0->1->0. No')
    r.say('             extra art: five lit slots, zero extra images.')

    # ------------------------------------------------------------ overlay
    if overlay:
        ov = im.convert('RGBA').copy()
        d = ImageDraw.Draw(ov)
        d.rectangle([x0, y0, x1, y1], outline=(0, 255, 255, 255), width=2)
        for h in three:
            for s, e in runs(main[h]):
                d.line([(s, h), (e, h)], fill=(255, 220, 0, 255), width=1)
        for n, m in cand[:6]:
            cy, cx = np.where(m)
            d.rectangle([cx.min(), cy.min(), cx.max(), cy.max()],
                        outline=(255, 60, 200, 255), width=2)
        ny = np.linspace(y1 - 1, y0 + FH * 0.04, 6)
        for yy in ny:
            band = main[max(0, int(yy) - 6):int(yy) + 7]
            bx = np.where(band.any(0))[0]
            if len(bx):
                cxx = (bx.min() + bx.max()) / 2
                d.ellipse([cxx - 6, yy - 6, cxx + 6, yy + 6],
                          outline=(255, 40, 40, 255), width=3)
        p = os.path.splitext(path)[0] + '_inspect.png'
        ov.save(p)
        r.say('')
        r.say('overlay      %s' % p)
        r.say('             cyan = figure box, red = proposed bone chain,')
        r.say('             yellow = heights where limbs are clear,')
        r.say('             magenta = free-hanging candidates')
    return r


if __name__ == '__main__':
    import sys as _sys
    for _s in (_sys.stdout, _sys.stderr):  # Windows 的管線預設 cp950，agent 讀到會是亂碼
        if hasattr(_s, 'reconfigure'):
            _s.reconfigure(encoding='utf-8', errors='replace')
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    sys.exit(inspect(sys.argv[1]).dump())
