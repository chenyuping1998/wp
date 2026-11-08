"""Close-up review of actual Spine facial poses, including pupil motion and mouth swaps."""
from pathlib import Path
import json,runpy,subprocess
import numpy as np
from PIL import Image,ImageDraw,ImageFont
import imageio_ffmpeg
ROOT=Path(__file__).resolve().parent;APP=ROOT.parent;OUT=ROOT/'preview_mummy_20261107/living_scene'
raster=runpy.run_path(str(ROOT/'render_mummy_motion.py'),run_name='preview_helpers')['raster']
meta=json.loads((OUT/'face.json').read_text());poses=np.fromfile(OUT/'face.bin',np.float32).reshape(len(meta['frames']),-1,2)
uv=np.array(meta['uvs']).reshape(-1,2);idx=np.array(meta['indices']).reshape(-1,3)
font=ImageFont.truetype(str(APP/'static/fonts/LilitaOne.ttf'),18);textures={}
for name in ['head_idle','head_talk','head_blink','head_laugh']:
 a=np.asarray(Image.open(APP/'static/assets/spines/mummyCat'/(name+'.png')).convert('RGBA')).astype(np.float32)/255;a[:,:,:3]*=a[:,:,3:];textures[name]=a
p=subprocess.Popen([imageio_ffmpeg.get_ffmpeg_exe(),'-y','-v','error','-f','rawvideo','-pixel_format','rgb24','-video_size','480x500','-framerate',str(meta['fps']),'-i','pipe:0','-an','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/'face_performance.mp4')],stdin=subprocess.PIPE)
stills=[]
for i,f in enumerate(meta['frames']):
 buf=np.zeros((500,480,4),np.float32);buf[:,:,:3]=[.07,.13,.16];buf[:,:,3]=1;raster(buf,textures[f['attachment']],poses[i],uv,idx)
 img=Image.fromarray((np.clip(buf[:,:,:3],0,1)*255).astype(np.uint8));d=ImageDraw.Draw(img);d.text((12,8),f['label'],font=font,fill='#f2ddb1');d.text((12,475),'OFFLINE SPINE 4.2 MESH PREVIEW',font=font,fill='#b2c4c8')
 p.stdin.write(np.asarray(img).tobytes())
 if i in [0,33,106,191,243,274]:img.save(OUT/f'face_{i:03}.png');stills.append(img)
p.stdin.close();assert p.wait()==0
sheet=Image.new('RGB',(480*3,500*2))
for i,im in enumerate(stills):sheet.paste(im,(i%3*480,i//3*500))
sheet.save(OUT/'face_contact.png');print('Rendered facial performance',len(meta['frames']),'frames')
