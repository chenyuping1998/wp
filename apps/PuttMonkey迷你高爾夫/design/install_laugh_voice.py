"""Putt Monkey's laugh voice (2026-10-19, user: the laugh sounded odd and did
not follow his body; use Diner's).

The formant-synthesised ten-HA laugh (generate_laugh_voice.py) is retired.
The voice is now the recorded-style laugh Diner Monkey ships
(design/source/putt/audio/voice_laugh_recorded.wav): five HAs whose attacks,
read off its envelope, fall at 0 / 210 / 420 / 630 / 840 ms and fade by
~1150 ms. src/game/laughTiming.json is set FROM that file — the voice starts
voiceDelayMs (260) into the chestbeat, so beats are 260 + 210*i — and the
body shake, the face cels (wp/tools/build_cast_mesh.py) and the HA! captions
(Mascot.svelte) all read that one file.

Runs last in audio:build so the generated placeholder does not replace it.
"""
from pathlib import Path
import shutil

APP = Path(__file__).resolve().parents[1]
src = APP / 'design/source/putt/audio/voice_laugh_recorded.wav'
dst = APP / 'static/assets/audio/putt/voice_laugh.wav'
shutil.copy2(src, dst)
print('installed', dst.relative_to(APP))
