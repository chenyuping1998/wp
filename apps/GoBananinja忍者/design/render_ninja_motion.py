"""Animated preview of real runtime vertices (not a separate animation)."""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from render_ninja_frames import draw

data=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
dest=Path(sys.argv[2])
box=[float(v) for v in sys.argv[3].split(',')] if len(sys.argv)>3 else [180,550,880,1530]
x0,y0,x1,y1=box
scale=min(420/(x1-x0),640/(y1-y0))
w,h=round((x1-x0)*scale),round((y1-y0)*scale)
texture=np.asarray(Image.open(data['page']).convert('RGBA'),float)/255
frames=[]
for frame in data['frames']:
    pixels=np.zeros((h,w,3))+np.array([.09,.12,.18])
    for slot in frame['slots']:
        world=np.array(slot['verts']).reshape(-1,2)
        points=np.column_stack(((world[:,0]+512-x0)*scale,(1510-world[:,1]-y0)*scale))
        if points[:,0].max()<0 or points[:,0].min()>=w or points[:,1].max()<0 or points[:,1].min()>=h:
            continue
        triangles=np.array(slot['tris']).reshape(-1,3)
        bounds=points[triangles]
        visible=(bounds[:,:,0].max(1)>=0)&(bounds[:,:,0].min(1)<w)&(bounds[:,:,1].max(1)>=0)&(bounds[:,:,1].min(1)<h)
        draw(pixels,points,np.array(slot['uvs']).reshape(-1,2),triangles[visible].reshape(-1),texture)
    image=Image.fromarray((np.clip(pixels,0,1)*255).astype(np.uint8))
    ImageDraw.Draw(image).text((8,8),f"{data['anim']}   {frame['t']:.2f}s",fill=(240,225,190))
    frames.append(image)
duration=round(1000*(data['frames'][1]['t']-data['frames'][0]['t'])) if len(frames)>1 else 80
frames[0].save(dest,save_all=True,append_images=frames[1:],duration=duration,loop=0,optimize=False,disposal=2)
pick=[frames[round(i*(len(frames)-1)/4)] for i in range(5)]
contact=Image.new('RGB',(w*5,h))
for i,frame in enumerate(pick):
    contact.paste(frame,(i*w,0))
contact.save(dest.with_suffix('.png'))
print(dest)
