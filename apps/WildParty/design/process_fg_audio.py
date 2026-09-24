#!/usr/bin/env python3
"""Cut the generated free-game audio down to what the game actually needs.

The music generator only emits fixed 30.77s renders, which is wrong for both
slots in different ways:

  fg_intro.mp3     wanted a ~2.5s entry stinger, got a whole track. The game
                   fires this at the same moment it starts the free-game music,
                   so a 30s "stinger" is simply two tracks fighting for the whole
                   round. Cut to the natural riser-and-landing the track already
                   contains.

  bgm_freespin.mp3 wanted a seamless loop. 30.772s at the detected 125 BPM is
                   16.03 bars — i.e. the take is 16 bars plus 52ms of overhang,
                   which is exactly the kind of remainder that makes a loop
                   stutter. Trim to a whole 16 bars and crossfade the seam.

No ffmpeg on this machine; macOS's own afconvert does the decode and re-encode.

Sources are kept as *_raw.mp3 so this can be re-run after a regeneration.
"""

from __future__ import annotations

import subprocess
import wave
from pathlib import Path

import numpy as np

AUDIO = Path(__file__).resolve().parent.parent / "static" / "assets" / "audio"
# The 30s generator output is a pipeline input, not a game asset — keeping it
# under static/ would ship 1.5MB of unused audio to every player.
RAW = Path(__file__).resolve().parent / "source" / "audio"
TMP = Path("/tmp/wp_audio")
TMP.mkdir(exist_ok=True)

BPM = 125.0
BEATS_PER_BAR = 4
BAR = 60.0 / BPM * BEATS_PER_BAR  # 1.920s


def decode(src: Path) -> tuple[np.ndarray, int]:
    wav = TMP / (src.stem + ".wav")
    subprocess.run(["afconvert", "-f", "WAVE", "-d", "LEI16", str(src), str(wav)], check=True)
    with wave.open(str(wav)) as w:
        sr, ch, n = w.getframerate(), w.getnchannels(), w.getnframes()
        a = np.frombuffer(w.readframes(n), dtype="<i2").astype(np.float64).reshape(-1, ch) / 32768.0
    return a, sr


def encode(a: np.ndarray, sr: int, dst: Path) -> None:
    wav = TMP / (dst.stem + "_out.wav")
    pcm = np.clip(a, -1, 1)
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(a.shape[1])
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((pcm * 32767).astype("<i2").tobytes())
    # AAC in an .m4a container, not MP3: afconvert decodes MP3 but cannot encode
    # it ("fmt?"), and there is no lame on this machine. AAC is not a compromise
    # here — the game's own sound sprite already ships an .m4a alongside its mp3,
    # so every browser this runs on decodes it.
    #
    # 192kbps stereo, because this music loops for minutes and the coding
    # artefacts of a lower rate sit right on the supersaw pad.
    subprocess.run(
        ["afconvert", "-f", "m4af", "-d", "aac", "-b", "192000", str(wav), str(dst)],
        check=True,
    )
    if not dst.exists() or dst.stat().st_size == 0:
        raise SystemExit(f"could not encode {dst}")


def fade(a: np.ndarray, sr: int, fade_in_s: float, fade_out_s: float) -> np.ndarray:
    out = a.copy()
    n_in, n_out = int(sr * fade_in_s), int(sr * fade_out_s)
    if n_in:
        out[:n_in] *= np.linspace(0, 1, n_in)[:, None] ** 0.5
    if n_out:
        out[-n_out:] *= np.linspace(1, 0, n_out)[:, None] ** 0.5
    return out


def build_stinger(raw: Path, dst: Path) -> None:
    a, sr = decode(raw)
    mono = a.mean(1)

    hop = int(sr * 0.01)
    rms = np.array([np.sqrt((mono[i : i + hop] ** 2).mean()) for i in range(0, len(mono) - hop, hop)])
    rise = np.diff(rms)

    # The landing: the FIRST big jump, not the biggest one.
    #
    # Taking the global maximum picked a hit 7.8s in, and the two seconds before
    # that are already at full level — so the cut read as "loud music, then
    # slightly louder music", which is not a stinger. What makes an entry sting
    # work is the shape: quiet, rise, hit. This track has exactly that in its own
    # opening, and the first jump past a share of the peak is where it resolves.
    window = rise[:800]
    threshold = window.max() * 0.7
    hits = np.where(window > threshold)[0]
    landing = float(hits[0]) * 0.01 if len(hits) else float(np.argmax(window)) * 0.01
    lead_in = 2.0
    ring_out = 0.62
    start = max(0.0, landing - lead_in)
    end = min(len(mono) / sr, landing + ring_out)

    seg = a[int(start * sr) : int(end * sr)]
    seg = fade(seg, sr, 0.05, 0.42)
    encode(seg, sr, dst)
    print(
        f"[OK] {dst.name}: landing at {landing:.2f}s -> kept {start:.2f}..{end:.2f}s "
        f"({(end - start):.2f}s)"
    )


def onset_envelope(mono: np.ndarray, sr: int) -> np.ndarray:
    hop = int(sr * 0.01)
    return np.array(
        [np.sqrt((mono[i : i + hop] ** 2).mean()) for i in range(0, len(mono) - hop, hop)]
    )


def one_pole_lowpass(a: np.ndarray, sr: int, cutoff: np.ndarray) -> np.ndarray:
    """Low-pass with a per-sample cutoff, so the filter can sweep."""
    coeff = np.exp(-2.0 * np.pi * np.clip(cutoff, 20.0, sr / 2.2) / sr)
    out = np.empty_like(a)
    state = np.zeros(a.shape[1])
    for i in range(len(a)):
        state = a[i] * (1.0 - coeff[i]) + state * coeff[i]
        out[i] = state
    return out


