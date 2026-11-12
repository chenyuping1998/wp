"""Pack original warden imagegen art and its separately generated underpaint.
Explicit masks, registration, PSD and alpha cropping; never paints replacement art.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import label
from pytoshop import enums
from pytoshop.image_data import ImageData
from pytoshop.user.nested_layers import Image as PsdImage,nested_layers_to_psd
from psd_tools import PSDImage
D=Path(__file__).resolve().parent/'_incoming/fg'
SIZE=(1024,2048)
SX,SY,OX,OY=.85,1.086,100,12
SHAPES={
'arm_r':[(209,308),(299,305),(332,391),(351,441),(295,570),(252,626),(134,633),(86,559),(87,468),(158,383)],
'arm_l':[(611,335),(685,345),(732,387),(775,502),(799,625),(831,781),(828,901),(796,991),(734,1006),(700,957),(720,848),(704,777),(671,714),(650,570)],
'head':[(330,35),(584,40),(612,155),(556,291),(552,362),(410,361),(368,302),(335,218)],
'dangle_chain':[(449,479),(470,477),(482,592),(449,598),(433,533)],
'dangle_mask':[(568,307),(617,308),(656,455),(670,665),(644,675),(614,482),(578,395)],
'fingers_r':[(224,313),(290,307),(313,341),(319,375),(281,395),(248,385),(225,354)],
}
def cleaned(path):
 im=Image.open(path).convert('RGBA');a=np.asarray(im).copy();alpha=a[:,:,3];labs,n=label(alpha>16);sizes=np.bincount(labs.ravel());sizes[0]=0
 keep=np.zeros_like(alpha,dtype=bool)
 for k in range(1,n+1):
  if sizes[k]>100:keep|=labs==k
 from scipy.ndimage import binary_dilation
 keep=binary_dilation(keep,iterations=3);a[~keep]=0
 return Image.fromarray(a)
def normalize(im,shift=0):
 a=np.asarray(im).copy();pad=150
 b=np.zeros((a.shape[0],a.shape[1]+2*pad,4),dtype=np.uint8)
 for y in range(a.shape[0]):
  off=pad+round(shift*min(1,max(0,(y-490)/150)))
  b[y,off:off+a.shape[1]]=a[y]
 im=Image.fromarray(b).resize((round(b.shape[1]*SX),round(b.shape[0]*SY)),Image.Resampling.LANCZOS)
 out=Image.new('RGBA',SIZE);out.alpha_composite(im,(round(OX-pad*SX),OY));return out
def main():
 src=cleaned(D/'source/full_raw.png');under=cleaned(D/'source/body_raw.png');layers={}
 under=under.transform(src.size,Image.Transform.AFFINE,(1,0,0,0,1/1.023,6/1.023),resample=Image.Resampling.BICUBIC)
 for n,pts in SHAPES.items():
  m=Image.new('L',src.size);ImageDraw.Draw(m).polygon(pts,fill=255);m=m.filter(ImageFilter.GaussianBlur(.8))
  ar=np.asarray(src).copy();ar[:,:,3]=np.minimum(ar[:,:,3],np.asarray(m));ar[ar[:,:,3]==0]=0
  layers[n]=normalize(Image.fromarray(ar),0 if n=='arm_r' else 45 if n=='arm_l' else 0)
 layers['body']=normalize(under)
 prop=cleaned(D/'source/prop_raw.png');box=prop.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox()
 prop=prop.crop(box).resize((267,187),Image.Resampling.LANCZOS);aligned=Image.new('RGBA',src.size);aligned.alpha_composite(prop,(128,218));layers['prop_bat']=normalize(aligned)
 spec=json.loads((D.parent.parent/'cast_brief/fg/layers.template.json').read_text())
 # Joint positions are measured on the new drawing, not on the old archetype.
 points={'head_top':(451,55),'neck':(465,337),'chest':(465,470),'waist':(465,710),'hips':(465,875),
 'shoulder_r':(309,402),'elbow_r':(160,551),'wrist_r':(241,376),'shoulder_l':(689,430),'elbow_l':(801,700),'wrist_l':(798,922)}
 spec['joints']={k:[round(x*SX+OX),round(y*SY+OY)] for k,(x,y) in points.items()}
 spec['anchors']={'prop_bat':[round(255*SX+OX),round(350*SY+OY)],'dangle_chain':[round(459*SX+OX),round(485*SY+OY)],'dangle_mask':[round(582*SX+OX),round(312*SY+OY)]}
 spec['arms']={'l':'hanging','r':'raised'}
 spec['provenance']='Native imagegen original full figure and separate hidden-body underpaint. Explicit aligned cutouts and separately generated complete nightstick; source and prompts retained.'
 full=Image.new('RGBA',SIZE)
 for n in spec['order']:
  layers[n].save(D/(n+'.png'),optimize=True);full.alpha_composite(layers[n])
 full.save(D/'full.png');(D/'layers.json').write_text(json.dumps(spec,indent=2))
 ps=[]
 for n in reversed(spec['order']):
  a=np.asarray(layers[n]);ps.append(PsdImage(name=n,channels={enums.ChannelId.red:a[:,:,0],enums.ChannelId.green:a[:,:,1],enums.ChannelId.blue:a[:,:,2],enums.ChannelId.transparency:a[:,:,3]},top=0,left=0))
 p=nested_layers_to_psd(ps,enums.ColorMode.rgb,size=SIZE,compression=enums.Compression.raw);p.num_channels=4;p.image_data=ImageData(channels=np.asarray(full).transpose(2,0,1),compression=enums.Compression.raw)
 with (D/'cast.psd').open('wb') as f:p.write(f)
 p=PSDImage.open(D/'cast.psd')
 for l in p:l.name=l.name.rstrip('\x00')
 p.save(D/'cast.psd')
 print('packed',D)
if __name__=='__main__':main()
