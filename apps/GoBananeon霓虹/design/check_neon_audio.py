"""Validate v2 delivery, source/live parity and the layered blast event mix."""

from pathlib import Path
import subprocess
import wave
import json

import numpy as np

ROOT = Path(__file__).parent / "source" / "neon_delivery" / "audio"
SFX = {
    "btn": .065, "spin": .42, "reel_stop": .145, "reel_tension": 2.0,
    "pluck_low": .75, "symbol_reveal": 1.03, "symbol_land": .21, "dj_scratch": 3.2,
    **{f"scatter_{i}": .9 for i in range(1, 6)},
    "fuse_sizzle": .38, "dynamite_blast": 1.10, "dynamite_blast_big": 1.34,
    "symbol_shatter": .7, "smoke_puff": .9, "press_blast": .58,
    "ladder_up": .94, "fullboard_chain": 1.20, "fullboard_stamp": 1.88,
    "gong_feature": 2.65, "fs_intro": 2.2, "cave_quake": 3.0,
    "voice_roar": 2.7, "voice_effort": .4,
    "win_gliss": 1.12, "win_gliss_big": 2.6, "win_panel": 1.78,
    "win_big": 2.45, "win_super": 3.05, "win_mega": 3.6,
    "win_epic": 4.2, "win_max": 4.8, "win_cap": 3.5,
    "bigwin_blast": 2.05, "coin_shimmer": 2.15, "wild_expand": 2.25,
    "mult_update": .58, "grenade_blast": .64,
}
names = {f"{name}.wav" for name in SFX}
names |= {"bgm_main.wav", "bgm_freespin.wav", "monkey_expand.mp3"}
actual = {p.name for p in ROOT.iterdir() if p.is_file()}
assert names == actual, ("missing", names - actual, "extra", actual - names)

for path in ROOT.glob("*.wav"):
    live = Path(__file__).parent.parent / "static/assets/audio/neon" / path.name
    assert path.read_bytes() == live.read_bytes(), ("source/live mismatch", path)
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
        if path.stem == "reel_tension":
            assert abs(samples[0] - samples[-1]) < .0001, "tension loop discontinuity"
    else:
        assert 25 <= duration <= 60, (path, duration)
        stereo = samples.reshape(-1, 2)
        # A loop boundary must not make a digital impulse.
        assert np.max(np.abs(stereo[0] - stereo[-1])) < .005, path

preview_root = ROOT.parent / "audio_preview"
metrics = json.loads((preview_root / "audio_metrics.json").read_text(encoding="utf8"))
for name in ["dynamite_blast", "dynamite_blast_big", "symbol_shatter", "smoke_puff", "symbol_reveal", "symbol_land"]:
    cue = metrics[name]
    assert cue["tail50msDbFS"] < -42, ("tail masks next board", name, cue)
    assert cue["phoneBandEnergyPct"] > 20, ("impact relies on sub only", name, cue)
for width in (1, 5):
    cue = metrics[f"preview_blast_{width}"]
    assert cue["rawMixPeakDbFS"] < -2, ("layered event clipping risk", width, cue)
    with wave.open(str(preview_root / f"blast_{width}_reel.wav"), "rb") as wav:
        mix = np.frombuffer(wav.readframes(wav.getnframes()), dtype="<i2").astype(np.float64) / 32768
    assert np.max(np.abs(mix)) < .85
assert metrics["dynamite_blast_big"]["rmsDbFS"] > metrics["dynamite_blast"]["rmsDbFS"] + .5
with wave.open(str(ROOT / "dj_scratch.wav"), "rb") as wav:
    dj = np.frombuffer(wav.readframes(wav.getnframes()), dtype="<i2").astype(np.float64) / 32768
for at in (.60, 1.08, 1.56, 2.04):
    stroke=dj[round(at*44100):round((at+.42)*44100)]
    assert np.sqrt(np.mean(stroke**2)) > .05, ("missing DJ gesture", at)
assert np.sqrt(np.mean(dj[round(.12*44100):round(.5*44100)]**2)) < .003, "raise-hand section should leave breathing room"
assert np.sqrt(np.mean(dj[round(2.85*44100):]**2)) < .001, "DJ scratch tail survives after hand settles"
dj_hz=np.fft.rfftfreq(len(dj),1/44100)
dj_power=np.abs(np.fft.rfft(dj))**2
assert dj_power[dj_hz<250].sum()/dj_power.sum() < .005, "DJ scratch rumble returned"
assert dj_power[dj_hz<500].sum()/dj_power.sum() < .10, "DJ scratch grew chesty/low again"
assert 20*np.log10(np.sqrt(np.mean(dj**2))) < -23.5, "character scratch level grew too loud"
assert metrics["dj_gesture"]["cycleSeconds"] == .48
assert (preview_root / "neon_dj_showcase.wav").stat().st_size > 44100*12, "new DJ showcase missing"
assert (preview_root / "neon_dj_light_showcase.wav").stat().st_size > 44100*12, "light DJ showcase missing"

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

print(f"PASS: {len(names)} source/live audio files; 44.1 kHz/16-bit, starts, tails, gapless loop edges, phone-band energy, layered mix headroom and six hoots")
