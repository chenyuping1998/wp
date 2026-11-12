#!/usr/bin/env python3
"""Acceptance gate for Wild Alchemy's own sound set (design/generate_wild_alchemy_audio.py).

Replaces check_hard_time_win_audio.py, which read static/assets/audio/hard_time/.

Measures every file on ONE channel (left). The effects are stereo with
decorrelated reverb and panning; averaging L and R comb-filters them and gives
wrong RMS and centroid figures.

Checks:
  * every file Sound.svelte points at exists, and every file in the folder is
    referenced (no orphan, no missing)
  * 16-bit / 44.1 kHz / stereo WAV; no clipping; peak <= -1.0 dBFS
  * one-shots start and end on silence; loops join without a jump
  * scatter_1..5 and the five big-win tiers escalate (louder, and the tiers
    each longer than the last)
  * not shrill: share of energy above 6 kHz stays small
  * no file is byte-identical to any audio in a sibling app, or to another
    file in this set
  * the music decodes, is the length it should be, and loops cleanly

Usage: python design/check_wild_alchemy_audio.py [--report]
"""

from __future__ import annotations

import hashlib
import re
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / "static/assets/audio"
SET = AUDIO / "wild_alchemy"
SFX = SET / "sfx"
WORKSPACE = ROOT.parents[2]  # /Users/stone/stake-engine
LOOPS = {"coin_shimmer", "reel_tension"}
SCATTERS = [f"scatter_{i}" for i in range(1, 6)]
TIERS = ["win_tier_big", "win_tier_super", "win_tier_mega", "win_tier_epic", "win_tier_max"]
REPORT = "--report" in sys.argv

problems: list[str] = []


def fail(msg: str) -> None:
    problems.append(msg)


def read_wav(path: Path):
    with wave.open(str(path)) as w:
        fmt = (w.getframerate(), w.getsampwidth(), w.getnchannels())
        x = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(float)
    x = x.reshape(-1, fmt[2]) / 32768
    return fmt, x


def measure(x: np.ndarray, sr: int = 44100) -> dict:
    left = x[:, 0]
    spectrum = np.abs(np.fft.rfft(left * np.hanning(len(left)))) ** 2
    hz = np.fft.rfftfreq(len(left), 1 / sr)
    total = max(spectrum.sum(), 1e-20)
    peak = float(np.abs(x).max())
    rms = float(np.sqrt(np.mean(left ** 2)))
    step = np.abs(np.diff(x, axis=0))
    typical = float(np.percentile(step, 99.9)) or 1e-9
    return {
        "seconds": len(left) / sr,
        "peak_db": 20 * np.log10(max(peak, 1e-12)),
        "rms_db": 20 * np.log10(max(rms, 1e-12)),
        "centroid": float((spectrum * hz).sum() / total),
        "above6k": float(spectrum[hz > 6000].sum() / total),
        "clipped": int((np.abs(x) >= 32767 / 32768).sum()),
        "edge": float(max(np.abs(x[0]).max(), np.abs(x[-1]).max())),
        # loop join: the jump from last sample to first, against the 99.9th
        # percentile of ordinary sample-to-sample steps inside the file
        "seam": float(np.abs(x[0] - x[-1]).max() / typical),
    }


# ── what Sound.svelte references ──────────────────────────────────────────────
source = (ROOT / "src/components/Sound.svelte").read_text()
referenced = set(re.findall(r"'(wild_alchemy/[^']+)'", source))
if "hard_time/" in source:
    fail("Sound.svelte still references hard_time/")
for rel in sorted(referenced):
    if not (AUDIO / rel).exists():
        fail(f"Sound.svelte references missing {rel}")
on_disk = {str(p.relative_to(AUDIO)) for p in SET.rglob("*") if p.is_file()}
for orphan in sorted(on_disk - referenced):
    fail(f"{orphan} is generated but nothing references it")

# ── one-shots and loops ───────────────────────────────────────────────────────
metrics: dict[str, dict] = {}
for path in sorted(SFX.glob("*.wav")):
    name = path.stem
    fmt, x = read_wav(path)
    if fmt != (44100, 2, 2):
        fail(f"{name}: format {fmt}, want 44.1 kHz / 16-bit / stereo")
    m = measure(x)
    metrics[name] = m
    if m["clipped"]:
        fail(f"{name}: {m['clipped']} clipped samples")
    if m["peak_db"] > -1.0:
        fail(f"{name}: peak {m['peak_db']:.1f} dBFS above -1.0")
    if not -30 <= m["rms_db"] <= -8:
        fail(f"{name}: RMS {m['rms_db']:.1f} dB outside -30..-8")
    if m["above6k"] > 0.08:
        fail(f"{name}: {m['above6k']:.1%} of energy above 6 kHz (shrill)")
    if name in LOOPS:
        if m["seam"] > 1.0:
            fail(f"{name}: loop seam jump is {m['seam']:.2f}x the 99.9th-percentile step")
    elif m["edge"] > 0.002:
        fail(f"{name}: does not start/end on silence (edge {m['edge']:.4f})")

