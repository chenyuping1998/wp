"""Extend the authored eye-radiance and flight materials to the readable v4 clock."""
from pathlib import Path
APP=Path(__file__).resolve().parent.parent
p=APP/'design/source/medusagaze/audio/upgrade_multiplier.py';s=p.read_text(encoding='utf-8')
if 'd=.76;t=np.arange' in s:
    print('Signature v4 sound material is already installed.');raise SystemExit(0)
start=s.index('d=.28;t=np.arange(round(d*FS))/FS\nexport(\'sfx_gaze_beam\'')
end=s.index('for size,d,pitch,peak in',start)
s=s[:start]+'''d=.76;t=np.arange(round(d*FS))/FS
export('sfx_gaze_beam',d,[('focus_snap',0,noise(.12,1600,7800)*pulse(.12,.0007,.028)*.55),('glass_resonance',0,modal(d,1170,.25)*.36),('radiating_air',.025,noise(.68,700,4200)*pulse(.68,.035,.28)*.27),('gathering_prism',.19,modal(.53,1620,.20)*pulse(.53,.035,.22)*.20)],-11,'Green-eye focus, spreading airy radiance and gathering prism resonance; one unhurried performance at every turbo tier')

d=.60;t=np.arange(round(d*FS))/FS;shape=(.12+.88*np.sin(np.pi*np.minimum(1,t/.56))**1.1)*np.minimum(1,t/.008)
export('sfx_orb_fly',d,[('air_body',0,noise(d,330,2800)*shape*.65),('air_edge',0,noise(d,2700,8000)*shape**2*.3),('spinning_prism',0,modal(d,1780,.30)*(.25+.75*np.sin(2*np.pi*19*t)**2)*.14)],-13,'Six-hundred-ms granular flight and rotating glass texture; same duration and pitch at all turbo tiers, panned along the orb trajectory')
''' + s[end:]
s=s.replace("meta['multiplier_design_version']=2","meta['multiplier_design_version']=4").replace("report={'version':2","report={'version':4")
s=s.replace('MULTIPLIER_V2_SOUND_DESIGN','MULTIPLIER_V4_SOUND_DESIGN')
s=s.replace("montage=mix(2.7,[(0,mixes['sfx_gaze_charge']*.65),(.2,mixes['sfx_glasses_slide']*.85),(.6,mixes['sfx_gaze_beam']*.75),(.75,mixes['sfx_orb_fly']*.8),(1.2,mixes['sfx_orb_hit_m']), (1.48,mixes['sfx_glasses_on']*.75)])","montage=mix(3.2,[(0,mixes['sfx_gaze_charge']*.65),(.2,mixes['sfx_glasses_slide']*.85),(.6,mixes['sfx_gaze_beam']*.75),(1.25,mixes['sfx_orb_fly']*.8),(1.85,mixes['sfx_orb_hit_m']), (2.18,mixes['sfx_glasses_on']*.75)])")
p.write_text(s,encoding='utf-8')
print('Aligned eye-radiance and orb flight sound synthesis to v4 timing.')
