"""
The Don's three states, derived from ONE drawing.

    python3 design/build_cast_guy_states.py [--report]

ART_BRIEF.md asks for three: base game, free spins, and the Don tier. It also
says how they must differ — 「同一個 rig，只換貼圖與打光」 — and that constraint
is not a style note, it is the only thing that makes three states affordable.

The mesh rig in static/assets/meshRigs/cast_guy/ is bound to the SILHOUETTE of
guy.png: 697 vertices at fixed lattice positions, weighted by where the ink is.
A second drawing of the same man in a slightly different pose would need its own
rig, its own measured joint limits and its own row in check_cast_motion.mjs.
Three drawings means three of everything, forever.

So the other two states are not drawn. They are GRADED from guy.png, and the
grading touches RGB only — the alpha channel is copied through byte for byte.
That is what keeps the guarantee mechanical rather than hopeful: the rig reads
geometry and the gate reads alpha, so if alpha is identical then every number in
check_cast_motion.mjs is identical too, and this script cannot break the cast
motion no matter what it does to the colours. The assertion at the end enforces
it rather than trusting it.

What the states are, per ART_BRIEF.md §1:

    guy.png          base game    the shipped v3 art, untouched
    guy_feature.png  free spins   同一個人，暖光打強
    guy_don.png      Don tier     金色輪廓光

The Don tier's brief also mentions 「背後隱約有金庫門」. That is background, not
character, and it belongs to the scene layer — nothing here paints it.

Palette discipline from ART_BRIEF.md §0 applies: gold is the only high-chroma
colour allowed and 訊號紅 #C1272D is reserved for the Tommy Gun wild alone. The
rim light below uses 金主 #C9A227 into 金亮 #E8D48B and nothing else, and the
report prints the gold coverage so the 15% ceiling stays checkable.
"""
import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RIG_DIR = ROOT / 'static/assets/meshRigs/cast_guy'

GOLD = np.array([0xC9, 0xA2, 0x27], dtype=np.float64) / 255.0
GOLD_BRIGHT = np.array([0xE8, 0xD4, 0x8B], dtype=np.float64) / 255.0


def load(path):
    image = Image.open(path).convert('RGBA')
    data = np.asarray(image).astype(np.float64) / 255.0
    return data[..., :3], np.asarray(image)[..., 3]


def save(rgb, alpha, path):
    out = np.empty(rgb.shape[:2] + (4,), dtype=np.uint8)
    out[..., :3] = np.clip(rgb, 0, 1) * 255.0 + 0.5
    out[..., 3] = alpha
    Image.fromarray(out).save(path, optimize=True)


def erode(mask, radius):
    """Binary erosion by a square, via the integral image — keeps this file free
    of a scipy dependency the rest of design/ does not carry."""
    padded = np.pad(mask.astype(np.float64), radius, mode='constant')
    integral = padded.cumsum(0).cumsum(1)
    integral = np.pad(integral, ((1, 0), (1, 0)), mode='constant')
    size = 2 * radius + 1
    total = (integral[size:, size:] - integral[:-size, size:]
             - integral[size:, :-size] + integral[:-size, :-size])
    return total >= size * size - 0.5


def soft_shoulder(rgb, knee=0.80):
    """Compress highlights instead of clipping them.

    The first version of this raised the key and clipped 12% of the figure —
    and the 12% was the shirt and the silk scarf, i.e. exactly the two things
    the scarf was added to the drawing FOR. A clipped highlight is not a bright
    highlight, it is a flat white shape with its folds deleted, and the scarf
    stops reading as cloth the moment that happens.

    Everything under the knee is untouched, so the suit's shadows keep their
    values; above it the range is rolled off asymptotically toward 1.
    """
    out = rgb.copy()
    high = rgb > knee
    excess = (rgb[high] - knee) / (1.0 - knee)
    out[high] = knee + (1.0 - knee) * (excess / (1.0 + excess))
    return out


