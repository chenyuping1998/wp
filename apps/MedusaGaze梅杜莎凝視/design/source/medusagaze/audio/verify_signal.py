"""Quantitative signal checks; does not replace a human listening sign-off."""
from pathlib import Path
import importlib.util
import json
import subprocess
import numpy as np
from scipy.io import wavfile

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('medusa_audio',HERE/'generate_audio.py')
generator=importlib.util.module_from_spec(spec)
spec.loader.exec_module(generator)
peaks=[]
for index in range(1,6):
    rate,samples=wavfile.read(generator.RUNTIME/f'sfx_petrify_{index}.wav')
    samples=samples.astype(float)
    spectrum=np.abs(np.fft.rfft(samples*np.hanning(len(samples))))
    frequency=float(np.fft.rfftfreq(len(samples),1/rate)[np.argmax(spectrum)])
    peaks.append(round(frequency,2))
assert all(a<b for a,b in zip(peaks,peaks[1:])),peaks
loops=[]
for name in ('bgm_base','bgm_feature'):
    result=subprocess.run([generator.FFMPEG,'-hide_banner','-nostdin','-i',str(generator.RUNTIME/(name+'.ogg')),
                           '-f','f32le','-ar','48000','-ac','2','-'],capture_output=True,check=True)
    samples=np.frombuffer(result.stdout,dtype='<f4').reshape(-1,2)
    jump=float(np.max(np.abs(samples[-1]-samples[0])))
    expected=64*48000
    assert len(samples)==expected,(name,len(samples),expected)
    assert jump<.01,(name,jump)
    loops.append({'cue':name,'decoded_frames_48k':len(samples),'seam_step_linear':round(jump,8),
                  'seam_step_dbfs':round(float(20*np.log10(max(jump,1e-9))),2)})
data={'petrify_dominant_hz':peaks,'decoded_bgm_loops':loops,
      'method':'FFT peak on complete Hann-windowed runtime petrify cues; FFmpeg Vorbis decode to 48 kHz float stereo, exact frame count and last-to-first sample step.',
      'limits':'Signal checks only. No claim of human voice acting, speaker translation, 20-spin subjective comfort or subjective musical approval.'}
(HERE/'SIGNAL_QA.json').write_text(json.dumps(data,ensure_ascii=False,indent=2,allow_nan=False)+'\n',encoding='utf-8')
print(json.dumps(data,ensure_ascii=False))
