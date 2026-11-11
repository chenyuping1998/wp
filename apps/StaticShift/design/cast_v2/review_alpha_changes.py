"""Record every old/new alpha change and check preservation of visible leg mass."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
from scipy import ndimage as ndi
import numpy as np,json,math
P=Path(__file__).resolve().parent;FONT=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',16)
for ch in ['dj','host']:
 D=P/'精修/v1'/ch;Q=D/'qa/alpha-diffs';Q.mkdir(parents=True,exist_ok=True);report={};tiles=[]
 for f in sorted((D/'layers').glob('*.png')):
  after=Image.open(f).convert('RGBA');raw=P/'交件'/ch/'raw'/f.name;before=Image.open(raw).convert('RGBA').resize((1024,1536),Image.Resampling.LANCZOS) if raw.exists() else Image.new('RGBA',(1024,1536))
  a=np.array(before)[:,:,3];b=np.array(after)[:,:,3];removed=(a>128)&(b<128);added=(b>128)&(a<128);diff=np.zeros((1536,1024,4),dtype=np.uint8);diff[removed]=[218,52,65,255];diff[added]=[31,157,111,255];diff[(a>128)&(b>128)]=[120,120,120,90]
  lab,n=ndi.label(removed);regions=[]
  for s in ndi.find_objects(lab):
   if s is None:continue
   area=int(removed[s].sum())
   if area>=16:regions.append({'bbox':[s[1].start,s[0].start,s[1].stop,s[0].stop],'area':area})
  report[f.stem]={'removed_alpha_pixels':int(removed.sum()),'added_alpha_pixels':int(added.sum()),'removed_regions_ge16':regions,'note':'原始生圖可能含錯比例／非本部位；此圖是初稿與精修比較，非聲稱零差異。'}
  sheet=Image.new('RGBA',(1200,635),'#e9e7dd');draw=ImageDraw.Draw(sheet)
  for i,(im,label) in enumerate([(before,'initial generated draft'),(after,'precise final layer'),(Image.fromarray(diff),'red removed / green added')]):
   sheet.alpha_composite(im.resize((400,600),Image.Resampling.LANCZOS),(400*i,35));draw.text((i*400+6,5),f.stem+' - '+label,font=FONT,fill='black')
  sheet.convert('RGB').save(Q/(f.stem+'.jpg'),quality=92);thumb=sheet.copy();thumb.thumbnail((600,318));tiles.append(thumb.convert('RGB'))
 contact=Image.new('RGB',(1200,math.ceil(len(tiles)/2)*318),'#aaaaaa')
 for i,t in enumerate(tiles):contact.paste(t,((i%2)*600,(i//2)*318))
 contact.save(Q/'all-layer-changes.jpg',quality=93);(Q/'regions.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
 ref=P/'交件'/ch/'reference-master.png'
 if not ref.exists():ref=P/'交件'/ch/'master.png'
 old=np.array(Image.open(P/'精修/source'/(ch+'_leg_revision.png')).convert('RGBA'));new=np.array(Image.open(D/'qa/assembled-candidate.png').convert('RGBA'));J=json.loads((D/'layout.json').read_text())['joints'];yy,xx=np.mgrid[:1536,:1024];hip=max(J['hip_l'][1],J['hip_r'][1]);ankle=min(J['ankle_l'][1],J['ankle_r'][1]);domain=(yy>hip+80)&(yy<ankle-70);interior=ndi.binary_erosion(old[:,:,3]>128,iterations=3);lost=interior&(new[:,:,3]<128)&domain
 result={'reference':'精修/source/'+ch+'_leg_revision.png','visible_leg_interior_pixels_removed':int(lost.sum()),'domain_y':[hip+80,ankle-70],'criterion':'3px內縮後的原始腿部肌肉／褲管不得被刪除；鞋與根部遮擋區另驗收。','pass':not lost.any()}
 (D/'qa/leg-silhouette-report.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n');print(ch,result)
