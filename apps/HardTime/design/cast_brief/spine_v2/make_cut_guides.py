"""Cut guides for the Spine v2 layer brief: each figure's current full.png with
joints, cut lines and the layer names drawn on (README.md in this folder)."""
import json
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
LAYERS = os.path.join(HERE, "../../../static/assets/castLayers")
FONT = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", 30)
SMALL = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", 24)

# (label, point) joints; cuts as (label, p0, p1); names as (text, point)
FIGS = {
    "prisoner": dict(src="prisoner_crossed", joints=[
        ("neck", (541, 405)), ("shoulder_r", (334, 452)), ("shoulder_l", (749, 457)),
        ("elbow_r", (281, 704)), ("elbow_l", (770, 704)), ("hip_r", (440, 1000)), ("hip_l", (625, 1000)),
        ("knee_r", (430, 1370)), ("knee_l", (668, 1370)), ("ankle_r", (420, 1690)), ("ankle_l", (705, 1690)),
        ("towel", (705, 430))],
        cuts=[("領口", (470, 410), (612, 410)), ("外套下襬", (330, 960), (730, 960)),
              ("膝", (350, 1370), (510, 1370)), ("膝", (580, 1370), (750, 1370)),
              ("腳踝", (340, 1690), (500, 1690)), ("腳踝", (630, 1690), (790, 1690))],
        names=[("head", (560, 260)), ("torso", (420, 520)), ("forearm_over", (470, 610)), ("forearm_under", (650, 690)),
               ("upper_arm_r", (230, 560)), ("upper_arm_l", (790, 560)), ("towel", (720, 760)), ("pelvis", (470, 1010)),
               ("thigh_r", (300, 1200)), ("thigh_l", (720, 1200)), ("shin_r", (300, 1530)), ("shin_l", (760, 1530)),
               ("shoe_r", (280, 1740)), ("shoe_l", (800, 1740))]),
    "warden": dict(src="warden", joints=[
        ("neck", (495, 395)), ("shoulder_r", (363, 449)), ("shoulder_l", (686, 479)),
        ("elbow_r", (236, 610)), ("elbow_l", (781, 772)), ("wrist_l", (795, 1000)), ("hand_r", (317, 392)),
        ("hip_r", (395, 1000)), ("hip_l", (585, 1000)), ("knee_r", (380, 1410)), ("knee_l", (632, 1410)),
        ("ankle_r", (372, 1775)), ("ankle_l", (668, 1775)), ("whistle", (490, 545)), ("cord", (628, 420)), ("keys", (300, 838))],
        cuts=[("領口", (420, 400), (570, 400)), ("皮帶下緣", (300, 835), (680, 835)),
              ("膝", (300, 1410), (460, 1410)), ("膝", (550, 1410), (720, 1410)),
              ("腳踝", (290, 1775), (450, 1775)), ("腳踝", (590, 1775), (750, 1775)),
              ("手腕", (740, 1000), (850, 1000))],
        names=[("head(+cap)", (420, 180)), ("torso", (330, 690)), ("upper_arm_r(後)", (130, 470)), ("forearm_r(前)", (170, 700)),
               ("baton", (120, 300)), ("upper_arm_l", (800, 600)), ("forearm_l", (850, 880)), ("hand_l", (840, 1070)),
               ("whistle", (520, 640)), ("radio_cord", (660, 680)), ("keys", (190, 920)), ("pelvis", (470, 900)),
               ("thigh_r", (250, 1220)), ("thigh_l", (700, 1220)), ("shin_r", (250, 1600)), ("shin_l", (740, 1600)),
               ("shoe_r", (230, 1830)), ("shoe_l", (800, 1830))]),
}

for who, f in FIGS.items():
    # Recompose from the layers at their crops: warden/full.png is a cropped
    # 661x1809 image, not the 1024x2048 canvas the joints are measured in.
    man = json.load(open(os.path.join(LAYERS, f["src"], "layers.json")))
    im = Image.new("RGBA", tuple(man["size"]), (0, 0, 0, 0))
    for name in man["order"]:
        L = next(l for l in man["layers"] if l["name"] == name)
        part = Image.open(os.path.join(LAYERS, f["src"], L["texture"])).convert("RGBA")
        cx, cy = (L.get("crop") or [0, 0])[:2]
        im.alpha_composite(part, (cx, cy))
    im.save(os.path.join(HERE, f"full_{who}.png"))  # the base to re-cut, 1024x2048
    bg = Image.new("RGBA", im.size, (225, 222, 216, 255))
    bg.alpha_composite(im)
    veil = Image.new("RGBA", im.size, (255, 255, 255, 90))
    bg.alpha_composite(veil)
    d = ImageDraw.Draw(bg)
    for label, p0, p1 in f["cuts"]:
        x0, y0 = p0
        x1, y1 = p1
        n = 14
        for i in range(n):
            if i % 2 == 0:
                a = (x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n)
                b = (x0 + (x1 - x0) * (i + 1) / n, y0 + (y1 - y0) * (i + 1) / n)
                d.line([a, b], fill=(220, 30, 30, 255), width=5)
        d.text((x1 + 8, y1 - 18), label, fill=(200, 20, 20, 255), font=SMALL)
    for label, (x, y) in f["joints"]:
        d.ellipse([x - 11, y - 11, x + 11, y + 11], fill=(30, 110, 220, 255), outline=(255, 255, 255, 255), width=3)
        d.text((x + 14, y - 14), label, fill=(20, 70, 170, 255), font=SMALL)
    for text, (x, y) in f["names"]:
        w = d.textlength(text, font=FONT)
        d.rectangle([x - 6, y - 4, x + w + 6, y + 38], fill=(255, 245, 160, 230))
        d.text((x, y), text, fill=(20, 20, 20, 255), font=FONT)
    bg.convert("RGB").save(os.path.join(HERE, f"cut_guide_{who}.png"))
    print(who, "ok")
