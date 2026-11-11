"""Review the image-generated leg repaint against the initial full art."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
from scipy import ndimage as ndi
import numpy as np,json,math
P=Path(__file__).resolve().parent;F=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',16)
for ch in ['dj','host']:
 D=P/'精修/v1'/ch/'qa/source-repaint';D.mkdir(parents=True,exist_ok=True)
 before=Image.open(P/'交件'/ch/'reference-master.png').convert('RGBA');after=Image.open(P/'精修/source'/(ch+'_leg_revision.png')).convert('RGBA');a=np.array(before)[:,:,3]>128;b=np.array(after)[:,:,3]>128;yy=np.arange(1536)[:,None];domain=(yy>(790 if ch=='dj' else 680))&(yy<1380);removed=a&~b&domain;added=b&~a&domain
 diff=np.zeros((1536,1024,4),np.uint8);diff[removed]=[218,52,65,255];diff[added]=[31,157,111,255];diff[a&b&domain]=[120,120,120,120]
 sheet=Image.new('RGBA',(1536,805),'#e9e7dd');draw=ImageDraw.Draw(sheet)
 for i,(im,label) in enumerate([(before,'initial complete character'),(after,'imagegen leg repaint source'),(Image.fromarray(diff),'red removed / green added')]):sheet.alpha_composite(im.resize((512,768)),(512*i,35));draw.text((i*512+6,5),label,font=F,fill='black')
 sheet.convert('RGB').save(D/'before-after-alpha.jpg',quality=95)
 lab,n=ndi.label(removed);regions=[];tiles=[]
 for i,s in enumerate(ndi.find_objects(lab),1):
  if s is None:continue
  area=int((lab[s]==i).sum())
  if area<16:continue
  box=(max(0,s[1].start-20),max(0,s[0].start-20),min(1024,s[1].stop+20),min(1536,s[0].stop+20));regions.append({'bbox':list(box),'removed_pixels':area})
  tile=Image.new('RGB',(600,340),'#e9e7dd');d=ImageDraw.Draw(tile);d.text((6,5),str(box)+'  pixels='+str(area),font=F,fill='black')
  for j,im in enumerate([before,after]):
   crop=im.crop(box);crop.thumbnail((290,300));bg=Image.new('RGBA',(300,310),'#171b24');bg.alpha_composite(crop,((300-crop.width)//2,(310-crop.height)//2));tile.paste(bg.convert('RGB'),(j*300,30))
  tiles.append(tile)
 out=Image.new('RGB',(1200,max(1,math.ceil(len(tiles)/2))*340),'#999999')
 for i,t in enumerate(tiles):out.paste(t,((i%2)*600,(i//2)*340))
 out.save(D/'all-removed-regions.jpg',quality=95);(D/'report.json').write_text(json.dumps({'scope':'imagegen repaint, not a mask shaving old limbs','old_reference':'交件/'+ch+'/reference-master.png','new_reference':'精修/source/'+ch+'_leg_revision.png','removed_pixels':int(removed.sum()),'added_pixels':int(added.sum()),'removed_regions_ge16':regions,'acceptance':'review every region: organic repaint keeps thigh/calf volume; source split must separately preserve the NEW painted source'},indent=2,ensure_ascii=False)+'\n');print(ch,'source repaint regions',len(regions))
