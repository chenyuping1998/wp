"""Visual QA: new/old Sumo and Bandit reference, using evaluated Spine poses.
The reference column is comparison-only and never enters the game package.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import json, math
APP=Path(__file__).resolve().parents[1]
ROOT=APP.parents[2]
OUT=ROOT/'dist/sumomonkey-boxing-evidence'
OLD=ROOT/'_upload_backups/SumoMonkey-before-boxing-20261024/extracted'
BANDIT=Path('/Users/stone/tools/spine-generator/examples/characters/bandit-monkey')
W,H,S=420,440,.245

def actor(data,images,name,t):
    clip=data['clips'][name]
    pose=clip['frames'][min(len(clip['frames'])-1,round(min(t,clip['duration'])*clip['fps']))]
    out=Image.new('RGBA',(W,H),'#efeadc')
    for n,(a,b,c,d,x,y) in zip(data['names'],pose):
        a,b,c,d=a*S,b*S,c*S,d*S;x=180+x*S;y=406+y*S
        det=a*d-b*c
        if abs(det)<1e-8:continue
        inv=(d/det,-c/det,(c*y-d*x)/det,-b/det,a/det,(b*x-a*y)/det)
        out.alpha_composite(images[n].transform((W,H),Image.Transform.AFFINE,inv,Image.Resampling.BICUBIC))
    return out

def source(jsonfile,folder):
    data=json.loads(jsonfile.read_text())
    return data,{n:Image.open(folder/f'{n}.png').convert('RGBA') for n in data['names']}

for cast in ['mg','fg']:
    current=source(APP/f'src/game/sumoMotion_{cast}.json',APP/f'static/assets/sumoCast/{cast}')
    prior=source(OLD/f'src/game/sumoMotion_{cast}.json',OLD/f'static/assets/sumoCast/{cast}')
    ref=source(OUT/'bandit-reference-motion.json',BANDIT/'layers')
    frames=[];contacts=[]
    for name,clip in current[0]['clips'].items():
        for k in range(max(1,math.ceil(clip['duration']*12))):
            t=k/12
            row=Image.new('RGB',(W*3,H),'#efeadc')
            for i,((data,images),title) in enumerate(zip([ref,prior,current],['BANDIT reference','SUMO previous','SUMO boxing redraw'])):
                pic=actor(data,images,name,t);ImageDraw.Draw(pic).text((12,12),f'{title} / {cast.upper()} / {name}',fill='#282828');row.paste(pic,(W*i,0))
            frames.append(row)
            if k in {0,round(clip['duration']*6),max(0,math.ceil(clip['duration']*12)-1)}:
                contacts.append(row)
                row.save(OUT/f'{cast}-{name}-{k:02d}.png')
    frames[0].save(OUT/f'{cast}-motion-comparison.gif',save_all=True,append_images=frames[1:],duration=83,loop=0)
    sheet=Image.new('RGB',(W*3,H*len(contacts)),'#efeadc')
    for i,pic in enumerate(contacts):sheet.paste(pic,(0,H*i))
    sheet.save(OUT/f'{cast}-motion-contact.png')
    print(cast,len(frames),'frames',len(contacts),'contact rows')
