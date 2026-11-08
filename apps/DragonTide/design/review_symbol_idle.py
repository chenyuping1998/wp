"""Review actual CUA screenshots; no simulated game art in the evidence."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageChops
import json
r=Path(__file__).resolve().parent/'symbol_idle_review'
files=sorted(r.glob('live-*.png'));frames=[]
for p in files[::2]:
 im=Image.open(p).convert('RGB').crop((416,115,860,485));frames.append(im)
frames[0].save(r/'actual-idle.gif',save_all=True,append_images=frames[1:],duration=230,loop=0,optimize=True)
# Each prop is repeated in three columns. Use the first pair as native-size
# contact strips and preserve actual cell changes, including ambient frames.
times=['0','0.4','0.8','1.2','2','4'];names=['H1','H2','H3','H4','H5','L1','L2','L3','L4','S']
contact=Image.new('RGB',(1000,800),'#f2e6cc');d=ImageDraw.Draw(contact);evidence={}
for i,name in enumerate(names):
 col=0 if i<5 else 1;row=i%5;box=(420+col*73,118+row*73,420+(col+1)*73,118+(row+1)*73)
 pics=[]
 for j,t in enumerate(times):
  im=Image.open(r/f'desktop-time-{t}.png').convert('RGB').crop(box);pics.append(im);contact.paste(im,(100+j*145,i*80+4))
 d.text((10,i*80+25),name,fill='black')
 changes=[ImageChops.difference(pics[0],im).getbbox() is not None for im in pics[1:]]
 assert any(changes),name+' never changed in actual game frames'
 evidence[name]={'changedAgainstTime0':changes}
contact.save(r/'ten-symbol-frames.jpg',quality=97)
(r/'actual-frame-check.json').write_text(json.dumps({'scope':'CUA actual game screenshot cells, fixed board and six inspection times','symbols':evidence},indent=2)+'\n')
print('Actual game pixels: all ten symbols changed; contact strips and live GIF saved.')
