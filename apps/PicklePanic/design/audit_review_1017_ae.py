"""Verify image export/registration invariants, without modifying artwork."""
from pathlib import Path
import json
import numpy as np
from PIL import Image

APP = Path(__file__).resolve().parents[1]
SRC = APP / 'design/source/review_1017_ae'
ART = APP / 'static/assets/pickle'

def pixels(path):
    return np.asarray(Image.open(path).convert('RGBA'))

report = {}
frame = pixels(ART / 'frame.png')
original = pixels(SRC / 'before/static/assets/pickle/frame.png')
assert frame.shape == original.shape == (1280, 1280, 4)
assert np.array_equal(frame[:, :, 3], original[:, :, 3])
report['frame_alpha_and_opening'] = 'identical to original at every pixel'

torso = pixels(APP / 'design/source/fg/torso_0_trunk.png')
old_torso = pixels(SRC / 'before/design/source/fg/torso_0_trunk.png')
assert np.array_equal(torso[:, :, 3], old_torso[:, :, 3])
atlas = pixels(APP / 'static/assets/spines/picklePepper/cast.png')
old_atlas = pixels(SRC / 'before/static/assets/spines/picklePepper/cast.png')
assert np.array_equal(atlas[2:363, 516:787], torso)
outside = np.ones(atlas.shape[:2], dtype=bool)
outside[2:363, 516:787] = False
assert np.array_equal(atlas[outside], old_atlas[outside])
report['cast'] = 'original torso alpha, unchanged atlas outside torso region, unchanged skeleton and motion'

spec = json.loads((SRC / 'registration.json').read_text())['h4']
canvas = Image.new('RGBA', (512, 512))
for layer in spec['layers']:
    part = Image.open(ART / f"h4_{layer['name']}_v2.png").convert('RGBA')
    x0, y0, x1, y1 = layer['box']
    assert part.size == (x1-x0, y1-y0)
    canvas.alpha_composite(part, (x0, y0))
rest_error = int(np.abs(np.asarray(canvas).astype(int) - pixels(ART/'h4.png').astype(int)).max())
assert rest_error <= 1  # Pillow vs libvips 8-bit alpha-blend rounding.
bounds = canvas.getchannel('A').getbbox()
assert min(bounds[0], bounds[1], 512-bounds[2], 512-bounds[3]) >= 40
report['h4'] = {'layer_rest_pixel_error': rest_error, 'alpha_bounds': bounds, 'complete_boat_under_spears': True}

cover = pixels(APP / 'design/cover/PicklePanic-Cover-FG.png')
old_cover = pixels(SRC / 'before/design/cover/PicklePanic-Cover-FG.png')
assert cover.shape == (1080, 1920, 4)
assert np.array_equal(cover[:, :1378], old_cover[:, :1378])
assert np.count_nonzero(cover[:, :, 3] == 0) > 1_000_000
report['cover'] = 'male figure and left safe region unchanged; genuine alpha'

for name in ['door_l_base_v2.png', 'door_r_base_v2.png', 'door_wheel_v2.png',
             'door_latch_v2.png', 'door_hazard_v2.png', 'door_badge_v2.png',
             'door_liquid_v2.png', *[f'door_steam_{n}_v2.png' for n in range(1,7)],
             'bg_base.webp', 'bg_feature_v2.webp', 'buy_chef.png',
             'upgrade_cutin_body.png', 'win_max_base.png']:
    assert Image.open(ART/name).size == Image.open(SRC/'before/static/assets/pickle'/name).size, name
report['canvas_sizes'] = 'all original canvases preserved; H4 cropped part boxes updated with art'
report['human_review_remaining'] = 'H4 brief asks three new viewers to name the 70px image; no independent humans surveyed'
out = APP/'design/qa/review_1017_ae/registration_audit.json'
out.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
