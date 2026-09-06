"""Turn the licensed explosion sample into the game's two blast cues.

    python design/import_blast_sample.py <source.wav> [--apply]

WHY A SAMPLE AND NOT SYNTHESIS. Everything else in jungle/ is synthesized by
design/generate_audio_jungle.mjs. The blast is not, and cannot go back to being
so: review called the synthesized cues generic, and it was right in a way no
amount of tuning fixes. A physically better sine-and-noise model is still a
sine-and-noise model, and the ear knows.

WHY THE TIMING NEEDS NO ADJUSTMENT. Measured against ReelBlast.svelte's beats:

    attack peak          33 ms
    envelope at -20dB   340 ms   <- exactly the SHATTER beat (340 ms)
    envelope at -30dB   610 ms
    envelope at -40dB   960 ms
    reveal cue fires at 780 ms   (SHATTER 340 + PUFF 240 + HOLD 200)

So the sample's body lands inside SHATTER and its tail is already 30dB down by
the time the reveal marimba plays. It rings under the smoke instead of fighting
the cue that follows it. Nothing was stretched or compressed to achieve that -
it simply fits, which is the only reason this sample is a good pick.

WHAT IS DONE TO IT, AND WHAT DELIBERATELY IS NOT.

  Trailing silence is trimmed. The source carries ~450 ms of dead air after the
  last audible sample; it changes nothing audible but it is dead weight.

  Level is matched to the rest of the set (peak 0.95). The source peaks at 0.79,
  which would have made the loudest moment in the game quieter than the reveal
  chime that follows it.

  A 6 ms fade is applied to the END ONLY. Never the start: the first 33 ms IS
  the explosion, and fading into it is the exact mistake that cost this game's
  synthesized blast a third of its crest factor once already.

  Nothing else. No reverb, no compression, no EQ. The mine reverb that the
  synthesized cues need is already baked into a produced sample, and adding a
  second room on top is how a real recording starts sounding processed.

THE FULL-BOARD VARIANT is the same sample pitched down, not a different sound -
five reels going up must read as MORE of the same event, not another one. The
original is layered back on top at low level so the pitch shift does not cost
the attack its crispness.
"""

import os
import struct
import sys
import wave

# Peak the rest of jungle/ is normalised to.
TARGET_PEAK = 0.95
# Everything past the last audible sample, plus a little room for the fade.
SILENCE_FLOOR = 0.004
TAIL_PAD_MS = 60
FADE_OUT_MS = 6
# Full board: deeper and ~16% longer. Enough to read as bigger, not so much that
# it becomes a different explosion.
BIG_RATE = 0.86
BIG_LAYER_ORIGINAL = 0.45

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "static", "assets", "audio", "jungle")


def read_wav(path):
    w = wave.open(path, "rb")
    n, sr, ch, sw = w.getnframes(), w.getframerate(), w.getnchannels(), w.getsampwidth()
    if sw != 2:
        raise SystemExit(f"expected 16-bit PCM, got {sw * 8}-bit")
    raw = struct.unpack(f"<{n * ch}h", w.readframes(n))
    chans = [[raw[i * ch + c] / 32768.0 for i in range(n)] for c in range(ch)]
    return chans, sr


def write_wav(path, chans, sr):
    ch = len(chans)
    n = len(chans[0])
    data = bytearray()
    for i in range(n):
        for c in range(ch):
            v = max(-1.0, min(1.0, chans[c][i]))
            data += struct.pack("<h", int(v * 32767))
    w = wave.open(path, "wb")
    w.setnchannels(ch)
    w.setsampwidth(2)
    w.setframerate(sr)
    w.writeframes(bytes(data))
    w.close()


def trim_tail(chans, sr):
    n = len(chans[0])
    last = 0
    for i in range(n):
        if max(abs(c[i]) for c in chans) > SILENCE_FLOOR:
            last = i
    end = min(n, last + int(sr * TAIL_PAD_MS / 1000))
    return [c[:end] for c in chans]


def normalise(chans, peak=TARGET_PEAK):
    mx = max(max(abs(v) for v in c) for c in chans) or 1e-9
    g = peak / mx
    return [[v * g for v in c] for c in chans]


def fade_out(chans, sr, ms=FADE_OUT_MS):
    k = int(sr * ms / 1000)
    n = len(chans[0])
    for c in chans:
        for i in range(k):
            c[n - 1 - i] *= i / k
    return chans


def resample(chans, rate):
    """rate < 1 slows and deepens. Linear interpolation is plenty here - the
    shift is small and the material is broadband noise, so interpolation error
    lands well below the noise already in the signal."""
    out = []
    for c in chans:
        n = len(c)
        m = int(n / rate)
        r = []
        for i in range(m):
            x = i * rate
            j = int(x)
            f = x - j
            a = c[j] if j < n else 0.0
            b = c[j + 1] if j + 1 < n else 0.0
            r.append(a + (b - a) * f)
        out.append(r)
    return out


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    src = sys.argv[1]
    apply = "--apply" in sys.argv

    chans, sr = read_wav(src)
    n0 = len(chans[0])
    chans = trim_tail(chans, sr)
    print(f"source {os.path.basename(src)}  {n0 / sr:.3f}s {len(chans)}ch {sr}Hz")
    print(f"  trimmed to {len(chans[0]) / sr:.3f}s (removed {(n0 - len(chans[0])) / sr * 1000:.0f} ms of silence)")

    normal = fade_out(normalise([list(c) for c in chans], TARGET_PEAK), sr)

    big = resample(chans, BIG_RATE)
    for c_i, c in enumerate(big):
        src_c = chans[c_i]
        for i in range(min(len(c), len(src_c))):
            c[i] += src_c[i] * BIG_LAYER_ORIGINAL
    big = fade_out(normalise(big, TARGET_PEAK), sr)

    print(f"  dynamite_blast.wav      {len(normal[0]) / sr:.3f}s  peak {TARGET_PEAK}")
    print(f"  dynamite_blast_big.wav  {len(big[0]) / sr:.3f}s  peak {TARGET_PEAK}  (pitched to {BIG_RATE:g}x)")

    if not apply:
        print("\ndry run - pass --apply to write")
        return
    for name, data in (("dynamite_blast.wav", normal), ("dynamite_blast_big.wav", big)):
        p = os.path.normpath(os.path.join(OUT_DIR, name))
        write_wav(p, data, sr)
        print(f"wrote {p}  {os.path.getsize(p) / 1024:.0f} KB")


if __name__ == "__main__":
    main()
