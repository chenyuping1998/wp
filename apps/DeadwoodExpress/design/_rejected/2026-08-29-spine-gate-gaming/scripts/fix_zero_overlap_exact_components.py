"""Fix all non-adjacent component overlaps so check_spine_parts_overlap.py passes 100% CLEANLY.

Applies tight isolation & correct component offsets for:
- Guy: bat, chain, arm_upper_l, arm_upper_r, arm_lower_l, arm_lower_r, hand_l, hand_r, head, hair, hair_tip, legs, torso
- Girl: earring, hair, hair_tip, head, arm_upper_l, arm_upper_r, arm_lower_l, arm_lower_r, hand_l, hand_r, legs, torso
"""

import math
from pathlib import Path
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
GUY_BAT_SRC = ROOT / "design/source/spine/guy_reference_bat.png"
GIRL_SRC = ROOT / "static/assets/sprites/hotMiamiCast/girl.png"

GUY_DIR = ROOT / "design/source/spine/images"
GIRL_DIR = ROOT / "design/source/spine/images_girl"

CHROMA_GREEN = (0, 255, 0, 255)


def generate_clean_guy_components():
    guy = Image.open(GUY_BAT_SRC).convert("RGBA")
    gw, gh = guy.size # 512x512

    # 1. LEGS (512x512)
    im_legs = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    legs_art = guy.crop((180, 235, 340, 512))
    arr = np.array(legs_art).copy()
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    is_legs = (a > 20) & (r > 160) & (g > 140) & (b > 110)
    arr[:, :, 3] = np.where(is_legs, a, 0)
    clean = Image.fromarray(arr)
    im_legs.paste(clean, (180, 235), clean)
    im_legs.save(GUY_DIR / "legs.png")

    # 2. TORSO (512x512) - Exclude chain
    im_torso = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    torso_art = guy.crop((165, 95, 335, 270))
    arr = np.array(torso_art).copy()
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    is_torso = (a > 20) & ~((r > 200) & (g > 160) & (b < 100))
    arr[:, :, 3] = np.where(is_torso, a, 0)
    clean = Image.fromarray(arr)
    im_torso.paste(clean, (165, 95), clean)
    im_torso.save(GUY_DIR / "torso.png")

    # 3. CHAIN (256x256) - Tight gold chain isolation
    im_chain = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    chain_art = guy.crop((230, 110, 280, 145))
    arr = np.array(chain_art).copy()
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    is_gold = (a > 20) & (r > 190) & (g > 150) & (b < 100)
    arr[:, :, 3] = np.where(is_gold, a, 0)
    clean = Image.fromarray(arr)
    im_chain.paste(clean, (103, 110), clean)
    im_chain.save(GUY_DIR / "chain.png")

    # 4. ARM_UPPER_L (256x256)
    im_arm_ul = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    arm_ul_art = guy.crop((160, 105, 210, 215))
    arr = np.array(arm_ul_art).copy()
    arr[:, :, 3] = np.where(arr[:, :, 3] > 20, arr[:, :, 3], 0)
    clean = Image.fromarray(arr)
    im_arm_ul.paste(clean, (103, 60), clean)
    im_arm_ul.save(GUY_DIR / "arm_upper_l.png")

    # 5. ARM_LOWER_L (256x256)
    im_arm_ll = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    arm_ll_art = guy.crop((165, 200, 220, 285))
    arr = np.array(arm_ll_art).copy()
    arr[:, :, 3] = np.where(arr[:, :, 3] > 20, arr[:, :, 3], 0)
    clean = Image.fromarray(arr)
    im_arm_ll.paste(clean, (101, 86), clean)
    im_arm_ll.save(GUY_DIR / "arm_lower_l.png")

    # 6. HAND_L (128x128)
    im_hand_l = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    hand_l_art = guy.crop((185, 260, 235, 315))
    arr = np.array(hand_l_art).copy()
    arr[:, :, 3] = np.where(arr[:, :, 3] > 20, arr[:, :, 3], 0)
    clean = Image.fromarray(arr)
    im_hand_l.paste(clean, (39, 36), clean)
    im_hand_l.save(GUY_DIR / "hand_l.png")

    # 7. ARM_UPPER_R (256x256)
    im_arm_ur = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    arm_ur_art = guy.crop((280, 100, 355, 195))
    arr = np.array(arm_ur_art).copy()
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    is_arm = (a > 20) & ~((r > 190) & (g > 150) & (b < 100))
    arr[:, :, 3] = np.where(is_arm, a, 0)
    clean = Image.fromarray(arr)
    im_arm_ur.paste(clean, (90, 80), clean)
    im_arm_ur.save(GUY_DIR / "arm_upper_r.png")

    # 8. ARM_LOWER_R (256x256)
    im_arm_lr = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    arm_lr_art = guy.crop((300, 100, 375, 185))
    arr = np.array(arm_lr_art).copy()
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    is_arm = (a > 20) & ~((r > 190) & (g > 150) & (b < 100))
    arr[:, :, 3] = np.where(is_arm, a, 0)
    clean = Image.fromarray(arr)
    im_arm_lr.paste(clean, (90, 85), clean)
    im_arm_lr.save(GUY_DIR / "arm_lower_r.png")

    # 9. HAND_R (128x128)
    im_hand_r = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    hand_r_art = guy.crop((325, 110, 380, 155))
    arr = np.array(hand_r_art).copy()
    arr[:, :, 3] = np.where(arr[:, :, 3] > 20, arr[:, :, 3], 0)
    clean = Image.fromarray(arr)
    im_hand_r.paste(clean, (36, 36), clean)
    im_hand_r.save(GUY_DIR / "hand_r.png")

    # 10. BAT (384x384) - Tight bat isolation at top right
    im_bat = Image.new("RGBA", (384, 384), CHROMA_GREEN)
    bat_art = guy.crop((270, 30, 380, 150))
    arr = np.array(bat_art).copy()
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    is_wood = (a > 20) & (r > 140) & (g > 90) & (b < 100) & (r > g) & (g > b)
    arr[:, :, 3] = np.where(is_wood, a, 0)
    clean_bat = Image.fromarray(arr)
    im_bat.paste(clean_bat, (200, 110), clean_bat)
    im_bat.save(GUY_DIR / "bat.png")

    # 11. HEAD (256x256)
    im_head = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    head_art = guy.crop((210, 20, 290, 140))
    arr = np.array(head_art).copy()
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    is_head = (a > 20) & ~((r > 190) & (g > 150) & (b < 100))
    arr[:, :, 3] = np.where(is_head, a, 0)
    clean = Image.fromarray(arr)
    im_head.paste(clean, (88, 68), clean)
    im_head.save(GUY_DIR / "head.png")

    # 12. HAIR (256x256)
    im_hair = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    hair_art = guy.crop((190, 10, 310, 95))
    arr = np.array(hair_art).copy()
    arr[:, :, 3] = np.where(arr[:, :, 3] > 20, arr[:, :, 3], 0)
    clean = Image.fromarray(arr)
    im_hair.paste(clean, (68, 45), clean)
    im_hair.save(GUY_DIR / "hair.png")

    # 13. HAIR_TIP (128x128)
    im_hair_tip = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    tip_art = guy.crop((205, 20, 235, 65))
    arr = np.array(tip_art).copy()
    arr[:, :, 3] = np.where(arr[:, :, 3] > 20, arr[:, :, 3], 0)
    clean = Image.fromarray(arr)
    im_hair_tip.paste(clean, (49, 41), clean)
    im_hair_tip.save(GUY_DIR / "hair_tip.png")

    print("Guy components fixed and cleanly isolated!")


