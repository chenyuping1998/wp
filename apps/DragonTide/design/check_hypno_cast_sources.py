#!/usr/bin/env python3
"""Check the stand34 source contract; do not change or clean artwork."""
from pathlib import Path
import argparse
import hashlib
import json
from PIL import Image

REQUIRED = (
    'tail_3 tail_2 tail_1 coat_tail_l coat_tail_r arm_l_upper arm_l_lower '
    'hand_l_hip hand_l_point hand_l_open leg_l_upper leg_l_lower foot_l '
    'pelvis leg_r_upper leg_r_lower foot_r neck torso head_idle head_blink '
    'head_spiral head_grin head_annoyed hat glasses arm_r_upper arm_r_lower '
    'hand_r_pinch hand_r_open hand_r_grip hand_r_hatheld'
).split()


def check(root, output, folder='raw_layers'):
    targets_path = root / 'layer-targets.json'
    targets = json.loads(targets_path.read_text()) if targets_path.exists() else {}
    registration=root/'registration.json'
    if folder=='layers' and registration.exists():
        targets={name:entry['final_bbox'] for name,entry in json.loads(registration.read_text())['transforms'].items()}
    entries = {}
    for name in REQUIRED:
        path = root / folder / f'{name}.png'
        errors = []
        entry = {'file': str(path), 'errors': errors}
        entries[name] = entry
        if not path.exists():
            errors.append('missing required source')
            continue
        entry['sha256'] = hashlib.sha256(path.read_bytes()).hexdigest()
        with Image.open(path) as image:
            entry['size'] = list(image.size)
            entry['mode'] = image.mode
            if image.size != (1024, 1536):
                errors.append('canvas is not 1024x1536')
            if image.mode != 'RGBA':
                errors.append('genuine RGBA required')
                continue
            alpha = image.getchannel('A')
            histogram = alpha.histogram()
            entry['alpha_extrema'] = list(alpha.getextrema())
            entry['fully_transparent_pixels'] = histogram[0]
            # All source parts have generous margins; no painted pixels belong
            # in these four corner samples, even for the largest attachment.
            corners = [(x, y) for x in [0, 15, image.width-16, image.width-1]
                       for y in [0, 15, image.height-16, image.height-1]]
            entry['max_corner_alpha'] = max(alpha.getpixel(p) for p in corners)
            if entry['max_corner_alpha'] > 0:
                errors.append('nontransparent corner pixels / background residue')
            if histogram[0] < image.width * image.height * .5:
                errors.append('isolated part lacks the expected clear empty canvas')
            bbox = alpha.point(lambda value: 255 if value > 128 else 0).getbbox()
            entry['opaque_bbox'] = list(bbox) if bbox else None
            target = targets.get(name, targets.get('head_idle') if name.startswith('head_') else None)
            if bbox and target:
                drift = max(abs(a-b) for a, b in zip(bbox, target))
                entry['target_bbox'] = target
                entry['max_bbox_drift_px'] = drift
                if drift > 32:
                    errors.append('position or scale differs from master; registration required')
            if name.startswith('hand_') and name != 'hand_r_hatheld':
                # Hands may contain brown skin only; cuffs belong to forearms.
                cream = sum(1 for r, g, b, a in image.getdata()
                            if a > 128 and r > 180 and g > 160 and b > 110)
                entry['cream_pixels'] = cream
                if cream > 32:
                    errors.append('possible cuff or foreign light-colored pixels in hand')
    failures = sum(bool(item['errors']) for item in entries.values())
    result = {'status': 'FAIL' if failures else 'SOURCE_CHECKS_PASS_VISUAL_REVIEW_STILL_REQUIRED',
              'required': len(REQUIRED), 'failed_layers': failures,
              'scope': 'source contract only; no rig, motion or gameplay approval',
              'layers': entries}
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
    print(f"{result['status']}: {len(REQUIRED)} required, {failures} layers need repair; {output}")
    return failures


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('root', type=Path)
    parser.add_argument('--out', type=Path)
    parser.add_argument('--folder', default='raw_layers', choices=['raw_layers','layers'])
    args = parser.parse_args()
    destination = args.out or args.root / 'source-validation.json'
    raise SystemExit(1 if check(args.root, destination,args.folder) else 0)
