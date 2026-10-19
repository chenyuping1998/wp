"""Six close-ups of the runtime's actual strap meshes and physics."""
import json
import sys
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
from render_ninja_frames import draw

data=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
texture=np.asarray(Image.open(data['page']).convert('RGBA'),float)/255
panels=[('HEAD BANDS',(350,665,515,860)),('SLEEVE TIES',(245,900,410,1095)),
        ('WAIST TIES',(335,1030,680,1240)),('LEFT SHIN',(326,1280,482,1480)),
        ('RIGHT SHIN',(545,1280,692,1465)),('HEEL TIE',(545,1390,685,1510))]
frames=[]
for frame in data['frames']:
    sheet=Image.new('RGB',(720,600),(22,29,43))
    for k,(label,(x0,y0,x1,y1)) in enumerate(panels):
        scale=min(230/(x1-x0),270/(y1-y0))
        w,h=round((x1-x0)*scale),round((y1-y0)*scale)
        pixels=np.zeros((h,w,3))+np.array([22,29,43])/255
        for slot in frame['slots']:
            v=np.array(slot['verts']).reshape(-1,2)
            pts=np.column_stack(((v[:,0]+512-x0)*scale,(1510-v[:,1]-y0)*scale))
            if pts[:,0].max()<0 or pts[:,0].min()>=w or pts[:,1].max()<0 or pts[:,1].min()>=h:
                continue
            triangles=np.array(slot['tris']).reshape(-1,3)
            bounds=pts[triangles]
            visible=(bounds[:,:,0].max(1)>=0)&(bounds[:,:,0].min(1)<w)&(bounds[:,:,1].max(1)>=0)&(bounds[:,:,1].min(1)<h)
            draw(pixels,pts,np.array(slot['uvs']).reshape(-1,2),triangles[visible].reshape(-1),texture)
        im=Image.fromarray((np.clip(pixels,0,1)*255).astype(np.uint8))
        x,y=(k%3)*240,(k//3)*300
        sheet.paste(im,(x+(240-w)//2,y+26))
        ImageDraw.Draw(sheet).text((x+8,y+6),label,fill=(240,225,190))
    frames.append(sheet)
out=Path(sys.argv[2])
frames[0].save(out,save_all=True,append_images=frames[1:],duration=100,loop=0,optimize=False,disposal=2)
frames[len(frames)//2].save(out.with_suffix('.png'))
print(out)
