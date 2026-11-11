"""Remove paper fills from delivered transparent ink foregrounds, keep ink alpha."""
from pathlib import Path
import numpy as np
from PIL import Image

D=Path(__file__).resolve().parent
out=D/'_street/street_near'
out.mkdir(parents=True,exist_ok=True)
for mode in ('base','feature','epic'):
 im=Image.open(D/f'_incoming/street_near/bg_{mode}_near.png').convert('RGBA').resize((1920,1080),Image.Resampling.LANCZOS)
 a=np.asarray(im).astype(float)
 lum=a[:,:,:3]@[.2126,.7152,.0722]/255
 # Remove light paper fills; retain the black/grey ink strokes as alpha.
 alpha=a[:,:,3]*np.clip((.68-lum)/.55,0,1)
 alpha[:,384:1536]=0
 rgba=np.zeros((1080,1920,4),dtype=np.uint8)
 rgba[:,:,:3]=18
 rgba[:,:,3]=np.rint(alpha).astype(np.uint8)
 Image.fromarray(rgba).save(out/f'bg_{mode}_near.png',optimize=True)
 assert rgba[:,384:1536,3].max()==0
 print(mode,'ink coverage',round(float((alpha>20).mean()),4))
