import sys,glob
from PIL import Image,ImageDraw
d,out,cols,crop=sys.argv[1],sys.argv[2],int(sys.argv[3]),sys.argv[4] if len(sys.argv)>4 else None
fs=sorted(glob.glob(d+'/f*.png'))
ims=[Image.open(f).convert('RGB') for f in fs]
if crop: x0,y0,x1,y1=map(int,crop.split(',')); ims=[i.crop((x0,y0,x1,y1)) for i in ims]
w,h=ims[0].size; sc=min(1,1600/(w*cols)); tw,th=int(w*sc),int(h*sc)
rows=(len(ims)+cols-1)//cols
S=Image.new('RGB',(tw*cols,th*rows),'black')
for k,im in enumerate(ims):
  t=im.resize((tw,th)); ImageDraw.Draw(t).text((4,4),str(k),fill='yellow'); S.paste(t,((k%cols)*tw,(k//cols)*th))
S.save(out)
