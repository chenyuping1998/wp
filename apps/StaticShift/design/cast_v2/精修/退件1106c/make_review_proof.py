from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,numpy as np,hashlib
from render_core import prep,draw,affine
P=Path(__file__).resolve().parent;F=ImageFont.truetype('/System/Library/Fonts/PingFang.ttc',23);S=ImageFont.truetype('/System/Library/Fonts/PingFang.ttc',18);paper='#e5e2d6';cases=[('20','dj','win_big_loop',.5,'r','DJ 舉耳機：腕側墨線／淡縫'),('21','host','win_big',1.,'r','主持人舉麥：腕根黑點／補色塊'),('22','host','win_big',1.,'l','主持人遠手：淡縫／腕線台階')];sheet=Image.new('RGB',(1860,2190),paper);d=ImageDraw.Draw(sheet);meta=[];cache={}
for row,(num,ch,anim,t,side,label)in enumerate(cases):
 D=P/'candidate'/ch;J=json.loads((D/'layout.json').read_text())['joints'];frames=json.loads((P/(ch+'-actual-frames.json')).read_text())['frames'];f=next(f for f in frames if f['anim']==anim and f['time']==t);M=affine(dict(f['slots'])['arm_'+side+'_lower']);center=(M@[*J['wrist_'+side],1])[:2];origin=np.round(center-[100,100]);y=row*730;d.text((15,y+8),'#'+num+' '+label+'｜'+anim+' '+str(t)+' s｜原角度 3 倍',font=F,fill='#a32727')
 for col,base in enumerate(['baseline','candidate']):
  key=base+ch
  if key not in cache:cache[key]=prep(P/base/ch)
  im=draw(cache[key],f['slots'],origin,(200,200)).convert('RGB').resize((600,600),Image.Resampling.NEAREST);sheet.paste(im,(col*620+10,y+90));d.text((col*620+15,y+52),'修前 r6'if col==0 else'修後 r7',font=S,fill='#222222')
 stand=Image.new('RGBA',(1024,1536),paper);stand.alpha_composite(Image.open(D/'assembled.png'));W=J['wrist_'+side];im=stand.crop((W[0]-100,W[1]-100,W[0]+100,W[1]+100)).convert('RGB').resize((600,600),Image.Resampling.NEAREST);sheet.paste(im,(1250,y+90));d.text((1255,y+52),'站姿對照（同版 r7）',font=S,fill='#222222');meta.append({'issue':num,'character':ch,'animation':anim,'time':t,'side':side,'native_crop_origin':origin.tolist(),'native_crop_size':[200,200],'zoom':3,'resample':'nearest'})
sheet.save(P/'第七輪_三處原角度3倍_修前修後站姿.jpg',quality=98);preview=sheet.copy();preview.thumbnail((930,1095));preview.save(P/'review-cases-preview.jpg',quality=97)
# Additional pointed-hand case for the second affected left-hand variant.
ch='host';D=P/'candidate'/ch;J=json.loads((D/'layout.json').read_text())['joints'];f=next(f for f in json.loads((P/'host-actual-frames.json').read_text())['frames']if f['anim']=='gaze'and f['time']==.9);M=affine(dict(f['slots'])['arm_l_lower']);center=(M@[*J['wrist_l'],1])[:2];origin=np.round(center-[100,100]);out=Image.new('RGB',(1240,680),paper);dd=ImageDraw.Draw(out)
for col,base in enumerate(['baseline','candidate']):
 im=draw(cache[base+ch],f['slots'],origin,(200,200)).convert('RGB').resize((600,600),Image.Resampling.NEAREST);out.paste(im,(col*620+10,65));dd.text((col*620+15,15),('r6 修前'if col==0 else'r7 修後')+'｜遠手指向 gaze 0.9s／3倍',font=F,fill='#222222')
out.save(P/'第七輪_遠手指向_補充3倍.jpg',quality=98);(P/'proof-poses.json').write_text(json.dumps({'paper':paper,'cases':meta,'source_layers_sha256':{base:{ch:{f.name:hashlib.sha256(f.read_bytes()).hexdigest()for f in(P/base/ch/'layers').glob('*.png')}for ch in ['dj','host']}for base in ['baseline','candidate']}},indent=2)+'\n')
