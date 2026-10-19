from pathlib import Path
import sys
import cv2
import numpy as np
from PIL import Image, ImageDraw

folder = Path(sys.argv[1]); cast = sys.argv[2]
rest = np.asarray(Image.open(folder / f'{cast}_cutout/head_2_face.png').convert('RGBA'))
target = np.asarray(Image.open(folder / f'{cast}_laugh_generated.png').convert('RGBA').resize((rest.shape[1], rest.shape[0]), Image.Resampling.LANCZOS))
rgb0 = cv2.cvtColor(rest[:,:,:3], cv2.COLOR_RGB2GRAY)
rgb1 = cv2.cvtColor(target[:,:,:3], cv2.COLOR_RGB2GRAY)
flow01 = cv2.calcOpticalFlowFarneback(rgb0,rgb1,None,.5,5,31,5,7,1.5,0)
flow10 = cv2.calcOpticalFlowFarneback(rgb1,rgb0,None,.5,5,31,5,7,1.5,0)
h,w=rgb0.shape
xx,yy=np.meshgrid(np.arange(w,dtype=np.float32),np.arange(h,dtype=np.float32))
out=Image.new('RGB',(w*5,h),'#aaa')
for i,t in enumerate([0,.2,.45,.73,1]):
    map0x=xx-t*flow01[:,:,0]; map0y=yy-t*flow01[:,:,1]
    map1x=xx-(1-t)*flow10[:,:,0]; map1y=yy-(1-t)*flow10[:,:,1]
    a=cv2.remap(rest,map0x,map0y,cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
    b=cv2.remap(target,map1x,map1y,cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
    pix=np.clip(a.astype(float)*(1-t)+b.astype(float)*t,0,255).astype('uint8')
    pix[:,:,3]=rest[:,:,3]
    im=Image.fromarray(pix,'RGBA')
    out.paste(im,(i*w,0),im)
out.save('E:/stake/wp/tmp/face_flow_test.png')
