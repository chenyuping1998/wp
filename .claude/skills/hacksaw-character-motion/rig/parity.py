# -*- coding: utf-8 -*-
"""
Check that the JavaScript runtime and the Python model agree, numerically.

    python rig/parity.py            # needs node on PATH

The constants are generated from one source, so they cannot disagree. The
FUNCTIONS are hand-written twice -- `wave`, `oddBeat`, the reaction envelope,
the kick -- and that is where a silent divergence would live. A sign flipped in
the JS envelope would still look like an animation; it would just not be the
animation the gate measured.

So both sides are evaluated over a whole loop and compared. Anything above
1e-9 is a real difference, not floating point.
"""
from __future__ import print_function
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import motion

JS = r"""
import {IDLE, REACTION, REACTION_LIFT, REACTION_PROP, REACTION_SCALE, SCALE_K,
  FLUTTER, LOOP_MS, REACTION_MS, SNAP, HOLD} from './motion.generated.js';
function wave(u){u-=Math.floor(u);const v=u<0.38?u/0.38:1-(u-0.38)/0.62;
  return v*v*(3-2*v)*2-1;}
function oddBeat(q){return q<0.5||q>0.74?0:-Math.sin(Math.PI*(q-0.5)/0.24);}
function idleAngle(s,t){const[a,l,p,o]=s; if(!a)return 0; const ph=t-l;
  let r=a*wave(ph/p); r+=a*0.25*Math.sin(Math.PI*2*ph/LOOP_MS);
  if(o)r+=a*o*oddBeat((((ph%LOOP_MS)+LOOP_MS)%LOOP_MS)/LOOP_MS); return r;}
function env(u){if(u<=0||u>=1)return 0;
  if(u<SNAP){const t=u/SNAP;return t*t*(3-2*t);}
  if(u<HOLD)return 1; const t=1-(u-HOLD)/(1-HOLD); return t*t*(3-2*t);}
function kick(u,at=0.5,w=0.1){if(u<at||u>at+w)return 0;
  return Math.sin(Math.PI*(u-at)/w);}
// the squash-and-stretch channel, sampled the same way the runtime computes it
function scaleAt(name,t,start){const tgt=REACTION_SCALE[name]; if(!tgt)return[1,1];
  const u=(t-start)/REACTION_MS, e=env(u); if(e<=0)return[1,1];
  let f=0; if(u>=SNAP&&u<=HOLD) f=FLUTTER.depth*Math.sin(2*Math.PI*(t-start)/FLUTTER.periodMs);
  const g=e*SCALE_K*(1+f);
  return [1+(tgt[0]-1)*g, 1+(tgt[1]-1)*g];}
const out={idle:{},env:[],kick:[],scale:{}};
for(const k of Object.keys(REACTION_SCALE)){
  out.scale[k]=[]; for(let t=0;t<=REACTION_MS;t+=7) out.scale[k].push(scaleAt(k,t,0));
}
for(const k of Object.keys(IDLE)){
  out.idle[k]=[]; for(let t=0;t<LOOP_MS;t+=37) out.idle[k].push(idleAngle(IDLE[k],t));
}
for(let i=0;i<=100;i++){out.env.push(env(i/100)); out.kick.push(kick(i/100));}
process.stdout.write(JSON.stringify(out));
"""


def main():
    rt = os.path.join(HERE, 'runtime')
    gen = os.path.join(rt, 'motion.generated.js')
    if not os.path.exists(gen):
        print('run rig/export_motion.py first'); return 1
    with tempfile.NamedTemporaryFile('w', suffix='.mjs', dir=rt, delete=False,
                                     encoding='utf-8') as f:
        f.write(JS)
        tmp = f.name
    try:
        r = subprocess.run(['node', tmp], capture_output=True, text=True)
    except OSError:
        print('node not found on PATH -- cannot check parity'); return 1
    finally:
        os.unlink(tmp)
    if r.returncode:
        print(r.stderr); return 1
    js = json.loads(r.stdout)

    worst = 0.0
    where = ''
    for k, vals in js['idle'].items():
        for i, v in enumerate(vals):
            t = i * 37
            p = motion.angle(motion.DEFAULTS[k], t)
            d = abs(p - v)
            if d > worst:
                worst, where = d, '%s at t=%dms (py %.12f, js %.12f)' % (k, t, p, v)
    for i, v in enumerate(js['env']):
        d = abs(motion.react_envelope(i / 100.0) - v)
        if d > worst:
            worst, where = d, 'react_envelope at u=%.2f' % (i / 100.0)
    for i, v in enumerate(js['kick']):
        d = abs(motion.react_kick(i / 100.0) - v)
        if d > worst:
            worst, where = d, 'react_kick at u=%.2f' % (i / 100.0)

    # the squash-and-stretch channel. It has its own envelope, its own flutter
    # and its own bone frame, which is three more places for the two languages
    # to disagree without either of them looking broken.
    nscale = 0
    fake = [{'name': k, 'x': 0.0, 'y': 0.0, 'parent': -1} for k in js['scale']]
    for k, vals in js['scale'].items():
        one = [b for b in fake if b['name'] == k]
        for i, (ja, jc) in enumerate(vals):
            t = i * 7
            pa, pc = motion.reaction_scales(one, t, 0)[0]
            nscale += 2
            for p, j, lbl in ((pa, ja, 'along'), (pc, jc, 'across')):
                d = abs(p - j)
                if d > worst:
                    worst, where = d, ('scale %s %s at t=%dms (py %.12f, js %.12f)'
                                       % (k, lbl, t, p, j))

    n = (sum(len(v) for v in js['idle'].values()) + len(js['env'])
         + len(js['kick']) + nscale)
    print('compared %d values across %d bones, the envelope, the kick and the '
          'squash-and-stretch channel (%d values)' % (n, len(js['idle']), nscale))
    print('worst difference: %.3g%s' % (worst, ('   ' + where) if worst else ''))
    if worst > 1e-9:
        print('\nPARITY FAILED -- the JS and Python models are not the same animation')
        return 1
    print('PARITY OK')
    return 0


if __name__ == '__main__':
    import sys as _sys
    for _s in (_sys.stdout, _sys.stderr):  # Windows 的管線預設 cp950，agent 讀到會是亂碼
        if hasattr(_s, 'reconfigure'):
            _s.reconfigure(encoding='utf-8', errors='replace')
    sys.exit(main())