def feature_grade(rgb):
    """Free spins: the same room with the lamp turned up.

    A warm gain plus a top-down key, NOT a brightness lift — raising everything
    equally flattens him, and this figure reads by value, not by hue (ART_BRIEF
    §0: 五個高符號靠輪廓剪影分辨, same principle). The shadows are left where
    they are so the contrast opens rather than washing out.
    """
    height = rgb.shape[0]
    key = np.linspace(1.18, 0.94, height)[:, None, None]  # bright at the head, falling to the feet
    warm = np.array([1.06, 1.005, 0.93])                  # toward the scene's amber lamp
    graded = soft_shoulder(rgb * key * warm)
    # Pull the midtones up slightly without touching black, so the suit keeps
    # its depth while the shirt and scarf catch the light.
    return np.clip(graded, 0, 1) ** 0.94


def don_rim(rgb, alpha, width=3, strength=0.85):
    """Don tier: a gold rim along the silhouette.

    The reference's own trick for making a state read without new art is to draw
    the same thing again with additive blending (character-reactions.md §4c).
    This is that, restricted to a band just inside the alpha edge: additive gold
    on the outline only, so it reads as light catching him from behind rather
    than as a recolour of the suit.

    Weighted toward the top, because ART_BRIEF §0 puts the scene's light source
    at 「包廂裡一盞吊燈」 — a rim that is equally bright at the shoes contradicts
    the room.
    """
    solid = alpha > 8
    band = solid & ~erode(solid, width)
    height = rgb.shape[0]
    falloff = np.clip(np.linspace(1.15, 0.25, height), 0, 1)[:, None]
    # gold at the edge, brightening where the light is strongest
    lit = np.clip(falloff, 0, 1)[..., None] * (GOLD[None, None, :] * 0.45 + GOLD_BRIGHT[None, None, :] * 0.55)
    added = np.where(band[..., None], lit * strength * falloff[..., None], 0.0)
    return soft_shoulder(feature_grade(rgb) + added), band


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--report', action='store_true')
    args = parser.parse_args()

    source = RIG_DIR / 'guy.png'
    rgb, alpha = load(source)

    feature = feature_grade(rgb)
    save(feature, alpha, RIG_DIR / 'guy_feature.png')

    don, band = don_rim(rgb, alpha)
    save(don, alpha, RIG_DIR / 'guy_don.png')

    # The guarantee, enforced. If alpha ever drifts, the rig no longer matches
    # the texture and check_cast_motion.mjs is measuring a different figure from
    # the one on screen.
    failures = []
    for name in ('guy_feature.png', 'guy_don.png'):
        written = np.asarray(Image.open(RIG_DIR / name).convert('RGBA'))[..., 3]
        if not np.array_equal(written, alpha):
            failures.append(f'{name}: alpha differs from guy.png in '
                            f'{int((written != alpha).sum())} px')

    if args.report:
        solid = alpha > 8
        for name, data in (('guy_feature.png', feature), ('guy_don.png', don)):
            # how much of the FIGURE is high-chroma gold, against ART_BRIEF's 15% ceiling
            r, g, b = data[..., 0], data[..., 1], data[..., 2]
            goldish = solid & (r > 0.55) & (g > 0.40) & (b < 0.45) & ((r - b) > 0.25)
            clipped = solid & (data.max(axis=2) >= 0.999)
            print(f'{name:18s} gold {100 * goldish.sum() / solid.sum():5.1f}% of figure '
                  f'(ceiling 15%)   clipped {100 * clipped.sum() / solid.sum():4.1f}%   '
                  f'mean value {data[solid].mean():.3f}')
        print(f'{"rim band":18s} {band.sum()} px, '
              f'{100 * band.sum() / solid.sum():.1f}% of the figure')
        print(f'{"alpha":18s} copied through unchanged on both')

    if failures:
        print('\nbuild_cast_guy_states FAILED', file=sys.stderr)
        for failure in failures:
            print('  !! ' + failure, file=sys.stderr)
        return 1
    print(f'\nbuild_cast_guy_states ok (2 states derived from {source.name}, alpha identical)')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
