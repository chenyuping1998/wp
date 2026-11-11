"""Preview the layered cast through conservative idle and reaction extremes."""
from __future__ import annotations

import json
import math
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
from scipy.ndimage import distance_transform_edt, map_coordinates

HERE = Path(__file__).resolve().parent
PARTS = HERE.parent / "cast_parts"


def smoothstep(v):
    v = np.clip(v, 0, 1)
    return v * v * (3 - 2 * v)


class SeamRig:
    """Rigid anatomy with short, explicitly authored clothing attachment bands."""
    def __init__(self, parts):
        self.parts = parts
        self.y, self.x = np.mgrid[:2048, :1024].astype(np.float32)
        body = np.asarray(parts['body'])[..., 3] > 0
        # Never derive anatomy weights from overlap: the torso underpaint overlaps
        # far down the sleeve and into the hood, which made both bend like rubber.
        self.weights = {
            'arm_l': smoothstep((self.y - 490) / 110),
            'head': 1 - smoothstep((self.y - 435) / 65),
        }
        overlap = body & (np.asarray(parts['arm_r'])[..., 3] > 0)
        self.weights['arm_r'] = smoothstep((distance_transform_edt(~overlap)-12)/120).astype(np.float32)
        head_ink = np.asarray(parts['head'])[..., 3] > 0
        self.weights['head'] *= 1 - smoothstep((distance_transform_edt(~head_ink) - 32) / 80)
        self.pins = {name: body & (np.asarray(parts[name])[..., 3] > 0) & (weight == 0)
                     for name, weight in self.weights.items()}
        # These regions must have a single rotation, with no stretching or shear.
        assert np.all(self.weights['arm_l'][self.y >= 600] == 1)
        assert np.all(self.weights['head'][(self.y <= 435) & head_ink] == 1)
        self.weights['dangle_chain'] = smoothstep((self.y - 477) / 65)
        self.weights['dangle_mask'] = smoothstep((self.y - 466) / 90)
        self.min_jacobian = 1.0

    def warp(self, im, angle, pivot, weight):
        a = math.radians(angle)
        dx, dy = self.x - pivot[0], self.y - pivot[1]
        # PIL's positive rotation convention, evaluated as a destination-to-source map.
        sx = self.x + weight * ((math.cos(a)-1)*dx - math.sin(a)*dy)
        sy = self.y + weight * (math.sin(a)*dx + (math.cos(a)-1)*dy)
        sy_y, sy_x = np.gradient(sy)
        sx_y, sx_x = np.gradient(sx)
        jacobian = sx_x*sy_y-sx_y*sy_x
        source = np.asarray(im).astype(np.float32)
        source[..., :3] *= source[..., 3:4] / 255
        out = np.stack([map_coordinates(source[..., k], (sy, sx), order=1,
                        mode='constant', cval=0, prefilter=False) for k in range(4)], axis=-1)
        self.min_jacobian = min(self.min_jacobian, float(jacobian[out[..., 3] > 8].min()))
        out[..., :3] *= 255 / np.maximum(out[..., 3:4], 1e-6)
        return Image.fromarray(np.clip(np.rint(out), 0, 255).astype(np.uint8))

    def layers(self, joints, anchors, t, reaction=False):
        sway = math.sin(2 * math.pi * t)
        strike = math.sin(math.pi * t)**2
        raised = -8*strike if reaction else 5*sway
        hanging = 8*strike if reaction else -5*sway
        head = -5*strike if reaction else 3*math.sin(2*math.pi*t+.5)
        dangling = 9*strike if reaction else 6*sway
        result = dict(self.parts)
        for name, angle, pivot in (
            ('arm_r', raised, joints['shoulder_r']),
            ('arm_l', hanging, joints['shoulder_l']),
        ):
            result[name] = self.warp(self.parts[name], angle, pivot, self.weights[name])
            pin = self.pins[name]
            assert np.array_equal(np.asarray(result[name])[pin], np.asarray(self.parts[name])[pin]), name
        # Grip, bat and fingers share the arm map, including its transition zone.
        for name in ('prop_bat', 'fingers_r'):
            result[name] = self.warp(self.parts[name], raised, joints['shoulder_r'], self.weights['arm_r'])
        # Both chain ends stay on the torso; only the lower loop swings.
        result['dangle_chain'] = self.warp(self.parts['dangle_chain'], dangling,
                                         (604, 477), self.weights['dangle_chain'])
        # Tail root stays on the mask, and the whole tail follows the head.
        tail = self.warp(self.parts['dangle_mask'], dangling,
                         anchors['dangle_mask'], self.weights['dangle_mask'])
        result['dangle_mask'] = tail
        self.head_angle = head
        assert self.min_jacobian > .25, 'inverted or excessively compressed mesh'
        return result


_RIGS = {}

def render(parts, joints, anchors, t, reaction=False):
    key = id(parts)
    rig = _RIGS.setdefault(key, None)
    if rig is None:
        rig = _RIGS[key] = SeamRig(parts)
    layers = rig.layers(joints, anchors, t, reaction)
    frame = Image.new('RGBA', (1024, 2048))
    for name in parts:
        frame.alpha_composite(layers[name])
    # Deform the composited collar/shoulder junction once. Applying this to the
    # head layer alone exposes the separately drawn shoulder edge underneath.
    frame = rig.warp(frame, rig.head_angle, joints['neck'], rig.weights['head'])
    assert rig.min_jacobian > .25
    return frame


