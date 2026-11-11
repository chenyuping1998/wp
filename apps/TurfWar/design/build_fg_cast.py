"""Pack original Kingpin imagegen art and its separately generated underpaint.
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
SX,SY,OX,OY=.75,.956,170,77
SHAPES={
'arm_r':[(180,365),(300,355),(302,465),(257,575),(231,697),(194,805),(208,963),(120,1000),(65,975),(55,830),(75,670),(115,515)],
'arm_l':[(611,350),(713,357),(775,470),(822,660),(853,805),(847,979),(752,1000),(701,967),(709,875),(726,780),(687,670),(645,508)],
'head':[(350,84),(544,84),(561,220),(550,285),(542,348),(399,352),(374,291),(357,208)],
'prop_cigar':[(527,211),(594,204),(600,231),(531,235)],
'dangle_smoke':[(567,72),(617,72),(624,204),(585,219),(575,187)],
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
 for n,pts in SHAPES.items():
  m=Image.new('L',src.size);ImageDraw.Draw(m).polygon(pts,fill=255);m=m.filter(ImageFilter.GaussianBlur(.8))
  ar=np.asarray(src).copy();ar[:,:,3]=np.minimum(ar[:,:,3],np.asarray(m));ar[ar[:,:,3]==0]=0
  layers[n]=normalize(Image.fromarray(ar),-85 if n=='arm_r' else 85 if n=='arm_l' else 0)
 layers['body']=normalize(under)
 spec=json.loads((D.parent.parent/'cast_brief/fg/layers.template.json').read_text())
 # Joint positions are measured on the new drawing, not on the old archetype.
 points={'head_top':(455,103),'neck':(466,315),'chest':(464,450),'waist':(464,760),'hips':(464,920),
 'shoulder_r':(255,405),'elbow_r':(95,710),'wrist_r':(72,903),'shoulder_l':(662,405),'elbow_l':(820,710),'wrist_l':(840,903)}
 spec['joints']={k:[round(x*SX+OX),round(y*SY+OY)] for k,(x,y) in points.items()}
 spec['anchors']={'prop_cigar':[round(535*SX+OX),round(222*SY+OY)],'dangle_smoke':[round(588*SX+OX),round(213*SY+OY)]}
 spec['arms']={'l':'hanging','r':'hanging'}
 spec['provenance']='Native imagegen original full figure and separate hidden-body underpaint. Explicit aligned cutouts; source and prompts retained.'
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
