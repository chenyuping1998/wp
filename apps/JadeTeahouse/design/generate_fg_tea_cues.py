"""Make short teahouse collection cues sized to the FG animation beats."""

from pathlib import Path
import wave

import numpy as np
from scipy.signal import butter, sosfilt


SR = 44_100
OUT = Path(__file__).resolve().parents[1] / "static/assets/audio/sushi"
RNG = np.random.default_rng(73128)


def noise(duration: float, low: float, high: float) -> np.ndarray:
    samples = RNG.normal(size=round(duration * SR))
    sos = butter(2, (low, high), btype="bandpass", fs=SR, output="sos")
    result = sosfilt(sos, samples)
    return result / max(1e-8, np.max(np.abs(result)))


def ceramic(freq: float, duration: float, decay: float) -> np.ndarray:
    t = np.arange(round(duration * SR)) / SR
    attack = np.minimum(1, t / .002)
    body = (
        np.sin(2 * np.pi * freq * t)
        + .31 * np.sin(2 * np.pi * freq * 2.71 * t)
        + .12 * np.sin(2 * np.pi * freq * 4.16 * t)
    )
    return body * attack * np.exp(-t / decay)


def put(canvas: np.ndarray, sound: np.ndarray, at: float, gain: float) -> None:
    start = round(at * SR)
    end = min(len(canvas), start + len(sound))
    canvas[start:end] += sound[: end - start] * gain


def finish(name: str, canvas: np.ndarray) -> None:
    canvas -= np.mean(canvas)
    fade = min(round(.025 * SR), len(canvas) // 4)
    canvas[-fade:] *= np.linspace(1, 0, fade)
    canvas *= .76 / max(.76, np.max(np.abs(canvas)))
    pcm = (np.clip(canvas, -1, 1) * 32767).astype("<i2")
    OUT.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUT / name), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SR)
        wav.writeframes(pcm.tobytes())


# A brief tea pour and the cup touching its saucer as collection starts.
x = np.zeros(round(.38 * SR))
pour = noise(.27, 500, 3400) * np.exp(-np.arange(round(.27 * SR)) / SR / .13)
put(x, pour, 0, .22)
put(x, noise(.045, 900, 4600) * np.exp(-np.arange(round(.045 * SR)) / SR / .014), .105, .24)
put(x, ceramic(760, .22, .066), .12, .31)
finish("collect_grab.wav", x)

# One dry porcelain tap per arriving prize; the 140 ms tail stays clear at 90 ms spacing.
x = np.zeros(round(.14 * SR))
put(x, ceramic(910, .13, .036), 0, .43)
put(x, noise(.018, 2400, 7900) * np.exp(-np.arange(round(.018 * SR)) / SR / .004), 0, .17)
put(x, ceramic(1250, .085, .022), .044, .13)
finish("coin_in.wav", x)

# A wooden seal landing, answered by a small jade cup ring.
x = np.zeros(round(.38 * SR))
t = np.arange(round(.12 * SR)) / SR
wood = (np.sin(2 * np.pi * (155 - 90 * t) * t) * np.exp(-t / .03))
put(x, wood, 0, .42)
put(x, noise(.055, 200, 2100) * np.exp(-np.arange(round(.055 * SR)) / SR / .015), 0, .28)
put(x, ceramic(670, .29, .09), .065, .27)
finish("collect_stamp.wav", x)
