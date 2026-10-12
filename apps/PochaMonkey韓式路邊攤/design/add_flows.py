"""Add costume flows (tails, ties, feathers...) to a cast's rig.json, the
polygon traced automatically from the piece's own pixels inside a box.
usage: add_flows.py <app> <mg|fg> <json spec list>"""
import json, sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.spatial import ConvexHull

app, cast, specs = Path(sys.argv[1]), sys.argv[2], json.loads(sys.argv[3])
src = app / 'design/source' / cast
meta = json.loads((src / 'layers.json').read_text(encoding='utf-8'))
L = {l['name']: l for l in meta['layers']}
flows = []
for s in specs:
    l = L[s['piece']]
    im = np.zeros((912, 560, 4), np.uint8)
    im[l['y']:l['y'] + l['h'], l['x']:l['x'] + l['w']] = np.asarray(Image.open(src / l['file']).convert('RGBA'))
    x0, y0, x1, y1 = s['box']
    m = np.zeros((912, 560), bool)
    sub = im[y0:y1, x0:x1]
    a = sub[..., 3] > 40
    if 'color' in s:
        c = np.array(s['color'])
        near = np.abs(sub[..., :3].astype(int) - c).sum(-1) <= s.get('tol', 70)
        # the colour and its ink outline
        sel = ndimage.binary_dilation(near & a, iterations=4) & a
    else:
        sel = a
    m[y0:y1, x0:x1] = sel
    lab, n = ndimage.label(m)
    if n > 1:
        sizes = ndimage.sum(m, lab, range(1, n + 1))
        m = lab == (int(sizes.argmax()) + 1)
    ys, xs = np.nonzero(m)
    pts = np.stack([xs, ys], 1)
    hull = ConvexHull(pts)
    poly = [[int(pts[v][0]), int(pts[v][1])] for v in hull.vertices]
    f = {
        'name': s['name'], 'parent': s.get('parent', 'torso'), 'piece': s['piece'],
        'at': s['at'], 'dir': s['dir'], 'poly': poly,
        'fadeFrom': s.get('fadeFrom', 6), 'fadeOver': s.get('fadeOver', 40), 'margin': s.get('margin', 6),
        'physics': s.get('physics', {'inertia': 0.2, 'strength': 350, 'damping': 0.9}),
        'flutter': s.get('flutter', {'amp': 1.0, 'phase': 0.5, 'base': 2.5}),
    }
    if s.get('links'):
        f['links'] = s['links']
    if s.get('share'):
        f['share'] = s['share']
    flows.append(f)
    print(cast, s['name'], 'px', int(m.sum()), 'bbox', [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())])
for p in (app / 'design/cast_cut' / f'{cast}_rig.json', src / 'rig.json'):
    r = json.loads(p.read_text(encoding='utf-8'))
    r['flow'] = flows
    p.write_text(json.dumps(r, indent=1), encoding='utf-8')
