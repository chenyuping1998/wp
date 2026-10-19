"""Align the newly commissioned expression paintings to each cutout head cel.

The source art is generated separately. This script only registers and in-betweens
those paintings on the existing head atlas rectangle; it draws no facial marks.
"""
from pathlib import Path
import sys
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter


def build(folder: Path, cast: str) -> None:
    out = folder / f'{cast}_cutout'
    rest = Image.open(out / 'head_2_face.png').convert('RGBA')
    laugh = Image.open(folder / f'{cast}_laugh_generated.png').convert('RGBA').resize(rest.size, Image.Resampling.LANCZOS)
    blink = Image.open(folder / f'{cast}_blink_generated.png').convert('RGBA').resize(rest.size, Image.Resampling.LANCZOS)
    w, h = rest.size
    # Preserve one head silhouette in every pose. The generated endpoint may
    # have a slightly different transparent edge; swapping that edge exposes
    # the body cutout for a frame and looks like a broken jaw or collar.
    def registered(painting):
        merged = Image.composite(painting, rest, painting.getchannel('A'))
        merged.putalpha(rest.getchannel('A'))
        return merged
    laugh = registered(laugh)
    blink = registered(blink)
    start = np.asarray(rest)
    end = np.asarray(laugh)
    gray_start = cv2.cvtColor(start[:, :, :3], cv2.COLOR_RGB2GRAY)
    gray_end = cv2.cvtColor(end[:, :, :3], cv2.COLOR_RGB2GRAY)
    forward = cv2.calcOpticalFlowFarneback(gray_start, gray_end, None, .5, 5, 31, 5, 7, 1.5, 0)
    backward = cv2.calcOpticalFlowFarneback(gray_end, gray_start, None, .5, 5, 31, 5, 7, 1.5, 0)
    xx, yy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))

    def mouth_pose(amount):
        if amount == 0:
            return rest.copy()
        if amount == 1:
            return laugh.copy()
        a = cv2.remap(start, xx - amount * forward[:, :, 0], yy - amount * forward[:, :, 1],
                      cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
        b = cv2.remap(end, xx - (1 - amount) * backward[:, :, 0],
                      yy - (1 - amount) * backward[:, :, 1], cv2.INTER_LINEAR,
                      borderMode=cv2.BORDER_CONSTANT)
        pixels = np.clip(a.astype(np.float32) * (1 - amount) + b.astype(np.float32) * amount,
                         0, 255).astype(np.uint8)
        pixels[:, :, 3] = start[:, :, 3]
        return Image.fromarray(pixels, 'RGBA')

    # Blink art supplies the closed eyes; the laugh painting supplies the mouth.
    # The broad feathered upper-face mask avoids a hard horizontal seam.
    eye_mask = Image.new('L', (w, h), 0)
    draw = ImageDraw.Draw(eye_mask)
    draw.rectangle((0, 0, w, round(h * .68)), fill=255)
    eye_mask = eye_mask.filter(ImageFilter.GaussianBlur(max(2, round(h * .035))))
    laugh_blink = Image.composite(blink, laugh, eye_mask)

    levels = {
        'rest': 0, 'talk_closed': 0,
        'inhale': .10, 'laugh_1': .20, 'half': .28,
        'laugh_2': .45, 'rising': .55,
        'laugh_3': .73, 'open': .84,
        'laugh_4': 1, 'peak': 1, 'talk_open': .90,
        'settle': .32,
    }
    for state, amount in levels.items():
        cel = mouth_pose(amount)
        cel.save(out / f'head_2_face_{state}.png')
    blink.save(out / 'head_2_face_blink.png')
    laugh_blink.save(out / 'head_2_face_peak_blink.png')
    laugh_blink.save(out / 'head_2_face_laugh_4_blink.png')
    Image.blend(mouth_pose(.73), laugh_blink, .8).save(out / 'head_2_face_laugh_3_blink.png')
    print(f'{folder.parent.parent.parent.name} {cast}: {len(levels) + 4} aligned face cels {w}x{h}')


if __name__ == '__main__':
    build(Path(sys.argv[1]), sys.argv[2])
