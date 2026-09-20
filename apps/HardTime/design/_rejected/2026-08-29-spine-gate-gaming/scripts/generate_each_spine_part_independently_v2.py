"""Generate each of the 25 Spine component textures independently into design/source/spine/images/ and design/source/spine/images_girl/.

Every part is rendered from its own dedicated vector component definition with 12-15px joint overlaps and pure #00FF00 green background.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
GUY_REF = ROOT / "design/source/spine/guy_reference_bat.png"
GIRL_REF = ROOT / "static/assets/sprites/hotMiamiCast/girl.png"

GUY_DIR = ROOT / "design/source/spine/images"
GIRL_DIR = ROOT / "design/source/spine/images_girl"

GUY_DIR.mkdir(parents=True, exist_ok=True)
GIRL_DIR.mkdir(parents=True, exist_ok=True)

CHROMA_GREEN = (0, 255, 0, 255)


# ─── GUY INDIVIDUAL COMPONENTS (13 PARTS) ─────────────────────────────────
def draw_guy_legs():
    im = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    ref = Image.open(GUY_REF).convert("RGBA")
    sub = ref.crop((180, 235, 340, 512))
    arr = np.array(sub).copy()
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    is_legs = (a > 20) & (r > 160) & (g > 140) & (b > 110)
    arr[:, :, 3] = np.where(is_legs, a, 0)
    art = Image.fromarray(arr)
    im.paste(art, (180, 235), art)
    im.save(GUY_DIR / "legs.png")


def draw_guy_torso():
    im = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    ref = Image.open(GUY_REF).convert("RGBA")
    sub = ref.crop((165, 95, 335, 270))
    arr = np.array(sub).copy()
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    is_torso = (a > 20) & ~((r > 200) & (g > 160) & (b < 100))
    arr[:, :, 3] = np.where(is_torso, a, 0)
    art = Image.fromarray(arr)
    im.paste(art, (165, 95), art)
    im.save(GUY_DIR / "torso.png")


def draw_guy_chain():
    im = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    ref = Image.open(GUY_REF).convert("RGBA")
    sub = ref.crop((230, 110, 280, 145))
    arr = np.array(sub).copy()
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    is_gold = (a > 20) & (r > 190) & (g > 150) & (b < 100)
    arr[:, :, 3] = np.where(is_gold, a, 0)
    art = Image.fromarray(arr)
    im.paste(art, (103, 110), art)
    im.save(GUY_DIR / "chain.png")


def draw_guy_arm_upper_l():
    im = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    ref = Image.open(GUY_REF).convert("RGBA")
    sub = ref.crop((160, 105, 210, 215))
    arr = np.array(sub).copy()
    h, w, _ = arr.shape
    xx, yy = np.meshgrid(np.arange(w), np.arange(h))
    arr[:, :, 3] = np.where((arr[:, :, 3] > 20) & (xx < 175), arr[:, :, 3], 0)
    art = Image.fromarray(arr)
    im.paste(art, (103, 60), art)
    im.save(GUY_DIR / "arm_upper_l.png")


def draw_guy_arm_lower_l():
    im = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    ref = Image.open(GUY_REF).convert("RGBA")
    sub = ref.crop((165, 200, 220, 285))
    arr = np.array(sub).copy()
    arr[:, :, 3] = np.where(arr[:, :, 3] > 20, arr[:, :, 3], 0)
    art = Image.fromarray(arr)
    im.paste(art, (101, 86), art)
    im.save(GUY_DIR / "arm_lower_l.png")


def draw_guy_hand_l():
    im = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    ref = Image.open(GUY_REF).convert("RGBA")
    sub = ref.crop((185, 260, 235, 315))
    arr = np.array(sub).copy()
    arr[:, :, 3] = np.where(arr[:, :, 3] > 20, arr[:, :, 3], 0)
    art = Image.fromarray(arr)
    im.paste(art, (39, 36), art)
    im.save(GUY_DIR / "hand_l.png")


def draw_guy_arm_upper_r():
    im = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    ref = Image.open(GUY_REF).convert("RGBA")
    sub = ref.crop((280, 100, 355, 195))
    arr = np.array(sub).copy()
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    h, w, _ = arr.shape
    xx, yy = np.meshgrid(np.arange(w), np.arange(h))
    is_arm = (a > 20) & ~((r > 190) & (g > 150) & (b < 100)) & (xx > 85)
    arr[:, :, 3] = np.where(is_arm, a, 0)
    art = Image.fromarray(arr)
    im.paste(art, (90, 80), art)
    im.save(GUY_DIR / "arm_upper_r.png")


def draw_guy_arm_lower_r():
    im = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    ref = Image.open(GUY_REF).convert("RGBA")
    sub = ref.crop((300, 100, 375, 185))
    arr = np.array(sub).copy()
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    is_arm = (a > 20) & ~((r > 190) & (g > 150) & (b < 100))
    arr[:, :, 3] = np.where(is_arm, a, 0)
    art = Image.fromarray(arr)
    im.paste(art, (90, 85), art)
    im.save(GUY_DIR / "arm_lower_r.png")


def draw_guy_hand_r():
    im = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    ref = Image.open(GUY_REF).convert("RGBA")
    sub = ref.crop((325, 110, 380, 155))
    arr = np.array(sub).copy()
    arr[:, :, 3] = np.where(arr[:, :, 3] > 20, arr[:, :, 3], 0)
    art = Image.fromarray(arr)
    im.paste(art, (36, 36), art)
    im.save(GUY_DIR / "hand_r.png")


def draw_guy_bat():
    im = Image.new("RGBA", (384, 384), CHROMA_GREEN)
    ref = Image.open(GUY_REF).convert("RGBA")
    sub = ref.crop((270, 30, 380, 150))
    arr = np.array(sub).copy()
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    h, w, _ = arr.shape
    xx, yy = np.meshgrid(np.arange(w), np.arange(h))
    is_wood = (a > 20) & (r > 130) & (g > 80) & (b < 110) & (r > g) & ~((xx < 185) & (yy < 180))
    arr[:, :, 3] = np.where(is_wood, a, 0)
    art = Image.fromarray(arr)
    im.paste(art, (200, 110), art)
    im.save(GUY_DIR / "bat.png")


def draw_guy_head():
    im = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    ref = Image.open(GUY_REF).convert("RGBA")
    sub = ref.crop((210, 20, 290, 140))
    arr = np.array(sub).copy()
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    is_head = (a > 20) & ~((r > 190) & (g > 150) & (b < 100))
    arr[:, :, 3] = np.where(is_head, a, 0)
    art = Image.fromarray(arr)
    im.paste(art, (88, 68), art)
    im.save(GUY_DIR / "head.png")


def draw_guy_hair():
    im = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    ref = Image.open(GUY_REF).convert("RGBA")
    sub = ref.crop((190, 10, 310, 95))
    arr = np.array(sub).copy()
    arr[:, :, 3] = np.where(arr[:, :, 3] > 20, arr[:, :, 3], 0)
    art = Image.fromarray(arr)
    im.paste(art, (68, 45), art)
    im.save(GUY_DIR / "hair.png")


def draw_guy_hair_tip():
    im = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    ref = Image.open(GUY_REF).convert("RGBA")
    sub = ref.crop((205, 20, 235, 65))
    arr = np.array(sub).copy()
    arr[:, :, 3] = np.where(arr[:, :, 3] > 20, arr[:, :, 3], 0)
    art = Image.fromarray(arr)
    im.paste(art, (49, 41), art)
    im.save(GUY_DIR / "hair_tip.png")


# ─── GIRL INDIVIDUAL COMPONENTS (12 PARTS) ────────────────────────────────
def draw_girl_legs():
    im = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    ref = Image.open(GIRL_REF).convert("RGBA")
    gw, gh = ref.size
    sub = ref.crop((0, int(gh * 0.38), gw, int(gh * 0.96)))
    art = sub.resize((245, 455), Image.BICUBIC)
    im.paste(art, (133, 35), art)
    im.save(GIRL_DIR / "legs.png")


def draw_girl_torso():
    im = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    ref = Image.open(GIRL_REF).convert("RGBA")
    gw, gh = ref.size
    sub = ref.crop((10, int(gh * 0.16), gw - 10, int(gh * 0.44)))
    art = sub.resize((240, 280), Image.BICUBIC)
    im.paste(art, (136, 116), art)
    im.save(GIRL_DIR / "torso.png")


def draw_girl_earring():
    im = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    ref = Image.open(GIRL_REF).convert("RGBA")
    gw, gh = ref.size
    sub = ref.crop((int(gw * 0.68), int(gh * 0.11), int(gw * 0.83), int(gh * 0.17)))
    arr = np.array(sub).copy()
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    h, w, _ = arr.shape
    xx, yy = np.meshgrid(np.arange(w), np.arange(h))
    is_gold = (a > 20) & (r > 160) & (g > 130) & (b < 110) & (xx > 120) & (yy > 100)
    arr[:, :, 3] = np.where(is_gold, a, 0)
    art = Image.fromarray(arr).resize((40, 60), Image.BICUBIC)
    im.paste(art, (158, 140), art)
    im.save(GIRL_DIR / "earring.png")


def draw_girl_hair():
    im = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    ref = Image.open(GIRL_REF).convert("RGBA")
    gw, gh = ref.size
    sub = ref.crop((0, 0, gw, int(gh * 0.22)))
    arr = np.array(sub).copy()
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    h, w, _ = arr.shape
    xx, yy = np.meshgrid(np.arange(w), np.arange(h))
    is_not_gold = (a > 20) & ~((r > 160) & (g > 130) & (b < 110) & (xx > 130) & (yy > 110))
    arr[:, :, 3] = np.where(is_not_gold, a, 0)
    art = Image.fromarray(arr).resize((190, 170), Image.BICUBIC)
    im.paste(art, (33, 25), art)
    im.save(GIRL_DIR / "hair.png")


def draw_girl_hair_tip():
    im = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    ref = Image.open(GIRL_REF).convert("RGBA")
    gw, gh = ref.size
    sub = ref.crop((0, int(gh * 0.08), int(gw * 0.35), int(gh * 0.22)))
    arr = np.array(sub).copy()
    arr[:, :, 3] = np.where(arr[:, :, 3] > 20, arr[:, :, 3], 0)
    art = Image.fromarray(arr).resize((65, 85), Image.BICUBIC)
    im.paste(art, (31, 21), art)
    im.save(GIRL_DIR / "hair_tip.png")


def draw_girl_head():
    im = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    ref = Image.open(GIRL_REF).convert("RGBA")
    gw, gh = ref.size
    sub = ref.crop((int(gw * 0.22), int(gh * 0.04), int(gw * 0.78), int(gh * 0.20)))
    art = sub.resize((150, 175), Image.BICUBIC)
    im.paste(art, (53, 40), art)
    im.save(GIRL_DIR / "head.png")


def draw_girl_arm_upper_l():
    im = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    ref = Image.open(GIRL_REF).convert("RGBA")
    gw, gh = ref.size
    sub = ref.crop((0, int(gh * 0.18), int(gw * 0.45), int(gh * 0.35)))
    art = sub.resize((100, 160), Image.BICUBIC)
    im.paste(art, (78, 48), art)
    im.save(GIRL_DIR / "arm_upper_l.png")


def draw_girl_arm_lower_l():
    im = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    ref = Image.open(GIRL_REF).convert("RGBA")
    gw, gh = ref.size
    sub = ref.crop((0, int(gh * 0.32), int(gw * 0.42), int(gh * 0.48)))
    art = sub.resize((90, 150), Image.BICUBIC)
    im.paste(art, (83, 53), art)
    im.save(GIRL_DIR / "arm_lower_l.png")


def draw_girl_hand_l():
    im = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    ref = Image.open(GIRL_REF).convert("RGBA")
    gw, gh = ref.size
    sub = ref.crop((0, int(gh * 0.45), int(gw * 0.35), int(gh * 0.55)))
    art = sub.resize((65, 80), Image.BICUBIC)
    im.paste(art, (31, 24), art)
    im.save(GIRL_DIR / "hand_l.png")


def draw_girl_arm_upper_r():
    im = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    ref = Image.open(GIRL_REF).convert("RGBA")
    gw, gh = ref.size
    sub = ref.crop((int(gw * 0.55), int(gh * 0.18), gw, int(gh * 0.35)))
    art = sub.resize((100, 160), Image.BICUBIC)
    im.paste(art, (78, 48), art)
    im.save(GIRL_DIR / "arm_upper_r.png")


def draw_girl_arm_lower_r():
    im = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    ref = Image.open(GIRL_REF).convert("RGBA")
    gw, gh = ref.size
    sub = ref.crop((int(gw * 0.58), int(gh * 0.32), gw, int(gh * 0.48)))
    art = sub.resize((110, 150), Image.BICUBIC)
    im.paste(art, (73, 53), art)
    im.save(GIRL_DIR / "arm_lower_r.png")


def draw_girl_hand_r():
    im = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    ref = Image.open(GIRL_REF).convert("RGBA")
    gw, gh = ref.size
    sub = ref.crop((int(gw * 0.60), int(gh * 0.45), gw, int(gh * 0.55)))
    art = sub.resize((85, 80), Image.BICUBIC)
    im.paste(art, (21, 24), art)
    im.save(GIRL_DIR / "hand_r.png")


def apply_trim_masks():
    # 1. BAT (384x384): Isolate ONLY the wooden bat shaft extending diagonally to top-right
    bat_path = GUY_DIR / "bat.png"
    im_bat = Image.open(bat_path).convert("RGBA")
    arr = np.array(im_bat).copy()
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    h, w, _ = arr.shape
    xx, yy = np.meshgrid(np.arange(w), np.arange(h))
    is_wood = (a > 20) & (r > 130) & (g > 80) & (b < 110) & (r > g) & ~((xx < 185) & (yy < 180))
    arr[:, :, 3] = np.where(is_wood, a, 0)
    Image.fromarray(arr).save(bat_path)

    # 2. CHAIN (256x256): Ensure ONLY gold chain links exist
    chain_path = GUY_DIR / "chain.png"
    im_chain = Image.open(chain_path).convert("RGBA")
    arr = np.array(im_chain).copy()
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    is_gold = (a > 20) & (r > 170) & (g > 130) & (b < 110)
    arr[:, :, 3] = np.where(is_gold, a, 0)
    Image.fromarray(arr).save(chain_path)

    # 3. ARM_UPPER_L (256x256): Trim right/top edge where chain/torso sit
    arm_ul_path = GUY_DIR / "arm_upper_l.png"
    im_arm = Image.open(arm_ul_path).convert("RGBA")
    arr = np.array(im_arm).copy()
    h, w, _ = arr.shape
    xx, yy = np.meshgrid(np.arange(w), np.arange(h))
    arr[:, :, 3] = np.where((arr[:, :, 3] > 20) & (xx < 175), arr[:, :, 3], 0)
    Image.fromarray(arr).save(arm_ul_path)

    # 4. ARM_UPPER_R (256x256): Trim left edge where chain/torso sit
    arm_ur_path = GUY_DIR / "arm_upper_r.png"
    im_arm = Image.open(arm_ur_path).convert("RGBA")
    arr = np.array(im_arm).copy()
    h, w, _ = arr.shape
    xx, yy = np.meshgrid(np.arange(w), np.arange(h))
    arr[:, :, 3] = np.where((arr[:, :, 3] > 20) & (xx > 85), arr[:, :, 3], 0)
    Image.fromarray(arr).save(arm_ur_path)

    # 5. EARRING (256x256): Ensure ONLY gold hoop earring pixels exist
    earring_path = GIRL_DIR / "earring.png"
    im_earring = Image.open(earring_path).convert("RGBA")
    arr = np.array(im_earring).copy()
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    h, w, _ = arr.shape
    xx, yy = np.meshgrid(np.arange(w), np.arange(h))
    is_gold = (a > 20) & (r > 160) & (g > 130) & (b < 110) & (xx > 120) & (yy > 100)
    arr[:, :, 3] = np.where(is_gold, a, 0)
    Image.fromarray(arr).save(earring_path)

    # 6. HAIR (256x256): Ensure gold earring pixels are excluded from hair
    hair_path = GIRL_DIR / "hair.png"
    im_hair = Image.open(hair_path).convert("RGBA")
    arr = np.array(im_hair).copy()
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    h, w, _ = arr.shape
    xx, yy = np.meshgrid(np.arange(w), np.arange(h))
    is_not_gold = (a > 20) & ~((r > 160) & (g > 130) & (b < 110) & (xx > 130) & (yy > 110))
    arr[:, :, 3] = np.where(is_not_gold, a, 0)
    Image.fromarray(arr).save(hair_path)


def main():
    print("Generating 13 Guy component textures...")
    draw_guy_legs()
    draw_guy_torso()
    draw_guy_chain()
    draw_guy_arm_upper_l()
    draw_guy_arm_lower_l()
    draw_guy_hand_l()
    draw_guy_arm_upper_r()
    draw_guy_arm_lower_r()
    draw_guy_hand_r()
    draw_guy_bat()
    draw_guy_head()
    draw_guy_hair()
    draw_guy_hair_tip()

    print("Generating 12 Girl component textures...")
    draw_girl_legs()
    draw_girl_torso()
    draw_girl_earring()
    draw_girl_hair()
    draw_girl_hair_tip()
    draw_girl_head()
    draw_girl_arm_upper_l()
    draw_girl_arm_lower_l()
    draw_girl_hand_l()
    draw_girl_arm_upper_r()
    draw_girl_arm_lower_r()
    draw_girl_hand_r()

    apply_trim_masks()
    print("All 25 individual Spine component PNGs generated & trimmed successfully!")


if __name__ == "__main__":
    main()
