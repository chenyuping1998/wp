"""Rebuild the ten-second v9 audition from the delivered runtime sounds."""
from pathlib import Path
import numpy as np
from scipy.io import wavfile
from scipy.signal import resample
root=Path(__file__).resolve().parent
runtime=root.parents[3]/'static/assets/audio/medusa'
fs=48000;out=np.zeros(fs*10)
def add(at,cue,gain=1,rate=1):
 sr,x=wavfile.read(runtime/(cue+'.wav'));x=x.astype(float)/32768
 x=resample(x,round(len(x)*fs/sr/rate));start=round(at*fs);n=min(len(x),len(out)-start)
 if n>0:out[start:start+n]+=x[:n]*gain
for start,release,free in [(0,1.45,False),(6.5,1.05,True)]:
 if not free:add(start+.2,'sfx_glasses_slide',.9)
 add(start,'sfx_gaze_charge',.8);add(start+(.2 if free else .6),'sfx_gaze_beam',.8)
 add(start+release-.35,'sfx_medusa_gather',.58);add(start+release-.35,'sfx_orb_charge',.95)
 add(start+release-.10,'vo_medusa_cast',1.7,.92);add(start+release-.10,'sfx_snakes_hiss',.6,.9)
 add(start+release-.015,'sfx_medusa_wrist',.46);add(start+release,'sfx_orb_release',1.1)
 add(start+release,'sfx_orb_fly',1.4);add(start+release+.2,'sfx_medusa_jewel',.4)
 add(start+release+.3,'sfx_medusa_tail',.4);add(start+release+.6,'sfx_orb_hit_m',1.15)
 if not free:add(start+2.38,'sfx_glasses_on',.8)
add(3.16,'sfx_medusa_gather',.58);add(3.29,'vo_medusa_hmm',.58,1.04);add(3.36,'sfx_medusa_jewel',.4)
add(4.79,'sfx_snake_snap',.3);add(5.14,'sfx_snake_snap',.19,1.08)
out=np.tanh(out*1.1);out*=10**(-3/20)/max(np.abs(out).max(),1e-9)
wavfile.write(root/'CHARACTER_V9_AUDITION.wav',fs,(out*32767).astype(np.int16))
print('Wrote CHARACTER_V9_AUDITION.wav: MG cast, thumb-up, double bite, FG cast.')