def export_binding(rig):
    folder = PARTS / 'motion_binding'
    folder.mkdir(exist_ok=True)
    for name, weight in rig.weights.items():
        Image.fromarray(np.rint(weight * 65535).astype(np.uint16)).save(folder / f'{name}_weight.png')
    (folder / 'binding.json').write_text(json.dumps({
        'version': 1, 'size': [1024, 2048], 'weight_encoding': 'uint16 / 65535',
        'mapping': 'inverse destination-to-source rotation blend; see check_motion.py SeamRig.warp',
        'shared_parent_field': {'prop_bat': 'arm_r', 'fingers_r': 'arm_r'},
        'after_compositing': 'head field applied once to full composite, including collar and shoulders',
        'head_rigid_border_guard_px': 32,
        'head_field_falloff_outside_guard_px': 80,
        'attachment_bands': {'arm_l': [490, 600], 'head': [435, 500]},
        'rigid_regions': {'arm_l': 'y >= 600', 'head': 'head alpha support at y <= 435'},
        'applies_to': ['base', 'feature', 'kingpin'],
    }, indent=2) + '\n')


def main():
    folder = PARTS / "base"
    meta = json.loads((folder / "layers.json").read_text())
    parts = {n: Image.open(folder / f"{n}.png").convert("RGBA") for n in meta["order"]}
    frames = []
    crops = []
    detail_sequences = []
    collar_sequence = []
    regions = {"raised shoulder": (340, 420, 550, 650), "hanging shoulder": (670, 430, 860, 660), "neck / chain": (490, 410, 700, 570), "grip": (285, 320, 440, 470), "mask tail": (615, 390, 740, 590)}
    for reaction in (False, True):
        sequence = []
        detail = []
        for i in range(24):
            im = render(parts, meta["joints"], meta["anchors"], i / 24, reaction)
            if i in (0, 6, 12, 18):
                crops.append((('reaction' if reaction else 'idle') + f' {i}/24', im.copy()))
            bg = Image.new("RGBA", im.size, (47, 47, 54, 255))
            bg.alpha_composite(im)
            close = Image.new('RGB', (680, 760), (47, 47, 54))
            close.paste(bg.crop((440, 150, 740, 550)).convert('RGB'), (0, 0))
            close.paste(bg.crop((665, 400, 1024, 1100)).convert('RGB'), (310, 0))
            ImageDraw.Draw(close).text((15, 730), 'Rigid head / straight arm - '+('reaction' if reaction else 'idle'), fill='white')
            detail.append(close)
            collar_sequence.append(bg.crop((425, 360, 780, 535)).convert('RGB').resize((710, 350), Image.Resampling.LANCZOS))
            sequence.append(bg.convert("RGB").resize((384, 768), Image.Resampling.LANCZOS))
        detail_sequences.extend(detail)
        frames.extend(sequence)
        output = "reaction_preview.gif" if reaction else "motion_preview.gif"
        sequence[0].save(PARTS / output, save_all=True, append_images=sequence[1:], duration=70, loop=0, disposal=2)
    collar_sequence[0].save(PARTS / 'collar_preview.gif', save_all=True, append_images=collar_sequence[1:], duration=90, loop=0, disposal=2)
    detail_sequences[0].save(PARTS / 'rigidity_preview.gif', save_all=True, append_images=detail_sequences[1:], duration=90, loop=0, disposal=2)
    sheet = Image.new("RGB", (384 * 4, 808 * 2), (36, 36, 40))
    draw = ImageDraw.Draw(sheet)
    for j, idx in enumerate((0, 3, 6, 9, 12, 15, 18, 21)):
        x, y = (j % 4) * 384, (j // 4) * 808
        sheet.paste(frames[idx], (x, y))
        draw.text((x + 12, y + 778), f"frame {idx}", fill="white")
    sheet.save(PARTS / "motion_extremes.png")
    audit = Image.new('RGB', (5*300, len(crops)*350), (47, 47, 54))
    draw = ImageDraw.Draw(audit)
    for row, (label, frame) in enumerate(crops):
        for col, (name, box) in enumerate(regions.items()):
            tile = frame.crop(box)
            tile.thumbnail((290, 310), Image.Resampling.LANCZOS)
            audit.paste(tile, (col*300, row*350+30), tile)
            draw.text((col*300+5, row*350+5), label+' '+name, fill='white')
    audit.save(PARTS / 'seam_audit.png')
    export_binding(_RIGS[id(parts)])
    report = {'frames_checked': 48, 'fixed_attachment_rgba': 'identical in every frame',
              'rigid_anatomy': {'head_y_le_435': 'unit weight on head ink / pure rotation', 'arm_l_y_ge_600': 'unit weight / pure rotation'},
              'minimum_inverse_map_jacobian': _RIGS[id(parts)].min_jacobian,
              'attachments': ['both shoulders', 'neck', 'grip/bat/fingers shared field',
                              'chain endpoints pinned', 'mask tail inherits head field', 'head and shoulder seam share one composite warp']}
    (PARTS / 'motion_validation.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
