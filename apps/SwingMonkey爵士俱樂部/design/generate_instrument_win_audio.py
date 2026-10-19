"""Four short, deterministic instrument phrases aligned to instrumentWins.ts."""
from pathlib import Path
import wave
import numpy as np

RATE = 44100
OUT = Path(__file__).resolve().parents[1] / 'static/assets/audio/swing'
RNG = np.random.default_rng(20261013)


def phrase(hits, notes, voice):
    samples = np.zeros(int(RATE * 1.58), dtype=np.float64)
    for millis, frequency in zip(hits, notes):
        start = int(RATE * millis / 1000)
        length = min(len(samples) - start, int(RATE * 0.37))
        t = np.arange(length) / RATE
        if voice == 'sax':
            vibrato = 1 + 0.006 * np.sin(2 * np.pi * 5.3 * t)
            phase = 2 * np.pi * frequency * np.cumsum(vibrato) / RATE
            tone = sum(np.sin(phase * h + .17 * h) * (1 / h) for h in range(1, 7))
            env = np.minimum(1, t / .035) * np.minimum(1, (.37 - t) / .12)
            tone *= env * (1 + .07 * np.sin(2 * np.pi * 7 * t))
        elif voice == 'bass':
            phase = 2 * np.pi * frequency * t
            tone = (np.sin(phase) + .27 * np.sin(2 * phase) + .1 * np.sin(3 * phase))
            tone *= np.exp(-t * 10) * np.minimum(1, t / .006)
            tone += .06 * RNG.standard_normal(length) * np.exp(-t * 40)
        elif voice == 'snare':
            noise = RNG.standard_normal(length)
            filtered = noise - np.convolve(noise, np.ones(65) / 65, mode='same')
            tone = .68 * filtered * np.exp(-t * 28)
            tone += .19 * np.sin(2 * np.pi * 185 * t) * np.exp(-t * 32)
        else:  # banjo: bright plucked string, quick woody decay
            phase = 2 * np.pi * frequency * t
            tone = sum(np.sin(phase * h) / h for h in range(1, 9))
            tone *= np.exp(-t * 15) * np.minimum(1, t / .003)
            tone += .06 * RNG.standard_normal(length) * np.exp(-t * 80)
        samples[start:start + length] += tone
    # Leave headroom for the normal win fanfare and for several symbols paying.
    peak = np.max(np.abs(samples)) or 1
    return (np.tanh(samples / peak * 1.3) * 0.46 * 32767).astype('<i2')


phrases = {
    'instrument_sax': ([240, 820], [349.23, 392.00], 'sax'),
    'instrument_bass': ([220, 520, 820, 1060], [87.31, 116.54, 130.81, 116.54], 'bass'),
    'instrument_snare': ([300, 490, 680, 860, 1050], [185] * 5, 'snare'),
    'instrument_banjo': ([220, 500, 780, 1040], [261.63, 311.13, 349.23, 392.00], 'banjo'),
}

for name, (hits, notes, voice) in phrases.items():
    path = OUT / f'{name}.wav'
    with wave.open(str(path), 'wb') as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(RATE)
        out.writeframes(phrase(hits, notes, voice).tobytes())
    print(path.name)
