"""Validate the sound delivery against BANANEON_AUDIO_REQUIREMENTS.md."""

from pathlib import Path
import subprocess
import wave

import numpy as np

ROOT = Path(__file__).parent / "source" / "neon_delivery" / "audio"
SFX = {
    "btn": .08, "spin": .5, "reel_stop": .16, "reel_tension": 2.0,
    "pluck_low": .9, "symbol_reveal": 1.25,
    **{f"scatter_{i}": 1.0 for i in range(1, 6)},
    "fuse_sizzle": .38, "dynamite_blast": 1.3, "dynamite_blast_big": 1.5,
    "symbol_shatter": 1.0, "smoke_puff": 1.1, "press_blast": .7,
    "ladder_up": 1.1, "fullboard_chain": 1.3, "fullboard_stamp": 2.2,
    "gong_feature": 3.0, "fs_intro": 2.4, "cave_quake": 3.3,
    "voice_roar": 2.7, "voice_effort": .4,
    "win_gliss": 1.3, "win_gliss_big": 3.0, "win_panel": 2.1,
    "win_big": 2.7, "win_super": 3.3, "win_mega": 3.9,
    "win_epic": 4.5, "win_max": 5.1, "win_cap": 3.8,
    "bigwin_blast": 2.4, "coin_shimmer": 2.4, "wild_expand": 2.6,
    "mult_update": .7, "grenade_blast": .72,
}
names = {f"{name}.wav" for name in SFX}
names |= {"bgm_main.wav", "bgm_freespin.wav", "monkey_expand.mp3"}
actual = {p.name for p in ROOT.iterdir() if p.is_file()}
assert names == actual, ("missing", names - actual, "extra", actual - names)

for path in ROOT.glob("*.wav"):
    with wave.open(str(path), "rb") as wav:
        assert wav.getframerate() == 44100
        assert wav.getsampwidth() == 2
        assert wav.getcomptype() == "NONE"
        channels = wav.getnchannels()
        assert channels == (2 if path.stem.startswith("bgm_") else 1)
        duration = wav.getnframes() / 44100
        samples = np.frombuffer(wav.readframes(wav.getnframes()), dtype="<i2").astype(np.float64) / 32768
    assert np.max(np.abs(samples)) < 10 ** (-1 / 20), path
    assert np.max(np.abs(samples)) > .1, path
    if path.stem in SFX:
        target = SFX[path.stem]
        assert abs(duration - target) <= max(.015, target * .2), (path, duration, target)
        first_audible = np.flatnonzero(np.abs(samples) > .005)
        assert len(first_audible) and first_audible[0] / 44100 < .008, (path, first_audible[0] / 44100)
    else:
        assert 25 <= duration <= 60, (path, duration)
        stereo = samples.reshape(-1, 2)
        # A loop boundary must not make a digital impulse.
        assert np.max(np.abs(stereo[0] - stereo[-1])) < .005, path

import imageio_ffmpeg

decoded = subprocess.run(
    [imageio_ffmpeg.get_ffmpeg_exe(), "-loglevel", "error", "-i", str(ROOT / "monkey_expand.mp3"),
     "-f", "f32le", "-ar", "44100", "-ac", "1", "pipe:1"],
    capture_output=True, check=True,
)
hoots = np.frombuffer(decoded.stdout, dtype="<f4")
assert 1.65 <= len(hoots) / 44100 <= 1.95
for i in range(6):
    section = hoots[round((i * .285) * 44100):round((i * .285 + .12) * 44100)]
    assert np.sqrt(np.mean(section ** 2)) > .035, i

print(f"PASS: {len(names)} audio files, 44.1 kHz/16-bit WAV, stereo BGM, durations, peaks, starts, loop edges and six hoots")
