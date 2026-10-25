"""Prepare the recorded ten-pin strike for the transition and lane ambience.

Source: SieuAmThanh, "Bowling Strike", Freesound #514385 (CC0).
The source preview is preserved in design/source/audio; see its README.
"""
from pathlib import Path
import subprocess
import wave

import imageio_ffmpeg
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'design/source/audio/bowling_strike_514385_preview.mp3'
OUT = ROOT / 'static/assets/audio/strike/bowling_pins.wav'
SR = 32000

decoded = subprocess.run(
    [imageio_ffmpeg.get_ffmpeg_exe(), '-nostdin', '-v', 'error', '-i', str(SOURCE),
     '-f', 's16le', '-acodec', 'pcm_s16le', '-ar', str(SR), '-ac', '2', 'pipe:1'],
    check=True, capture_output=True,
).stdout
audio = np.frombuffer(decoded, dtype='<i2').astype(np.float64).reshape(-1, 2) / 32768

# Remove only silence before the recorded strike. Preserve the many small pin
# collisions and room decay that make this read as a full rack falling.
window = round(0.01 * SR)
blocks = [np.sqrt(np.mean(audio[i:i + window] ** 2))
          for i in range(0, len(audio), window)]
first = next((i for i, rms in enumerate(blocks) if rms > 0.012), 0)
audio = audio[max(0, first * window - round(0.012 * SR)):]
peak = np.max(np.abs(audio))
audio *= 0.88 / max(peak, 1e-9)

fade_in = min(round(0.005 * SR), len(audio))
fade_out = min(round(0.07 * SR), len(audio))
audio[:fade_in] *= np.linspace(0, 1, fade_in)[:, None]
audio[-fade_out:] *= np.linspace(1, 0, fade_out)[:, None]
pcm = np.clip(audio * 32767, -32768, 32767).astype('<i2')

OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), 'wb') as output:
    output.setnchannels(2)
    output.setsampwidth(2)
    output.setframerate(SR)
    output.writeframes(pcm.tobytes())
print(f'{OUT} ({len(audio) / SR:.2f}s stereo)')
