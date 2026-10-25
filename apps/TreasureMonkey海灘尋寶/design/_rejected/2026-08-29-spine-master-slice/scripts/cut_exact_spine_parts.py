"""Slice 12 Spine Component Textures directly from the Master Artwork tile_foreground.png for Guy.

Outputs to design/source/spine/images/:
  - legs.png (512x512)
  - torso.png (512x512)
  - arm_upper_l.png (256x256)
  - arm_lower_l.png (256x256)
  - hand_l.png (128x128)
  - arm_upper_r.png (256x256)
  - arm_lower_r.png (256x256)
  - hand_r.png (128x128)
  - head.png (256x256)
  - hair.png (256x256)
  - hair_tip.png (128x128)
  - chain.png (256x256)

Places each sliced part onto solid #00FF00 green background with 12-15px joint overlaps.
"""

import os
from pathlib import Path
from PIL import Image
import numpy as np
import scipy.ndimage

APP_ROOT = Path(__file__).resolve().parent.parent
TILE_SRC = APP_ROOT / "static/assets/sprites/hotMiamiBrand/tile_foreground.png"
OUT_DIR = APP_ROOT / "design/source/spine/images"
OUT_DIR.mkdir(parents=True, exist_ok=True)

CHROMA_GREEN = (0, 255, 0, 255)


def clean_main_component(image: Image.Image) -> Image.Image:
    """Zero out any floating stray pixels outside the main figure."""
    arr = np.array(image.convert("RGBA"))
    alpha = arr[:, :, 3] > 10
    structure = np.ones((3, 3), dtype=int)
    labeled, num_features = scipy.ndimage.label(alpha, structure=structure)
    if num_features > 1:
        sizes = scipy.ndimage.sum(alpha, labeled, range(1, num_features + 1))
        main_label = np.argmax(sizes) + 1
        mask = (labeled == main_label)
        arr[:, :, 3] = np.where(mask, arr[:, :, 3], 0)
    return Image.fromarray(arr)


def slice_master_guy():
    """Extract and slice the man (Guy) from tile_foreground.png into 12 Spine part PNGs."""
    tile = Image.open(TILE_SRC).convert("RGBA")
    w, h = tile.size

    guy_mask = Image.new("L", (w, h), 0)
    gpx = guy_mask.load()
    for y in range(h):
        edge = 528 if y < 835 else 558
        for x in range(edge):
            gpx[x, y] = 255

    guy_raw = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    guy_raw.paste(tile, (0, 0), guy_mask)
    guy_img = clean_main_component(guy_raw)

    # 1. LEGS (512x512)
    legs_crop = guy_img.crop((260, 420, 528, 910))
    legs_crop = legs_crop.resize((247, 455), Image.BICUBIC)
    im_legs = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    im_legs.paste(legs_crop, (132, 35), legs_crop)

    # 2. TORSO (512x512)
    torso_crop = guy_img.crop((260, 200, 528, 470))
    torso_crop = torso_crop.resize((266, 290), Image.BICUBIC)
    im_torso = Image.new("RGBA", (512, 512), CHROMA_GREEN)
    im_torso.paste(torso_crop, (123, 110), torso_crop)

    # 3. ARM_UPPER_L (256x256)
    arm_ul_crop = guy_img.crop((260, 210, 395, 360))
    arm_ul_crop = arm_ul_crop.resize((150, 165), Image.BICUBIC)
    im_arm_ul = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_arm_ul.paste(arm_ul_crop, (53, 45), arm_ul_crop)

    # 4. ARM_LOWER_L (256x256)
    arm_ll_crop = guy_img.crop((260, 340, 360, 480))
    arm_ll_crop = arm_ll_crop.resize((110, 154), Image.BICUBIC)
    im_arm_ll = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_arm_ll.paste(arm_ll_crop, (73, 51), arm_ll_crop)

    # 5. HAND_L (128x128)
    hand_l_crop = guy_img.crop((310, 440, 370, 510))
    hand_l_crop = hand_l_crop.resize((70, 82), Image.BICUBIC)
    im_hand_l = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    im_hand_l.paste(hand_l_crop, (29, 23), hand_l_crop)

    # 6. ARM_UPPER_R (256x256)
    arm_ur_crop = guy_img.crop((440, 210, 528, 360))
    arm_ur_crop = arm_ur_crop.resize((102, 165), Image.BICUBIC)
    im_arm_ur = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_arm_ur.paste(arm_ur_crop, (77, 45), arm_ur_crop)

    # 7. ARM_LOWER_R (256x256)
    arm_lr_crop = guy_img.crop((445, 340, 528, 480))
    arm_lr_crop = arm_lr_crop.resize((85, 154), Image.BICUBIC)
    im_arm_lr = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_arm_lr.paste(arm_lr_crop, (85, 51), arm_lr_crop)

    # 8. HAND_R (128x128)
    hand_r_crop = guy_img.crop((450, 440, 528, 510))
    hand_r_crop = hand_r_crop.resize((66, 82), Image.BICUBIC)
    im_hand_r = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    im_hand_r.paste(hand_r_crop, (31, 23), hand_r_crop)

    # 9. HEAD (256x256)
    head_crop = guy_img.crop((355, 95, 475, 235))
    head_crop = head_crop.resize((160, 185), Image.BICUBIC)
    im_head = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_head.paste(head_crop, (48, 35), head_crop)

    # 10. HAIR (256x256)
    hair_crop = guy_img.crop((355, 95, 475, 180))
    hair_crop = hair_crop.resize((160, 115), Image.BICUBIC)
    im_hair = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_hair.paste(hair_crop, (48, 35), hair_crop)

    # 11. HAIR_TIP (128x128)
    tip_crop = guy_img.crop((380, 105, 420, 155))
    tip_crop = tip_crop.resize((60, 75), Image.BICUBIC)
    im_hair_tip = Image.new("RGBA", (128, 128), CHROMA_GREEN)
    im_hair_tip.paste(tip_crop, (34, 26), tip_crop)

    # 12. CHAIN (256x256)
    chain_crop = guy_img.crop((365, 180, 465, 260))
    chain_crop = chain_crop.resize((140, 110), Image.BICUBIC)
    im_chain = Image.new("RGBA", (256, 256), CHROMA_GREEN)
    im_chain.paste(chain_crop, (58, 73), chain_crop)

    parts_dict = {
        "legs.png": im_legs,
        "torso.png": im_torso,
        "arm_upper_l.png": im_arm_ul,
        "arm_lower_l.png": im_arm_ll,
        "hand_l.png": im_hand_l,
        "arm_upper_r.png": im_arm_ur,
        "arm_lower_r.png": im_arm_lr,
        "hand_r.png": im_hand_r,
        "head.png": im_head,
        "hair.png": im_hair,
        "hair_tip.png": im_hair_tip,
        "chain.png": im_chain,
    }

    for name, img in parts_dict.items():
        out_file = OUT_DIR / name
        img.save(out_file)
        print(f"Sliced {name} from master tile_foreground.png -> {out_file}")


if __name__ == "__main__":
    slice_master_guy()
