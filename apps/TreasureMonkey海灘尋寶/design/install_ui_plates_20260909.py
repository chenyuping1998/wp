#!/usr/bin/env python3
"""Normalize the generated §8.7 UI plates to their exact runtime contracts."""

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "design/source/capoUiPlates/2026-09-09"
OUT = ROOT / "static/assets/sprites/capoUiPlates"


def trim(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    bbox = im.getchannel("A").getbbox()
    return im.crop(bbox) if bbox else im


def install(name: str, size: tuple[int, int]) -> None:
    im = trim(Image.open(SRC / f"{name}_source.png"))
    im = im.resize(size, Image.Resampling.LANCZOS)
    im.save(OUT / f"{name}.png", optimize=True)


install("button_plate", (256, 256))
install("ticker_plate", (1206, 270))
install("spin_plate", (512, 512))