def generate_clean_girl_components():
    girl = Image.open(GIRL_SRC).convert("RGBA")
    gw, gh = girl.size # 229x775

    # 1. LEGS (512x512)
    im_legs = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    legs_art = girl.crop((0, int(gh * 0.38), gw, int(gh * 0.96)))
    legs_clean = legs_art.resize((245, 455), Image.BICUBIC)
    im_legs.paste(legs_clean, (133, 35), legs_clean)
    im_legs.save(GIRL_DIR / "legs.png")

    # 2. TORSO (512x512)
    im_torso = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    torso_art = girl.crop((10, int(gh * 0.16), gw - 10, int(gh * 0.44)))
    torso_clean = torso_art.resize((240, 280), Image.BICUBIC)
    im_torso.paste(torso_clean, (136, 116), torso_clean)
    im_torso.save(GIRL_DIR / "torso.png")

    # 3. EARRING (256x256) - Tight gold hoop earring (NO hair)
    im_earring = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    earring_art = girl.crop((int(gw * 0.68), int(gh * 0.11), int(gw * 0.83), int(gh * 0.17)))
    arr = np.array(earring_art).copy()
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    is_gold = (a > 20) & (r > 170) & (g > 140) & (b < 100)
    arr[:, :, 3] = np.where(is_gold, a, 0)
    clean_earring = Image.fromarray(arr).resize((40, 60), Image.BICUBIC)
    im_earring.paste(clean_earring, (158, 140), clean_earring)
    im_earring.save(GIRL_DIR / "earring.png")

    # 4. HAIR (256x256) - Dark wavy hair mass (NO gold earring)
    im_hair = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    hair_art = girl.crop((0, 0, gw, int(gh * 0.22)))
    arr = np.array(hair_art).copy()
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    is_not_gold = (a > 20) & ~((r > 170) & (g > 140) & (b < 100))
    arr[:, :, 3] = np.where(is_not_gold, a, 0)
    clean_hair = Image.fromarray(arr).resize((190, 170), Image.BICUBIC)
    im_hair.paste(clean_hair, (33, 25), clean_hair)
    im_hair.save(GIRL_DIR / "hair.png")

    # 5. HAIR_TIP (128x128)
    im_hair_tip = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    tip_art = girl.crop((0, int(gh * 0.08), int(gw * 0.35), int(gh * 0.22)))
    arr = np.array(tip_art).copy()
    arr[:, :, 3] = np.where(arr[:, :, 3] > 20, arr[:, :, 3], 0)
    clean = Image.fromarray(arr).resize((65, 85), Image.BICUBIC)
    im_hair_tip.paste(clean, (31, 21), clean)
    im_hair_tip.save(GIRL_DIR / "hair_tip.png")

    # 6. HEAD (256x256)
    im_head = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    head_art = girl.crop((int(gw * 0.22), int(gh * 0.04), int(gw * 0.78), int(gh * 0.20)))
    clean = head_art.resize((150, 175), Image.BICUBIC)
    im_head.paste(clean, (53, 40), clean)
    im_head.save(GIRL_DIR / "head.png")

    # 7. ARM_UPPER_L (256x256)
    im_arm_ul = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    arm_ul_art = girl.crop((0, int(gh * 0.18), int(gw * 0.45), int(gh * 0.35)))
    clean = arm_ul_art.resize((100, 160), Image.BICUBIC)
    im_arm_ul.paste(clean, (78, 48), clean)
    im_arm_ul.save(GIRL_DIR / "arm_upper_l.png")

    # 8. ARM_LOWER_L (256x256)
    im_arm_ll = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    arm_ll_art = girl.crop((0, int(gh * 0.32), int(gw * 0.42), int(gh * 0.48)))
    clean = arm_ll_art.resize((90, 150), Image.BICUBIC)
    im_arm_ll.paste(clean, (83, 53), clean)
    im_arm_ll.save(GIRL_DIR / "arm_lower_l.png")

    # 9. HAND_L (128x128)
    im_hand_l = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    hand_l_art = girl.crop((0, int(gh * 0.45), int(gw * 0.35), int(gh * 0.55)))
    clean = hand_l_art.resize((65, 80), Image.BICUBIC)
    im_hand_l.paste(clean, (31, 24), clean)
    im_hand_l.save(GIRL_DIR / "hand_l.png")

    # 10. ARM_UPPER_R (256x256)
    im_arm_ur = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    arm_ur_art = girl.crop((int(gw * 0.55), int(gh * 0.18), gw, int(gh * 0.35)))
    clean = arm_ur_art.resize((100, 160), Image.BICUBIC)
    im_arm_ur.paste(clean, (78, 48), clean)
    im_arm_ur.save(GIRL_DIR / "arm_upper_r.png")

    # 11. ARM_LOWER_R (256x256)
    im_arm_lr = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    arm_lr_art = girl.crop((int(gw * 0.58), int(gh * 0.32), gw, int(gh * 0.48)))
    clean = arm_lr_art.resize((110, 150), Image.BICUBIC)
    im_arm_lr.paste(clean, (73, 53), clean)
    im_arm_lr.save(GIRL_DIR / "arm_lower_r.png")

    # 12. HAND_R (128x128)
    im_hand_r = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    hand_r_art = girl.crop((int(gw * 0.60), int(gh * 0.45), gw, int(gh * 0.55)))
    clean = hand_r_art.resize((85, 80), Image.BICUBIC)
    im_hand_r.paste(clean, (21, 24), clean)
    im_hand_r.save(GIRL_DIR / "hand_r.png")

    print("Girl components fixed and cleanly isolated!")


if __name__ == "__main__":
    generate_clean_guy_components()
    generate_clean_girl_components()
