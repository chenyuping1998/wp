"""Re-render only the reel stops and the blade cues (2026-11-01).

build_sampled_audio.py renders every cue, the music included, and needs
imageio-ffmpeg for the MP3 loops. These seven cues read only WAV/OGG samples,
so they can be re-rendered on their own without touching the music. Licence
rows for the seven outputs are replaced with the sources they now use.

    python design/rebuild_audible_cues.py
"""
import importlib, json, sys, types
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
try:
    import imageio_ffmpeg  # noqa: F401
except ImportError:  # only the MP3 path uses it, and no cue here is an MP3
    sys.modules['imageio_ffmpeg'] = types.SimpleNamespace(get_ffmpeg_exe=lambda: 'ffmpeg')
b = importlib.import_module('build_sampled_audio')

for p in [b.OUT, b.DELIVERY]:
    p.mkdir(parents=True, exist_ok=True)
for i in range(1, 6):
    b.deliver(f'reel_stop_{i}', b.stop_click(i, .18), -6 + i * .3)
for name in ['slash_hit', 'slash_finale']:
    b.deliver(name, b.blade(name, b.duration(name, .7)), -4.5)

path = b.SOURCE / 'LICENSES.json'
rendered = {r['output_filename'] for r in b.LICENSES}
rows = [r for r in json.loads(path.read_text()) if r['output_filename'] not in rendered] + b.LICENSES
path.write_text(json.dumps(rows, indent=2) + '\n')
print('rendered', sorted(rendered))
