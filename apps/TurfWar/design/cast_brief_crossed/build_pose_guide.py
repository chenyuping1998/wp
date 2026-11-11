"""Turf War crossed-arms pose guide (2026-10-20), drawn to the game's own
proportions instead of brief.py's scaled half-body reference (whose torso and
shoulders came out ~2x too wide when stretched to full height).

Canvas 1024x2048, head top 178, feet 1673 (= current figure_box), so the new
cast lands on the same ground line. 1 head = 272 px -> 5.5 heads tall.
Joints and skeleton lines only, plus head-unit ticks; no outlines.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json

D = Path(__file__).resolve().parent
TOP, FEET = 178, 1673
HEAD = (FEET - TOP) / 5.5
# x for a figure in 3/4 view turned toward screen-LEFT (the board is left of him)
J = {
    'head_top': (500, TOP), 'chin': (492, 450), 'neck': (505, 478),
    'shoulder_r': (318, 528), 'shoulder_l': (700, 540),
    'chest': (510, 620),
    'elbow_r': (262, 770), 'wrist_r': (640, 712),
    'elbow_l': (768, 784), 'wrist_l': (392, 700),
    'waist': (512, 880), 'hips': (512, 960),
    'knee_r': (432, 1330), 'knee_l': (600, 1330),
    'ankle_r': (410, 1630), 'ankle_l': (640, 1630),
}
BONES = [('head_top', 'neck'), ('neck', 'chest'), ('chest', 'waist'), ('waist', 'hips'),
         ('chest', 'shoulder_r'), ('shoulder_r', 'elbow_r'), ('elbow_r', 'wrist_r'),
         ('chest', 'shoulder_l'), ('shoulder_l', 'elbow_l'), ('elbow_l', 'wrist_l'),
         ('hips', 'knee_r'), ('knee_r', 'ankle_r'), ('hips', 'knee_l'), ('knee_l', 'ankle_l')]
COL = {'r': (245, 137, 61), 'l': (90, 200, 120)}

def font(n):
    for p in ['/System/Library/Fonts/PingFang.ttc', '/System/Library/Fonts/STHeiti Medium.ttc']:
        try: return ImageFont.truetype(p, n)
        except OSError: pass
    return ImageFont.load_default()

def guide(who, extra, out):
    im = Image.new('RGB', (1024, 2048), (34, 34, 40)); d = ImageDraw.Draw(im)
    f, fs = font(30), font(24)
    for k in range(7):
        y = TOP + k * HEAD
        d.line((0, y, 60, y), fill=(120, 120, 130), width=2); d.text((8, y + 4), f'{k}', fill=(150, 150, 160), font=fs)
    d.line((0, TOP, 1024, TOP), fill=(200, 80, 80), width=2); d.text((70, TOP - 34), f'頭頂 y={TOP}', fill=(220, 100, 100), font=fs)
    d.line((0, FEET, 1024, FEET), fill=(200, 80, 80), width=2); d.text((70, FEET + 6), f'腳底 y={FEET}', fill=(220, 100, 100), font=fs)
    for x in (150, 874):
        d.line((x, 0, x, 2048), fill=(90, 90, 100), width=1)
    d.text((152, 1720), '← 手、道具不超出這兩條線（畫布邊 150px）→', fill=(150, 150, 160), font=fs)
    # head ellipse: proportion block only (1 head tall, 0.8 head wide)
    cx = J['head_top'][0] - 8
    d.ellipse((cx - HEAD * 0.42, TOP, cx + HEAD * 0.42, TOP + HEAD), outline=(110, 150, 230), width=3)
    for a, b in BONES:
        side = a[-1] if a[-2] == '_' else (b[-1] if b[-2] == '_' else None)
        d.line(J[a] + J[b], fill=COL.get(side, (110, 150, 230)), width=6)
    for k, p in J.items():
        d.ellipse((p[0] - 9, p[1] - 9, p[0] + 9, p[1] + 9), fill='white')
        d.text((p[0] + 14, p[1] - 14), k, fill='white', font=fs)
    for k, p, label in extra:
        d.ellipse((p[0] - 12, p[1] - 12, p[0] + 12, p[1] + 12), outline=(250, 210, 80), width=4)
        d.text((p[0] + 16, p[1] - 14), label, fill=(250, 210, 80), font=fs)
    d.text((20, 20), f'Turf War {who.upper()}：雙臂交叉、3/4 側身朝畫面左（盤面在他左邊）', fill='white', font=f)
    d.text((20, 60), '橘＝角色自己的右手 arm_r（畫面左） 綠＝自己的左手 arm_l（畫面右，前臂疊在上面）', fill='white', font=fs)
    d.text((20, 92), f'5.5 頭身：1 頭 = {HEAD:.0f}px（左邊刻度）；肩寬約 1.4 頭；腿長約 2.6 頭', fill='white', font=fs)
    im.save(out)
    return {k: list(v) for k, v in J.items()}

for who, extra in {
    'mg': [('prop_bat', (238, 330), 'prop_bat 棒頭（球棒斜背在背後，從畫面左肩後露出）'),
           ('dangle_mask', (590, 430), 'dangle_mask 面罩結尾')],
    'fg': [('prop_cigar', (420, 395), 'prop_cigar 雪茄（嘴角，朝畫面左）'),
           ('dangle_smoke', (380, 330), 'dangle_smoke 煙')],
}.items():
    joints = guide(who, extra, D / who / 'pose_guide_turf.png')
    joints.update({k: list(p) for k, p, _ in extra})
    (D / who / 'joints_turf.json').write_text(json.dumps(joints, indent=1))
print('ok')
