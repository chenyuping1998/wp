"""Compact animated contact sheet of the actual runtime skinning poses."""
from pathlib import Path
import json,cv2,numpy as np
from PIL import Image,ImageDraw,ImageFont
D=Path(__file__).resolve().parent;S=156
poses=json.loads((D/'.volt_preview_poses.json').read_text());keys=list(poses)
assets=D.parent/'static/assets/sprites/voltSymbols';frames=[]
yy,xx=np.mgrid[0:S,0:S].astype('float32');xy=np.dstack([xx,yy]);grid=np.mgrid[0:49,0:49].transpose(1,2,0)[:,:,::-1].astype('float32')/48*(S-1)
art={}
for key in keys:
 k=key.lower();art[key]=[np.asarray(Image.open(assets/f'{k}_{suffix}.webp').convert('RGBA').resize((S,S)),dtype='float32')/255 for suffix in ['plate','subject']]
for f in range(31):
 sheet=Image.new('RGB',(S*6,(S+24)*2+32),'#15202b');d=ImageDraw.Draw(sheet);d.text((12,10),'VOLT MONSTER  /  runtime rig preview',fill='#caffef')
 for i,key in enumerate(keys):
  disp=np.asarray(poses[key][f],dtype='float32').reshape(49,49,2)/256*S
  field=cv2.resize(disp,(S,S),interpolation=cv2.INTER_LINEAR);uv=xy.copy()
  for _ in range(4):
   off=cv2.remap(field,uv[:,:,0],uv[:,:,1],cv2.INTER_LINEAR,borderMode=cv2.BORDER_REPLICATE);uv=xy-off
  plate,subject=art[key];warped=cv2.remap(subject,uv[:,:,0],uv[:,:,1],cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT)
  bg=np.full((S,S,3),[.083,.125,.169],dtype='float32');bg=bg*(1-plate[:,:,3:])+plate[:,:,:3]*plate[:,:,3:]
  alpha=np.clip(warped[:,:,3:],0,1);rgb=bg*(1-alpha)+warped[:,:,:3]*alpha
  x=i%6*S;y=i//6*(S+24)+32;sheet.paste(Image.fromarray((np.clip(rgb,0,1)*255).astype('uint8')),(x,y));d.text((x+S/2-10,y+S+4),key,fill='#caffef')
 frames.append(sheet)
out=D/'source/volt_delivery/symbol_motion_preview.gif';frames[0].save(out,save_all=True,append_images=frames[1:],duration=50,loop=0,optimize=False)
frames[8].save(D/'source/volt_delivery/symbol_motion_contact.png')
(D/'.volt_preview_poses.json').unlink()
print(out)
