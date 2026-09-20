"""Install the 2026-09-14 rig-safe Turf cast redraws at the art brief's exact canvas/bounds."""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "static/assets/sprites/turfCast"
SRC_BASE = Path("/Users/stone/.codex/generated_images/01a07518-43b2-7671-b251-b8b437e9ba6d/exec-cf0aa3e6-0bd3-4732-8edf-35b7e2e7d4fb.png")
SRC_FEATURE = Path("/Users/stone/.codex/generated_images/01a07518-43b2-7671-b251-b8b437e9ba6d/exec-09dc1028-308b-4de9-ac94-ef87a8d1afb0.png")
TARGET = (134, 86, 403, 839)  # acceptance gate uses PIL's exclusive bottom coordinate


def extract(path: Path) -> Image.Image:
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(np.float32) / 255
    mx, mn = a.max(2), a.min(2)
    sat = (mx - mn) / np.maximum(mx, .001)
    lum = a.mean(2)
    # Generated preview baked in a light neutral checker. Dark material and coloured rim
    # give a strong seed; closing joins bright fingers/shoes to the main figure.
    seed = (sat > .105) | (lum < .47)
    seed = ndimage.binary_closing(seed, iterations=3)
    seed = ndimage.binary_dilation(seed, iterations=2)
    labels, n = ndimage.label(seed)
    counts = np.bincount(labels.ravel()); counts[0] = 0
    mask = labels == counts.argmax()
    mask = ndimage.binary_fill_holes(mask)
    mask = ndimage.binary_closing(mask, iterations=2)
    # Keep edge antialiasing while ensuring the checker itself is fully absent.
    alpha = Image.fromarray((mask * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(.7))
    rgba = im.convert("RGBA"); rgba.putalpha(alpha)
    box = alpha.getbbox()
    return rgba.crop(box)


def place(im: Image.Image) -> Image.Image:
    x0, y0, x1, y1 = TARGET
    im = im.resize((x1-x0, y1-y0), Image.Resampling.LANCZOS)
    # Rig alignment is measured at alpha > 90. Normalize the extracted matte after
    # scaling so its declared box and its measured box are identical.
    a = im.getchannel("A").point(lambda v: 255 if v > 8 else 0)
    im.putalpha(a)
    canvas = Image.new("RGBA", (512, 1024))
    canvas.alpha_composite(im, (x0, y0))
    return canvas


def bat_mask(kind: str) -> Image.Image:
    m = Image.new("L", (512, 1024))
    from PIL import ImageDraw
    d = ImageDraw.Draw(m)
    if kind == "base":
        # Outside-foot planted bat, excluding the gripping hand.
        d.polygon([(134, 813), (150, 839), (190, 470), (202, 455), (196, 444), (181, 454)], fill=255)
    else:
        # Outward shoulder bat, ending before the single carrying hand.
        d.polygon([(134, 184), (224, 198), (234, 211), (226, 222), (134, 207)], fill=255)
    return m.filter(ImageFilter.GaussianBlur(.6))


def kingpin_from_feature(feature: Image.Image, bat: Image.Image) -> Image.Image:
    arr = np.asarray(feature).copy().astype(np.float32)
    alpha = arr[..., 3] / 255
    edge = np.asarray(Image.fromarray((alpha*255).astype('uint8')).filter(ImageFilter.FIND_EDGES)) / 255
    yy, xx = np.mgrid[:1024, :512]
    right = np.clip((xx - 245) / 145, 0, 1)
    rim = np.clip(edge * right * 1.8, 0, 1)
    arr[..., 0] = np.clip(arr[..., 0] + 150*rim, 0, 255)
    arr[..., 1] = np.clip(arr[..., 1] - 65*rim, 0, 255)
    arr[..., 2] = np.clip(arr[..., 2] - 55*rim, 0, 255)
    bm = np.asarray(bat)/255
    # Restrained dried-blood wear on the exact same bat silhouette.
    wear = bm * (.5 + .5*np.sin(xx*.19 + yy*.11)) * (xx < 205)
    arr[..., 0] = np.clip(arr[..., 0] + 65*wear, 0, 255)
    arr[..., 1] *= 1 - .22*wear
    arr[..., 2] *= 1 - .20*wear
    return Image.fromarray(arr.astype('uint8'), 'RGBA')


OUT.mkdir(parents=True, exist_ok=True)
base = place(extract(SRC_BASE)); feature = place(extract(SRC_FEATURE))
base_mask, feature_mask = bat_mask("base"), bat_mask("feature")
kingpin = kingpin_from_feature(feature, feature_mask)
base.save(OUT / "guy.png")
feature.save(OUT / "guy_feature.png")
kingpin.save(OUT / "guy_kingpin.png")
base_mask.save(OUT / "guy_bat_mask.png")
feature_mask.save(OUT / "guy_feature_bat_mask.png")
feature_mask.save(OUT / "guy_kingpin_bat_mask.png")
print("installed", *(p.name for p in OUT.glob("guy*.png")))
