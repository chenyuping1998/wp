"""Register three native replacement layers, preserving the existing five layers.

Art comes from built-in imagegen; only alpha cleanup, palette reduction and
measured affine placement happen here. Existing delivery is backed up once.
"""
import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter1d, map_coordinates

from build_street_cast import D, KIT, SIZE, install, register

OUT = D / '_incoming/street_cast/mg_rearm'
MG = D / '_incoming/street_cast/mg'
BACKUP = D / '_legacy_assets/pre_mg_rearm'
CHANGED = ('arm_r', 'prop_bat', 'fingers_r')


def arm():
    im = Image.open(OUT/'source/arm_r.png').convert('RGBA')
    # Measured native shoulder centre, elbow crease and palm/grip centre.
    source = np.array([[1100,270,1],[470,930,1],[800,400,1]], float)
    target = np.array([[410,535,1],[305,770,1],[395,615,1]], float)
    transform = np.linalg.solve(source, target).T
    inverse = np.linalg.inv(transform)
    # Palette reduction removes the native fill's unwanted gradual shading.
    a = im.getchannel('A')
    palette = Image.new('P',(1,1))
    colours = ['121212','3A3D42','55585D','9A9CA0','6B3E26','A56739','D79551']
    values = [int(c[i:i+2],16) for c in colours for i in (0,2,4)]
    palette.putpalette(values+[0]*(768-len(values)))
    im = im.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA')
    im.putalpha(a)
    placed = im.transform(SIZE,Image.Transform.AFFINE,tuple(inverse[:2].ravel()),Image.Resampling.BICUBIC)
    # The native sleeve is much longer than this folded pose. Restore sleeve
    # width after registration, without moving its measured centre line.
    pixels = np.asarray(placed)
    centres = np.zeros(SIZE[1])
    for y in range(SIZE[1]):
        xs = np.flatnonzero(pixels[y,:,3] > 20)
        if len(xs):
            centres[y]=(xs[0]+xs[-1])/2
    valid=np.flatnonzero(centres)
    centres=np.interp(np.arange(SIZE[1]),valid,centres[valid])
    centres=gaussian_filter1d(centres,3)
    yy,xx=np.indices((SIZE[1],SIZE[0]),dtype=float)
    sx=(xx-centres[:,None])/1.7+centres[:,None]
    widened=np.stack([map_coordinates(pixels[:,:,c],[yy,sx],order=1,mode='constant') for c in range(4)],axis=-1)
    return Image.fromarray(widened.astype('uint8'))


def strip_inner_rim(layer, *under):
    """Drop sticker-white rim pixels that sit over another layer (2026-10-16).
    The brief keeps the white border only on outlines that face the background;
    the regenerated bat carried it all round, so its knob and the edge lying on
    the hoodie read as a pasted seam. Pixels are removed, never repainted: the
    layer's own ink outline then meets the sleeve directly."""
    a = np.asarray(layer).copy()
    cover = np.zeros(a.shape[:2], bool)
    for u in under:
        cover |= np.asarray(u)[..., 3] > 128
    rgb = a[..., :3].astype(int)
    white = (rgb.min(-1) >= 215) & (rgb.max(-1) - rgb.min(-1) <= 22)
    hit = white & cover & (a[..., 3] > 0)
    a[hit, 3] = 0
    return Image.fromarray(a), int(hit.sum())


def build():
    if not BACKUP.exists():
        shutil.copytree(MG,BACKUP/'delivery')
        for mode in ('base','feature','kingpin'):
            shutil.copytree(D.parent/f'static/assets/castLayers/turf/{mode}',BACKUP/mode)
    baseline = BACKUP/'delivery'
    spec = json.loads((baseline/'layers.json').read_text())
    spec['joints'].update(shoulder_r=[410,535],elbow_r=[305,770],wrist_r=[395,615])
    spec['anchors']['prop_bat']=[395,615]
    spec['provenance'] += ' Three MG carrying-arm layers replaced by native imagegen 2026-10-16; exact prompts and source images in mg_rearm/.'
    images = {name:Image.open(baseline/f'{name}.png').convert('RGBA') for name in spec['order']}
    images['arm_r']=arm()
    images['prop_bat']=register(OUT/'source/prop_bat.png',(150,210,447,710))
    images['fingers_r']=register(OUT/'source/fingers_r.png',(350,568,444,658))
    images['prop_bat'],n_bat=strip_inner_rim(images['prop_bat'],images['body'],images['arm_r'])
    images['fingers_r'],n_fing=strip_inner_rim(images['fingers_r'],images['prop_bat'],images['arm_r'])
    print(f'inner white rim removed: prop_bat {n_bat}px, fingers_r {n_fing}px')
    full=Image.new('RGBA',SIZE)
    for name in spec['order']:
        images[name].save(OUT/f'{name}.png',optimize=True)
        full.alpha_composite(images[name])
    full.save(OUT/'full.png',optimize=True)
    (OUT/'layers.json').write_text(json.dumps(spec,indent=2)+'\n')
    # No permissive thresholds: the existing delivery checker is authoritative.
    subprocess.run([sys.executable,str(KIT/'check_layered_art.py'),str(OUT)],check=True)
    subprocess.run([sys.executable,str(KIT/'build_layered_rig.py'),str(OUT)],check=True)
    for name in spec['order']:
        if name not in CHANGED:
            assert np.array_equal(np.asarray(images[name]),np.asarray(Image.open(baseline/f'{name}.png').convert('RGBA'))),name
    return OUT,json.loads((OUT/'layers.manifest.json').read_text())


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--install',action='store_true')
    args=ap.parse_args()
    delivery,manifest=build()
    if args.install:
        install('mg',delivery,manifest)
        # Keep the brand compositor and the standard delivery at the same pose.
        for path in delivery.iterdir():
            if path.is_file() and path.suffix in ('.png','.json'):
                shutil.copy2(path,MG/path.name)
        print('MG rearm installed; five existing layer pixels preserved')


if __name__=='__main__':
    main()
