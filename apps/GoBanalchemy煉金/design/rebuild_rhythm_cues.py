"""Re-render only the rhythm-pass cues (2026-11-06, user: 動畫跟音效節奏方面要更強).

build_sampled_audio.py renders everything, the MP3 beds included, and needs
imageio-ffmpeg for those. The cues here read only WAV/OGG samples, so they can
be re-rendered on their own without touching the music:

  reel_stop_1-5        audible-band stops (400-4000 Hz), a step up per reel
  win_step_1-5         the win wake, one rising note per lit reel
  win_land, _big       the clink as a reel's winners come down from the leap
  win_rollup_loop/_fg  count-up ticks cut to 128 / 154 BPM, four beats each
  win_big..win_max     tier fanfares cut to the 128 BPM bed
  gong/blasts/stamp    the impacts, with small-speaker presence added
  win_count_end        a small win's amount landing (round 2)
  reel_tension_beat/_fg  the anticipation loop at 128 / 154 BPM (round 2);
                       replaces reel_tension.wav, which is removed

Licence rows for these outputs are replaced with the sources they now use.

    python design/rebuild_rhythm_cues.py            # writes the live assets
    DRY=<folder> python design/rebuild_rhythm_cues.py   # renders elsewhere only
"""
import importlib, json, os, sys, types
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
try:
    import imageio_ffmpeg  # noqa: F401
except ImportError:  # only the MP3 path uses it, and no cue here is an MP3
    sys.modules['imageio_ffmpeg'] = types.SimpleNamespace(get_ffmpeg_exe=lambda: 'ffmpeg')
b = importlib.import_module('build_sampled_audio')

dry = os.environ.get('DRY')
if dry:
    b.OUT, b.DELIVERY = Path(dry), Path(dry) / 'delivery'
for p in [b.OUT, b.DELIVERY]:
    p.mkdir(parents=True, exist_ok=True)
for name, clip, peak, stereo in b.rhythm_cues():
    b.deliver(name, clip, peak, stereo=stereo, loop=name.startswith(('win_rollup', 'reel_tension')))

# retired outputs: the 2.0s tension loop, which fits neither bed's bar
OBSOLETE = {'reel_tension.wav'}

if not dry:
    for folder in [b.OUT, b.DELIVERY]:
        for name in OBSOLETE:
            (folder / name).unlink(missing_ok=True)
    path = b.SOURCE / 'LICENSES.json'
    rendered = {r['output_filename'] for r in b.LICENSES}
    rows = [r for r in json.loads(path.read_text()) if r['output_filename'] not in rendered | OBSOLETE] + b.LICENSES
    path.write_text(json.dumps(rows, indent=2) + '\n')
print('rendered', sorted({n for n, *_ in b.rhythm_cues()}), '->', b.OUT)
