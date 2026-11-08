"""Rebuild only the rhythm pass (design/build_neon_audio_v3.py rhythm_kit()).

The full V3 build needs imageio-ffmpeg for the MP3 BGM; these four WAVs do
not, so this stubs it, runs build_neon_audio_v3.rhythm_kit() and merges the
provenance rows into LICENSES.json. Run from the app: python design/build_neon_rhythm_kit.py
"""
import json
import sys
import types
from pathlib import Path

HERE = Path(__file__).resolve().parent
try:
    import imageio_ffmpeg  # noqa: F401
except ImportError:
    # The spin cue reads the scratch MP3. math-sdk's venv ships the
    # imageio-ffmpeg binary even though that venv lacks scipy; borrow it.
    found = sorted((HERE.parents[3] / 'math-sdk/env/Lib/site-packages/imageio_ffmpeg/binaries').glob('ffmpeg*.exe'))
    stub = types.ModuleType('imageio_ffmpeg')
    stub.get_ffmpeg_exe = lambda: str(found[-1]) if found else 'ffmpeg'
    sys.modules['imageio_ffmpeg'] = stub
sys.path.insert(0, str(HERE))
import build_neon_audio_v3 as v3  # noqa: E402

for path in [v3.OUT, v3.DELIVERY]:
    path.mkdir(parents=True, exist_ok=True)
v3.rhythm_kit()
lic_path = v3.SOURCE / 'LICENSES.json'
rows = json.loads(lic_path.read_text(encoding='utf8'))
outputs = {name + '.wav' for name in v3.RHYTHM_KIT}
rows = [row for row in rows if row['output_filename'] not in outputs] + v3.LICENSES
lic_path.write_text(json.dumps(rows, indent=2, ensure_ascii=False) + '\n', encoding='utf8')
for name in v3.RHYTHM_KIT:
    m = v3.METRICS[name]
    print(f"{name}.wav  {len(v3.RENDERED[name].audio) / v3.SR:.3f}s  peak {m['truePeakDbTP']:.1f} dBTP  tail {m['tail50msDbFS']:.1f} dBFS")
print(f'{len(rows)} provenance rows')
