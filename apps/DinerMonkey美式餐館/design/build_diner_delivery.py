"""Export the current main-game diner art as separate delivery images."""

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "design" / "cover"
OUT.mkdir(exist_ok=True)

character = Image.open(ROOT / "design" / "cast_delivery" / "mg_full_source.png").convert("RGBA")
bounds = character.getchannel("A").getbbox()
if bounds is None:
    raise ValueError("Main-game character has no visible pixels")
margin = 28
left, top, right, bottom = bounds
canvas = Image.new("RGBA", (right - left + margin * 2, bottom - top + margin * 2))
canvas.alpha_composite(character.crop(bounds), (margin, margin))
canvas.save(OUT / "DinerMonkey-Character-Base-Transparent.png", optimize=True)

background = Image.open(ROOT / "static" / "assets" / "sprites" / "sushiBackground" / "bg_base.png").convert("RGB")
background.save(OUT / "DinerMonkey-Background-Base.png", optimize=True)

print(f"character: {canvas.size}, background: {background.size}")
