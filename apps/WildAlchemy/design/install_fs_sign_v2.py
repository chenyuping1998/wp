"""Install the generated blank plaque while preserving the production alpha silhouette."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
folder = ROOT / "static/assets/sprites/hotMiamiFrame"
source = Image.open(folder / "fs_sign_capo_v2_source.png").convert("RGBA")
source = source.resize((1280, 1002), Image.Resampling.LANCZOS)
mask = Image.open(folder / "fs_sign_capo_v1.png").convert("RGBA").getchannel("A")
source.putalpha(mask)
source.save(folder / "fs_sign_capo_v2.png", optimize=True)
