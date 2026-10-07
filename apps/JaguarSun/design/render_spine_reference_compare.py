"""Normalize reference/setup figures to the same height and render overlays."""

from pathlib import Path
import numpy as np
from PIL import Image

APP = Path(__file__).resolve().parent.parent
REVIEW = APP / "design/_review"
BG = np.array([29, 24, 44], dtype=np.int16)


def reference_subject(path: Path, green_key: bool) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    arr = np.asarray(image).copy()
    if green_key:
        rgb = arr[:, :, :3].astype(np.int16)
        green = np.linalg.norm(rgb - np.array([0, 255, 0], dtype=np.int16), axis=2)
        arr[:, :, 3] = np.where(green > 90, arr[:, :, 3], 0)
    return crop_alpha(Image.fromarray(arr))


def setup_subject(path: Path) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    arr = np.asarray(image).copy()
    distance = np.linalg.norm(arr[:, :, :3].astype(np.int16) - BG, axis=2)
    arr[:, :, 3] = np.where(distance > 20, 255, 0).astype(np.uint8)
    return crop_alpha(Image.fromarray(arr))


def crop_alpha(image: Image.Image) -> Image.Image:
    alpha = np.asarray(image)[:, :, 3]
    ys, xs = np.where(alpha > 20)
    return image.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def fit_height(image: Image.Image, height: int) -> Image.Image:
    width = round(image.width * height / image.height)
    return image.resize((width, height), Image.Resampling.LANCZOS)


def render(name: str, reference: Path, setup: Path, green_key: bool) -> None:
    ref = fit_height(reference_subject(reference, green_key), 1200)
    rig = fit_height(setup_subject(setup), 1200)
    panel_w, panel_h = 720, 1320
    out = Image.new("RGBA", (panel_w * 3, panel_h), (29, 24, 44, 255))

    def place(image: Image.Image, panel: int, opacity: int = 255):
        layer = image.copy()
        if opacity != 255:
            a = layer.getchannel("A").point(lambda v: v * opacity // 255)
            layer.putalpha(a)
        x = panel * panel_w + (panel_w - image.width) // 2
        y = panel_h - 60 - image.height
        out.alpha_composite(layer, (x, y))

    place(ref, 0)
    place(rig, 1)
    # Overlay uses the same foot baseline and body centre. Reference first,
    # then setup at half opacity so doubled edges expose every mismatch.
    place(ref, 2, 180)
    place(rig, 2, 150)
    output = REVIEW / f"{name}_reference_compare.png"
    out.save(output)
    print(f"{name}: reference={ref.size} setup={rig.size} width_ratio={rig.width/ref.width:.3f}")
    print(output)


render(
    "cast_girl",
    APP / "design/source/spine/girl_reference_gun.png",
    REVIEW / "cast_girl_gun_setup.png",
    False,
)
render(
    "cast_guy",
    APP / "design/source/spine/guy_reference_bat.png",
    REVIEW / "cast_guy_bat_setup.png",
    True,
)