def build_synth_stinger(
    raw: Path, dst: Path, lead_in: float = 1.6, ring_out: float = 1.25
) -> None:
    """Construct a stinger from material that does not contain one.

    build_stinger() cuts an existing quiet-rise-hit shape out of a track. That
    only works when the take actually has one. The trigger render does not: it is
    a flat full-energy loop, 0.35-0.42 RMS from the first bar to the last, with no
    passage anywhere that reads as a build. Cutting it at any point yields "loud
    music, then loud music" — the exact failure the comment in build_stinger
    describes, but with no better cut point to move to.

    So the shape is imposed rather than found. The strongest onset in the track
    becomes the landing; the bar-and-a-bit before it is ducked and swept under a
    closing low-pass so it reads as a riser into that hit. This is how risers are
    built in practice — a filter automating up into a downbeat — and it uses the
    track's own material, so the timbre still matches.
    """
    a, sr = decode(raw)
    mono = a.mean(1)
    env = onset_envelope(mono, sr)

    # The landing is the biggest jump in level, ignoring the first second (an
    # onset there leaves no room for a lead-in) and the last few (no ring-out).
    rise = np.diff(env)
    lo, hi = int(lead_in / 0.01) + 20, len(rise) - int(ring_out / 0.01) - 20
    landing = (lo + int(np.argmax(rise[lo:hi]))) * 0.01

    start = landing - lead_in
    seg = a[int(start * sr) : int((landing + ring_out) * sr)].copy()
    n_lead = int(lead_in * sr)

    # Duck the lead-in from very quiet up to full at the landing, and sweep a
    # low-pass from 400Hz to open across the same span. The curves are
    # exponential because both level and cutoff are perceived logarithmically —
    # a linear ramp sounds like it does nothing and then rushes.
    t = np.linspace(0.0, 1.0, n_lead)
    gain = 0.12 + 0.88 * t**2.5
    seg[:n_lead] = one_pole_lowpass(seg[:n_lead], sr, 400.0 * (sr / 8.0 / 400.0) ** (t**2))
    seg[:n_lead] *= gain[:, None]

    seg = fade(seg, sr, 0.02, 0.55)
    encode(seg, sr, dst)

    lead_rms = float(np.sqrt((seg[: n_lead // 2] ** 2).mean()))
    hit_rms = float(np.sqrt((seg[n_lead : n_lead + int(sr * 0.3)] ** 2).mean()))
    print(
        f"[OK] {dst.name}: landing at {landing:.2f}s -> {lead_in + ring_out:.2f}s "
        f"(built riser; lead {lead_rms:.3f} -> hit {hit_rms:.3f}, "
        f"{20 * np.log10(hit_rms / max(lead_rms, 1e-9)):.1f} dB)"
    )


def build_loop(raw: Path, dst: Path, bars: int = 16, crossfade_s: float = 0.12) -> None:
    a, sr = decode(raw)
    target = bars * BAR
    if len(a) / sr < target:
        raise SystemExit(f"{raw.name} is shorter than {bars} bars")

    n = int(round(target * sr))
    body = a[:n].copy()

    # Crossfade the tail into the head so the wrap point has no click. The
    # material for the fade is taken from just past the loop end, which is the
    # audio that would have followed anyway.
    x = int(sr * crossfade_s)
    if len(a) >= n + x:
        tail = a[n : n + x]
        ramp = np.linspace(0, 1, x)[:, None]
        body[:x] = body[:x] * ramp + tail * (1 - ramp)

    encode(body, sr, dst)
    seam = float(np.abs(body[0] - body[-1]).max())
    print(
        f"[OK] {dst.name}: {bars} bars = {target:.3f}s at {BPM:.0f} BPM, "
        f"{crossfade_s * 1000:.0f}ms wrap crossfade, seam step {seam:.4f}"
    )


def main() -> None:
    for name in ("fg_intro", "bgm_freespin"):
        live = AUDIO / f"{name}.mp3"
        raw = RAW / f"{name}_raw.mp3"
        if not raw.exists():
            if not live.exists():
                raise SystemExit(f"{live} not found")
            RAW.mkdir(parents=True, exist_ok=True)
            live.rename(raw)
            print(f"[..] kept original as {raw.name}")

    build_stinger(RAW / "fg_intro_raw.mp3", AUDIO / "fg_intro.m4a")
    build_loop(RAW / "bgm_freespin_raw.mp3", AUDIO / "bgm_freespin.m4a")

    # The two later replacements. They are optional so this script stays runnable
    # before their renders exist: a missing raw leaves the game on its previous
    # sound (the template sprite hit, the template background.mp3) rather than
    # failing the whole pass and rolling back the two above.
    #
    # trigger_hit replaces a 6.0s sprite fanfare but is cut shorter: the trigger
    # sound fires immediately before the room transition, and the free-game
    # jingle follows it. At the template's length the three overlap into mush.
    optional = [
        (build_synth_stinger, "trigger_hit", AUDIO / "trigger_hit.m4a"),
        (build_loop, "bgm_main", AUDIO / "bgm_main.m4a"),
    ]
    for build, name, dst in optional:
        raw = RAW / f"{name}_raw.mp3"
        if raw.exists():
            build(raw, dst)
        else:
            print(f"[--] {raw.name} not supplied — leaving {dst.name} alone")


if __name__ == "__main__":
    main()
