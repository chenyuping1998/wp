"""Capture/compare the character scratch tone while keeping its 3.2s timing."""
import json
import shutil
import sys
import wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).parent
LIVE = ROOT.parent / "static/assets/audio/neon/dj_scratch.wav"
OUT = ROOT / "source/neon_delivery/audio_preview"
REPORT = OUT / "dj_scratch_light_comparison.json"

def measure(path):
    with wave.open(str(path)) as wav:
        x = np.frombuffer(wav.readframes(wav.getnframes()), dtype="<i2").astype(float) / 32768
        sr = wav.getframerate()
    hz = np.fft.rfftfreq(len(x), 1 / sr)
    power = np.abs(np.fft.rfft(x)) ** 2
    return {
        "duration": len(x) / sr,
        "rmsDbFS": round(float(20*np.log10(np.sqrt(np.mean(x*x)))), 2),
        "peakDbFS": round(float(20*np.log10(max(abs(x)))), 2),
        "lowBelow250Pct": round(float(power[hz<250].sum()/power.sum()*100), 3),
        "lowBelow500Pct": round(float(power[hz<500].sum()/power.sum()*100), 3),
    }

if "--capture-before" in sys.argv:
    shutil.copy2(LIVE, OUT / "dj_mascot_before_light.wav")
    result = {"before": measure(LIVE)}
else:
    result = json.loads(REPORT.read_text())
    result["after"] = measure(LIVE)
    result["fileRmsChangeDb"] = round(result["after"]["rmsDbFS"]-result["before"]["rmsDbFS"],2)
    result["runtimeGainBefore"] = .76
    result["runtimeGainAfter"] = .52
    result["runtimeRmsChangeDb"] = round(result["fileRmsChangeDb"]+20*np.log10(.52/.76),2)
REPORT.write_text(json.dumps(result,indent=2),encoding="utf8")
print(json.dumps(result,indent=2))
