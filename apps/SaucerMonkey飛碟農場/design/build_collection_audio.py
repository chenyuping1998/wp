"""Original collection foley, with periodic beds for gapless Web Audio loops."""
from pathlib import Path
import json, wave
import numpy as np

APP = Path(__file__).resolve().parents[1]
SAUCER = APP.name.startswith('Saucer')
THEME = 'saucer' if SAUCER else 'putt'
OUT = APP / 'static/assets/audio' / THEME
SRC = APP / 'design/source' / THEME / 'audio/collection'
SR = 44100
rng = np.random.default_rng(1939 if SAUCER else 1962)

def write(name, a, peak):
    a = a / max(1e-9, np.max(np.abs(a))) * peak
    pcm = (a * 32767).astype('<i2').tobytes()
    for folder in (OUT, SRC):
        folder.mkdir(parents=True, exist_ok=True)
        with wave.open(str(folder / (name + '.wav')), 'wb') as f:
            f.setparams((1, 2, SR, len(a), 'NONE', 'not compressed'))
            f.writeframes(pcm)

def periodic_noise(n, low, high):
    bins = np.fft.rfftfreq(n, 1 / SR)
    spectrum = np.exp(1j * rng.uniform(0, 2*np.pi, len(bins)))
    spectrum *= ((bins >= low) & (bins <= high))
    return np.fft.irfft(spectrum, n) * np.sqrt(n)

if SAUCER:
    t = np.arange(round(SR*1.6))/SR
    # Every frequency and modulation completes whole cycles at the boundary.
    hum = sum(np.sin(2*np.pi*f*t + .12*np.sin(2*np.pi*5*t))/k
              for k, f in enumerate((65,130,195,390), 1))
    bed = hum*(.8+.2*np.cos(2*np.pi*2.5*t))
    bed += periodic_noise(len(t), 450, 1900)*.022
    write('tractor_loop', bed, .32)
    description = 'Periodic saucer motor, pulsing tractor beam and filtered air; collection only.'
else:
    t = np.arange(round(SR*1.2))/SR
    bed = periodic_noise(len(t), 180, 1300)*(.12+.035*np.cos(2*np.pi*10*t))
    bed += .18*np.sin(2*np.pi*125*t)*(.75+.25*np.cos(2*np.pi*15*t))
    write('putt_roll_loop', bed, .20)
    t = np.arange(round(SR*.14))/SR
    hit = (.7*np.sin(2*np.pi*1450*t)*np.exp(-85*t)
           + .35*np.sin(2*np.pi*260*t)*np.exp(-40*t)
           + rng.normal(0,.13,len(t))*np.exp(-120*t))
    hit *= np.minimum(1,t/.0015)*np.minimum(1,(.14-t)/.015)
    write('putt_tap', hit, .48)
    t = np.arange(round(SR*.32))/SR
    cup = sum(np.sin(2*np.pi*f*t)*np.exp(-d*t)*g for f,d,g in
              ((540,24,.5),(1480,32,.28),(320,18,.5)))
    cup += rng.normal(0,.035,len(t))*np.exp(-45*t)
    cup *= np.minimum(1,t/.002)*np.minimum(1,(.32-t)/.025)
    write('putt_sink', cup, .52)
    description = 'Periodic turf roll, putter contact and hollow cup drop; original synthesis.'

(SRC/'manifest.json').write_text(json.dumps({
    'theme':THEME,'description':description,'sampleRate':SR,
    'format':'mono PCM16 WAV','externalSamples':False,
    'files':[p.name for p in SRC.glob('*.wav')]
},indent=2)+'\n',encoding='utf-8')
print(THEME+': collection foley built')
