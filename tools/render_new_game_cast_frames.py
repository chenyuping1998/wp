from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,numpy as np,sys
app=Path(sys.argv[1]);out=Path(sys.argv[2]);cat='Purrfia' in str(app);rig='donWhiskers43' if cat else 'squawk43'
pages={p.name:Image.open(p).convert('RGBA') for p in (app/'static/assets/spines'/rig).glob('*.png')}
frames=json.loads((out/'frames.json').read_text(encoding='utf-8'));thumbs=[];factor=.5;triangle_cache={}
repaint=next((set(a.split('=',1)[1].split(',')) for a in sys.argv if a.startswith('--repaint=')),None)
for frame_index,f in enumerate(frames):
 target=out/((f.get('id') or f"{f['name']}_{f['fraction']:.2f}")+'.png')
 if repaint is not None and f['name'] not in repaint and target.is_file():
  thumbs.append(Image.open(target).convert('RGBA'));continue
 im=Image.new('RGBA',(512,768),(32,42,53,255))
 for layer in f['layers']:
  tex=pages[layer['page']];w,h=tex.size;v=np.array(layer['positions']).reshape(-1,2);v[:,0]+=512;v[:,1]=1450-v[:,1];v*=factor;uv=np.array(layer['uvs']).reshape(-1,2)*[w,h];tris=layer['triangles']
  # Rigid bones still arrive as meshes. Render an exactly affine layer once,
  # rather than resampling hundreds of identical triangles independently.
  ids=[0,int(np.argmax(uv[:,0])),int(np.argmax(uv[:,1]))]
  try:affine=np.linalg.solve(np.c_[v[ids],np.ones(3)],uv[ids]).T;rigid=np.max(np.abs(np.c_[v,np.ones(len(v))]@affine.T-uv))<.025
  except np.linalg.LinAlgError:rigid=False
  if rigid:
   x0,y0=np.maximum(0,np.floor(v.min(axis=0)-1)).astype(int);x1,y1=np.minimum([512,768],np.ceil(v.max(axis=0)+1)).astype(int)
   if x1>x0 and y1>y0:
    sx0,sy0=np.floor(uv.min(axis=0)).astype(int);sx1,sy1=np.ceil(uv.max(axis=0)).astype(int);cut=tex.crop((sx0,sy0,sx1,sy1));affine[:,2]+=affine[:,:2]@[x0,y0]-[sx0,sy0];tile=cut.transform((x1-x0,y1-y0),Image.Transform.AFFINE,tuple(affine.flat),Image.Resampling.BILINEAR)
    if layer['alpha']<1:tile.putalpha(tile.getchannel('A').point(lambda a:round(a*layer['alpha'])))
    im.alpha_composite(tile,(x0,y0))
   continue
  key=(layer['name'],layer['page'],tuple(layer['uvs']),tuple(tris))
  if key not in triangle_cache:
   entries=[]
   for i in range(0,len(tris),3):
    idx=tris[i:i+3];src=uv[idx];sx0,sy0=np.floor(src.min(axis=0)-2).astype(int);sx1,sy1=np.ceil(src.max(axis=0)+2).astype(int);cut=tex.crop((sx0,sy0,sx1,sy1))
    if cut.getchannel('A').getbbox():entries.append((idx,src,sx0,sy0,cut))
   triangle_cache[key]=entries
  entries=triangle_cache[key]
  all_dst=np.array([v[e[0]] for e in entries]);all_src=np.array([e[1] for e in entries]);matrices=np.concatenate((all_dst,np.ones((len(entries),3,1))),axis=2)
  try:coefs=np.linalg.solve(matrices,all_src).transpose(0,2,1)
  except np.linalg.LinAlgError:coefs=None
  for k,(idx,src,sx0,sy0,cut) in enumerate(entries):
   dst=v[idx];x0,y0=np.floor(dst.min(axis=0)-1).astype(int);x1,y1=np.ceil(dst.max(axis=0)+1).astype(int);x0=max(x0,0);y0=max(y0,0);x1=min(x1,512);y1=min(y1,768)
   if x1<=x0 or y1<=y0:continue
   try:coef=coefs[k] if coefs is not None else np.linalg.solve(np.c_[dst,np.ones(3)],src).T
   except np.linalg.LinAlgError:continue
   coef[:,2]+=coef[:,:2]@[x0,y0]-[sx0,sy0];tile=cut.transform((x1-x0,y1-y0),Image.Transform.AFFINE,tuple(coef.flat),Image.Resampling.BILINEAR)
   mask=Image.new('L',tile.size);ImageDraw.Draw(mask).polygon([tuple(p-[x0,y0]) for p in dst],fill=255);tile.putalpha(Image.fromarray((np.asarray(tile.getchannel('A'),dtype=np.float32)*np.asarray(mask)/255*layer['alpha']).astype('uint8')));im.alpha_composite(tile,(x0,y0))
 im=im.resize((256,384),Image.Resampling.LANCZOS);ImageDraw.Draw(im).text((8,8),f"{f['name']} {f['t']:.2f}s",fill='white');thumbs.append(im)
 im.save(target)
 if (frame_index+1)%25==0:print('Rendered',frame_index+1,'/',len(frames),flush=True)
sheet=Image.new('RGB',(256*4,408*((len(thumbs)+3)//4)),(23,30,40))
for i,im in enumerate(thumbs):sheet.paste(im,(i%4*256,i//4*408+20))
sheet.save(out/'contact.png');print(out/'contact.png')
if frames[0].get('durationMs'):
 palette=thumbs[0].convert('RGB').quantize(colors=256)
 indexed=[im.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE) for im in thumbs]
 temp=out/'motion.pending.gif'
 indexed[0].save(temp,save_all=True,append_images=indexed[1:],duration=[round(f['durationMs']) for f in frames],loop=0,optimize=False)
 temp.replace(out/'motion.gif')
 print(out/'motion.gif')