for group in (SCATTERS, TIERS):
    missing = [g for g in group if g not in metrics]
    if missing:
        fail(f"missing {missing}")
        continue
    # loudness (one-channel RMS) must rise step by step through the group
    rmss = [metrics[g]["rms_db"] for g in group]
    if not all(b - a >= 0.3 for a, b in zip(rmss, rmss[1:])):
        fail(f"{group[0]}..{group[-1]} RMS does not escalate: {[round(v, 1) for v in rmss]}")
lengths = [metrics[t]["seconds"] for t in TIERS if t in metrics]
if not all(b > a for a, b in zip(lengths, lengths[1:])):
    fail(f"big-win tiers are not each longer than the last: {lengths}")

# ── music ─────────────────────────────────────────────────────────────────────
EXPECTED = {"bgm_base": 16 * 4 * 60 / 80, "bgm_feature": 16 * 4 * 60 / 104}
with tempfile.TemporaryDirectory() as tmp:
    for name, seconds in EXPECTED.items():
        src = SET / f"{name}.m4a"
        if not src.exists():
            fail(f"missing {src.name}")
            continue
        wav = Path(tmp) / f"{name}.wav"
        subprocess.run(["afconvert", "-f", "WAVE", "-d", "LEI16", str(src), str(wav)], check=True)
        fmt, x = read_wav(wav)
        m = measure(x)
        metrics[name] = m
        if abs(m["seconds"] - seconds) > 0.03:
            fail(f"{name}: decodes to {m['seconds']:.3f}s, want {seconds:.3f}s")
        if m["clipped"] or m["peak_db"] > -1.0:
            fail(f"{name}: peak {m['peak_db']:.1f} dBFS / {m['clipped']} clipped")
        if not -26 <= m["rms_db"] <= -19:
            fail(f"{name}: RMS {m['rms_db']:.1f} dB outside the outgoing set's range")
        if m["seam"] > 1.0:
            fail(f"{name}: loop seam jump is {m['seam']:.2f}x the 99.9th-percentile step")

# ── originality ───────────────────────────────────────────────────────────────
own = {}
for p in list(SFX.glob("*.wav")) + list(SET.glob("*.m4a")) + [AUDIO / "sounds.wav"]:
    own[p] = hashlib.sha256(p.read_bytes()).hexdigest()
if len(set(own.values())) != len(own):
    fail("two files in the set are byte-identical")
sibling_hashes: dict[str, str] = {}
for tree in sorted(WORKSPACE.glob("wp*/apps/*/static/assets/audio")):
    if tree.resolve() == AUDIO.resolve():
        continue
    for p in tree.rglob("*"):
        if p.suffix.lower() in {".wav", ".m4a", ".mp3", ".ogg", ".webm"} and p.is_file():
            sibling_hashes.setdefault(hashlib.sha256(p.read_bytes()).hexdigest(), str(p.relative_to(WORKSPACE)))
for p, digest in own.items():
    if digest in sibling_hashes:
        fail(f"{p.relative_to(AUDIO)} is byte-identical to {sibling_hashes[digest]}")

# ── report ────────────────────────────────────────────────────────────────────
if REPORT or problems:
    print(f"{'file':18} {'sec':>6} {'peak':>7} {'rmsL':>7} {'centL':>6} {'>6k':>6} {'clip':>4} {'edge':>7} {'seam':>6}")
    for name, m in metrics.items():
        print(
            f"{name:18} {m['seconds']:6.2f} {m['peak_db']:7.1f} {m['rms_db']:7.1f} {m['centroid']:6.0f} "
            f"{m['above6k']:6.1%} {m['clipped']:4d} {m['edge']:7.4f} {m['seam']:6.2f}"
        )
    print(f"compared against {len(sibling_hashes)} distinct audio files in sibling apps")

if problems:
    print("FAIL: Wild Alchemy audio")
    for p in problems:
        print(f"  - {p}")
    sys.exit(1)
print(f"OK: {len(metrics)} Wild Alchemy audio files — levels, loops, escalation, originality")
