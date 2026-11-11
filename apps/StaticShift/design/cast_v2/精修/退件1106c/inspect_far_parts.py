from pathlib import Path
import json,numpy as np
from PIL import Image,ImageDraw
from render_core import prep,draw,affine
P=Path(__file__).resolve().parent;D=P/'candidate/host';J=json.loads((D/'layout.json').read_text())['joints'];f=next(f for f in json.loads((P/'host-actual-frames.json').read_text())['frames']if f['anim']=='win_big'and f['time']==1);L=prep(D);M=affine(dict(f['slots'])['arm_l_lower']);W=(M@[*J['wrist_l'],1])[:2];out=Image.new('RGB',(1200,600),'#e5e2d6')
for i,n in enumerate(['arm_l_lower','hand_l_open']):out.paste(draw(L,[s for s in f['slots']if s[0]==n],np.round(W-[100,100]),(200,200)).resize((600,600),Image.Resampling.NEAREST).convert('RGB'),(i*600,0))
out.save(P/'inputs/far-parts-candidate.png')
