"""Verify and fix component image masks in design/source/spine/images and design/source/spine/images_girl so check_spine_parts_overlap.py passes 100% CLEANLY."""

import json
from pathlib import Path
from PIL import Image
import numpy as np

APP_ROOT = Path(__file__).resolve().parent.parent
GUY_JSON = APP_ROOT / "static/assets/spines/cast_guy/guy.json"
GIRL_JSON = APP_ROOT / "static/assets/spines/cast_girl/girl.json"

GUY_IMG_DIR = APP_ROOT / "design/source/spine/images"
GIRL_IMG_DIR = APP_ROOT / "design/source/spine/images_girl"

CHROMA_GREEN = (0, 255, 0, 255)


def trim_guy_overlaps():
    # 1. BAT (384x384): Isolate ONLY the wooden bat shaft extending diagonally to top-right
    bat_path = GUY_IMG_DIR / "bat.png"
    im_bat = Image.open(bat_path).convert("RGBA")
    arr = np.array(im_bat).copy()
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    h, w, _ = arr.shape
    xx, yy = np.meshgrid(np.arange(w), np.arange(h))
    
    # Isolate wooden bat pixels, excluding any left-side overlap with head/hair (xx < 185 and yy < 180)
    is_wood = (a > 20) & (r > 130) & (g > 80) & (b < 110) & (r > g) & ~((xx < 185) & (yy < 180))
    arr[:, :, 3] = np.where(is_wood, a, 0)
    Image.fromarray(arr).save(bat_path)

    # 2. CHAIN (256x256): Ensure ONLY gold chain links exist (centered around x: 80..176, y: 70..140)
    chain_path = GUY_IMG_DIR / "chain.png"
    im_chain = Image.open(chain_path).convert("RGBA")
    arr = np.array(im_chain).copy()
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    is_gold = (a > 20) & (r > 170) & (g > 130) & (b < 110)
    arr[:, :, 3] = np.where(is_gold, a, 0)
    Image.fromarray(arr).save(chain_path)

    # 3. ARM_UPPER_L (256x256): Trim right/top edge where chain/torso sit
    arm_ul_path = GUY_IMG_DIR / "arm_upper_l.png"
    im_arm = Image.open(arm_ul_path).convert("RGBA")
    arr = np.array(im_arm).copy()
    h, w, _ = arr.shape
    xx, yy = np.meshgrid(np.arange(w), np.arange(h))
    arr[:, :, 3] = np.where((arr[:, :, 3] > 20) & (xx < 175), arr[:, :, 3], 0)
    Image.fromarray(arr).save(arm_ul_path)

    # 4. ARM_UPPER_R (256x256): Trim left edge where chain/torso sit
    arm_ur_path = GUY_IMG_DIR / "arm_upper_r.png"
    im_arm = Image.open(arm_ur_path).convert("RGBA")
    arr = np.array(im_arm).copy()
    h, w, _ = arr.shape
    xx, yy = np.meshgrid(np.arange(w), np.arange(h))
    arr[:, :, 3] = np.where((arr[:, :, 3] > 20) & (xx > 85), arr[:, :, 3], 0)
    Image.fromarray(arr).save(arm_ur_path)

    print("Trimmed Guy component masks!")


def trim_girl_overlaps():
    # 1. EARRING (256x256): Ensure ONLY gold hoop earring pixels exist (x: 130..180, y: 120..180)
    earring_path = GIRL_IMG_DIR / "earring.png"
    im_earring = Image.open(earring_path).convert("RGBA")
    arr = np.array(im_earring).copy()
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    h, w, _ = arr.shape
    xx, yy = np.meshgrid(np.arange(w), np.arange(h))
    is_gold = (a > 20) & (r > 160) & (g > 130) & (b < 110) & (xx > 120) & (yy > 100)
    arr[:, :, 3] = np.where(is_gold, a, 0)
    Image.fromarray(arr).save(earring_path)

    # 2. HAIR (256x256): Ensure gold earring pixels are excluded from hair
    hair_path = GIRL_IMG_DIR / "hair.png"
    im_hair = Image.open(hair_path).convert("RGBA")
    arr = np.array(im_hair).copy()
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    h, w, _ = arr.shape
    xx, yy = np.meshgrid(np.arange(w), np.arange(h))
    is_not_gold = (a > 20) & ~((r > 160) & (g > 130) & (b < 110) & (xx > 130) & (yy > 110))
    arr[:, :, 3] = np.where(is_not_gold, a, 0)
    Image.fromarray(arr).save(hair_path)

    print("Trimmed Girl component masks!")


if __name__ == "__main__":
    trim_guy_overlaps()
    trim_girl_overlaps()
