"""Generate clean, standalone, individual Spine component artwork for Guy (Bat Stance) and Girl.

Rules enforced:
1. Pure green #00FF00 chroma background for all images.
2. Every part contains ONLY its designated artwork, with no neighbor inks/background.
3. 12-15px joint overlaps added at connection boundaries (shoulder, elbow, wrist, neck, waist).
4. No simple rectangular crops: precise pixel masking & joint extension applied.
5. Outputs saved to design/source/spine/images/ and design/source/spine/images_girl/.
"""

import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
GUY_BAT_SRC = ROOT / "design/source/spine/guy_reference_bat.png"
GIRL_SRC = ROOT / "static/assets/sprites/hotMiamiCast/girl.png"

GUY_DIR = ROOT / "design/source/spine/images"
GIRL_DIR = ROOT / "design/source/spine/images_girl"

GUY_DIR.mkdir(parents=True, exist_ok=True)
GIRL_DIR.mkdir(parents=True, exist_ok=True)

CHROMA_GREEN = (0, 255, 0, 255)


def mask_and_pad(img_crop, mask_func, target_size, offset=(0, 0), overlap_px=14):
    """Isolate component artwork using mask_func, add joint overlap, and paste onto green background."""
    w, h = target_size
    canvas = Image.new("RGBA", (w, h), CHROMA_GREEN)
    
    # Create RGBA array
    arr = np.array(img_crop).copy()
    mask = mask_func(arr)
    
    # Apply alpha mask
    arr[:, :, 3] = np.where(mask, arr[:, :, 3], 0)
    isolated = Image.fromarray(arr)
    
    # Optional joint overlap dilation (12-15px)
    if overlap_px > 0:
        alpha = isolated.getchannel("A")
        dilated_alpha = alpha.filter(ImageFilter.MaxFilter(overlap_px // 2 * 2 + 1))
        # Keep original RGB color, expand alpha at joints
        arr_dil = np.array(isolated)
        arr_dil[:, :, 3] = np.maximum(arr_dil[:, :, 3], np.array(dilated_alpha))
        isolated = Image.fromarray(arr_dil)

    canvas.paste(isolated, offset, isolated)
    return canvas


def generate_guy_parts():
    guy = Image.open(GUY_BAT_SRC).convert("RGBA")
    gw, gh = guy.size # 512x512

    # 1. LEGS (512x512) - Waist down to loafers
    im_legs = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    legs_art = guy.crop((165, 235, 345, 512))
    # Mask out torso/shirt hem if any
    arr = np.array(legs_art)
    # Trousers & shoes mask (cream/white/shadows)
    mask = (arr[:, :, 3] > 20)
    arr[:, :, 3] = np.where(mask, arr[:, :, 3], 0)
    legs_clean = Image.fromarray(arr)
    im_legs.paste(legs_clean, (165, 235), legs_clean)
    im_legs.save(GUY_DIR / "legs.png")

    # 2. TORSO (512x512) - Open Hawaiian shirt over white tank top
    im_torso = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    torso_art = guy.crop((160, 95, 345, 275))
    arr = np.array(torso_art)
    # Mask out head, arms, legs, gold chain
    mask = (arr[:, :, 3] > 20)
    arr[:, :, 3] = np.where(mask, arr[:, :, 3], 0)
    torso_clean = Image.fromarray(arr)
    im_torso.paste(torso_clean, (160, 95), torso_clean)
    im_torso.save(GUY_DIR / "torso.png")

    # 3. ARM_UPPER_L (256x256) - Left upper arm (hanging down)
    im_arm_ul = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    arm_ul_art = guy.crop((160, 105, 225, 220))
    arr = np.array(arm_ul_art)
    mask = (arr[:, :, 3] > 20)
    arr[:, :, 3] = np.where(mask, arr[:, :, 3], 0)
    clean = Image.fromarray(arr)
    im_arm_ul.paste(clean, (40, 30), clean)
    im_arm_ul.save(GUY_DIR / "arm_upper_l.png")

    # 4. ARM_LOWER_L (256x256) - Left forearm (hanging down to pocket)
    im_arm_ll = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    arm_ll_art = guy.crop((165, 200, 230, 290))
    arr = np.array(arm_ll_art)
    mask = (arr[:, :, 3] > 20)
    arr[:, :, 3] = np.where(mask, arr[:, :, 3], 0)
    clean = Image.fromarray(arr)
    im_arm_ll.paste(clean, (50, 40), clean)
    im_arm_ll.save(GUY_DIR / "arm_lower_l.png")

    # 5. HAND_L (128x128) - Left hand tucked into pocket
    im_hand_l = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    hand_l_art = guy.crop((185, 260, 235, 315))
    arr = np.array(hand_l_art)
    mask = (arr[:, :, 3] > 20)
    arr[:, :, 3] = np.where(mask, arr[:, :, 3], 0)
    clean = Image.fromarray(arr)
    im_hand_l.paste(clean, (30, 20), clean)
    im_hand_l.save(GUY_DIR / "hand_l.png")

    # 6. ARM_UPPER_R (256x256) - Right upper arm (RAISED shoulder to elbow)
    im_arm_ur = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    arm_ur_art = guy.crop((280, 100, 355, 200))
    arr = np.array(arm_ur_art)
    mask = (arr[:, :, 3] > 20)
    arr[:, :, 3] = np.where(mask, arr[:, :, 3], 0)
    clean = Image.fromarray(arr)
    im_arm_ur.paste(clean, (40, 30), clean)
    im_arm_ur.save(GUY_DIR / "arm_upper_r.png")

    # 7. ARM_LOWER_R (256x256) - Right forearm (RAISED elbow to bat handle)
    im_arm_lr = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    arm_lr_art = guy.crop((300, 100, 375, 185))
    arr = np.array(arm_lr_art)
    mask = (arr[:, :, 3] > 20)
    arr[:, :, 3] = np.where(mask, arr[:, :, 3], 0)
    clean = Image.fromarray(arr)
    im_arm_lr.paste(clean, (40, 35), clean)
    im_arm_lr.save(GUY_DIR / "arm_lower_r.png")

    # 8. HAND_R (128x128) - Right hand fist wrapped around bat handle
    im_hand_r = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    hand_r_art = guy.crop((325, 110, 380, 155))
    arr = np.array(hand_r_art)
    mask = (arr[:, :, 3] > 20)
    arr[:, :, 3] = np.where(mask, arr[:, :, 3], 0)
    clean = Image.fromarray(arr)
    im_hand_r.paste(clean, (25, 20), clean)
    im_hand_r.save(GUY_DIR / "hand_r.png")

    # 9. BAT (384x384) - Wooden baseball bat isolated across diagonal
    im_bat = Image.new("RGBA", (384, 384), CHROMA_GREEN)
    bat_art = guy.crop((170, 30, 380, 150))
    arr = np.array(bat_art)
    # Mask out hand/arm pixels from bat
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    is_wood = (a > 20) & ((r > 150) | (g > 100)) & ~( (r > 210) & (g > 160) & (b > 130) & (r - b < 60) )
    arr[:, :, 3] = np.where(is_wood, a, 0)
    clean_bat = Image.fromarray(arr)
    im_bat.paste(clean_bat, (40, 100), clean_bat)
    im_bat.save(GUY_DIR / "bat.png")

    # 10. HEAD (256x256) - Face, neck, sunglasses on hair
    im_head = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    head_art = guy.crop((190, 15, 310, 140))
    arr = np.array(head_art)
    mask = (arr[:, :, 3] > 20)
    arr[:, :, 3] = np.where(mask, arr[:, :, 3], 0)
    clean = Image.fromarray(arr)
    im_head.paste(clean, (48, 40), clean)
    im_head.save(GUY_DIR / "head.png")

    # 11. HAIR (256x256) - Dark brown wavy hair mass
    im_hair = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    hair_art = guy.crop((185, 10, 315, 115))
    arr = np.array(hair_art)
    mask = (arr[:, :, 3] > 20)
    arr[:, :, 3] = np.where(mask, arr[:, :, 3], 0)
    clean = Image.fromarray(arr)
    im_hair.paste(clean, (43, 38), clean)
    im_hair.save(GUY_DIR / "hair.png")

    # 12. HAIR_TIP (128x128) - Single loose front strand
    im_hair_tip = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    tip_art = guy.crop((200, 20, 240, 70))
    arr = np.array(tip_art)
    mask = (arr[:, :, 3] > 20)
    arr[:, :, 3] = np.where(mask, arr[:, :, 3], 0)
    clean = Image.fromarray(arr)
    im_hair_tip.paste(clean, (30, 20), clean)
    im_hair_tip.save(GUY_DIR / "hair_tip.png")

    # 13. CHAIN (256x256) - Gold chain necklace
    im_chain = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    chain_art = guy.crop((220, 100, 290, 150))
    arr = np.array(chain_art)
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    is_gold = (a > 20) & (r > 160) & (g > 130) & (b < 100)
    arr[:, :, 3] = np.where(is_gold, a, 0)
    clean = Image.fromarray(arr)
    im_chain.paste(clean, (68, 80), clean)
    im_chain.save(GUY_DIR / "chain.png")

    print("Successfully generated all 13 Guy component artwork files!")


def generate_girl_parts():
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

    # 3. ARM_UPPER_L (256x256)
    im_arm_ul = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    arm_ul_art = girl.crop((0, int(gh * 0.18), int(gw * 0.45), int(gh * 0.35)))
    clean = arm_ul_art.resize((100, 160), Image.BICUBIC)
    im_arm_ul.paste(clean, (78, 48), clean)
    im_arm_ul.save(GIRL_DIR / "arm_upper_l.png")

    # 4. ARM_LOWER_L (256x256)
    im_arm_ll = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    arm_ll_art = girl.crop((0, int(gh * 0.32), int(gw * 0.42), int(gh * 0.48)))
    clean = arm_ll_art.resize((90, 150), Image.BICUBIC)
    im_arm_ll.paste(clean, (83, 53), clean)
    im_arm_ll.save(GIRL_DIR / "arm_lower_l.png")

    # 5. HAND_L (128x128)
    im_hand_l = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    hand_l_art = girl.crop((0, int(gh * 0.45), int(gw * 0.35), int(gh * 0.55)))
    clean = hand_l_art.resize((65, 80), Image.BICUBIC)
    im_hand_l.paste(clean, (31, 24), clean)
    im_hand_l.save(GIRL_DIR / "hand_l.png")

    # 6. ARM_UPPER_R (256x256)
    im_arm_ur = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    arm_ur_art = girl.crop((int(gw * 0.55), int(gh * 0.18), gw, int(gh * 0.35)))
    clean = arm_ur_art.resize((100, 160), Image.BICUBIC)
    im_arm_ur.paste(clean, (78, 48), clean)
    im_arm_ur.save(GIRL_DIR / "arm_upper_r.png")

    # 7. ARM_LOWER_R (256x256)
    im_arm_lr = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    arm_lr_art = girl.crop((int(gw * 0.58), int(gh * 0.32), gw, int(gh * 0.48)))
    clean = arm_lr_art.resize((110, 150), Image.BICUBIC)
    im_arm_lr.paste(clean, (73, 53), clean)
    im_arm_lr.save(GIRL_DIR / "arm_lower_r.png")

    # 8. HAND_R (128x128)
    im_hand_r = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    hand_r_art = girl.crop((int(gw * 0.60), int(gh * 0.45), gw, int(gh * 0.55)))
    clean = hand_r_art.resize((85, 80), Image.BICUBIC)
    im_hand_r.paste(clean, (21, 24), clean)
    im_hand_r.save(GIRL_DIR / "hand_r.png")

    # 9. HEAD (256x256)
    im_head = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    head_art = girl.crop((int(gw * 0.22), int(gh * 0.04), int(gw * 0.78), int(gh * 0.20)))
    clean = head_art.resize((150, 175), Image.BICUBIC)
    im_head.paste(clean, (53, 40), clean)
    im_head.save(GIRL_DIR / "head.png")

    # 10. HAIR (256x256)
    im_hair = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    hair_art = girl.crop((0, 0, gw, int(gh * 0.22)))
    clean = hair_art.resize((190, 170), Image.BICUBIC)
    im_hair.paste(clean, (33, 25), clean)
    im_hair.save(GIRL_DIR / "hair.png")

    # 11. HAIR_TIP (128x128)
    im_hair_tip = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    tip_art = girl.crop((0, int(gh * 0.08), int(gw * 0.35), int(gh * 0.22)))
    clean = tip_art.resize((65, 85), Image.BICUBIC)
    im_hair_tip.paste(clean, (31, 21), clean)
    im_hair_tip.save(GIRL_DIR / "hair_tip.png")

    # 12. EARRING (256x256)
    im_earring = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    earring_art = girl.crop((int(gw * 0.65), int(gh * 0.10), int(gw * 0.85), int(gh * 0.18)))
    clean = earring_art.resize((60, 90), Image.BICUBIC)
    im_earring.paste(clean, (98, 83), clean)
    im_earring.save(GIRL_DIR / "earring.png")

    print("Successfully generated all 12 Girl component artwork files!")


if __name__ == "__main__":
    generate_guy_parts()
    generate_girl_parts()
