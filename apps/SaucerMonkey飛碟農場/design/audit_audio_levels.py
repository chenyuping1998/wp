"""Measure runtime PCM clips and music; save a reproducible technical audio audit."""
from pathlib import Path
import json, wave, subprocess, re
import numpy as np
import imageio_ffmpeg

APP = Path(__file__).resolve().parents[1]
THEME = 'saucer' if APP.name.startswith('Saucer') else 'putt'
AUDIO = APP / 'static/assets/audio' / THEME
rows = []
for p in sorted(AUDIO.glob('*.wav')):
    with wave.open(str(p)) as f:
        rate, channels = f.getframerate(), f.getnchannels()
        assert f.getsampwidth() == 2, p
        a = np.frombuffer(f.readframes(f.getnframes()), dtype='<i2').astype(float)/32768
    peak = float(np.max(np.abs(a)))
    rms = float(np.sqrt(np.mean(a*a)))
    row = dict(file=p.name, seconds=len(a)/rate/channels, sampleRate=rate,
               channels=channels, peakDBFS=round(20*np.log10(max(peak,1e-12)),2),
               rmsDBFS=round(20*np.log10(max(rms,1e-12)),2),
               clippedSamples=int(np.count_nonzero(np.abs(a)>=.999)))
    if 'loop' in p.stem:
        row['wrapStep'] = round(float(abs(a[-1]-a[0])),6)
        row['largestStep'] = round(float(np.max(np.abs(np.diff(a)))),6)
        assert row['wrapStep'] <= row['largestStep']*1.05, row
    assert peak > .001 and row['clippedSamples'] == 0, row
    rows.append(row)
music = []
for p in sorted(AUDIO.glob('bgm_*.mp3')):
    result = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-hide_banner','-i',str(p),
        '-af','loudnorm=I=-18:TP=-1:LRA=7:print_format=json','-f','null','-'],
        capture_output=True,text=True,encoding='utf-8',errors='replace',check=True)
    measure = json.loads(re.findall(r'\{[^{}]*"input_i"[^{}]*\}',result.stderr,re.S)[-1])
    assert -19 <= float(measure['input_i']) <= -17, measure
    assert float(measure['input_tp']) <= -1, measure
    music.append(dict(file=p.name,measurements=measure))
report = dict(theme=THEME,pcm=rows,music=music,
              scope='Technical levels, decoding and loop boundary; no claim of subjective listening approval.')
(APP/'design/qa/audio-level-audit.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(f'{THEME}: {len(rows)} PCM clips decode, no clipping; {len(music)} music loops within -18 +/-1 LUFS and <= -1 dBTP')
