"""Extract unchanged frames from the browser-recorded shared Pixi renderer."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg
import subprocess
import json
import re
app=Path(__file__).resolve().parent.parent
root=app/'design/source/medusagaze';folder=root/'background';video=folder/'MedusaGaze_background_v2.webm'
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
mp4=folder/'MedusaGaze_background_v2.mp4'
gif=folder/'MedusaGaze_background_v2_preview.gif'
sound=app/'static/assets/audio/medusa/sfx_statues_crack.wav'
subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-i',str(video),'-i',str(sound),'-i',str(sound),
    '-filter_complex','[1:a]volume=0.6,adelay=4000:all=1[a];[2:a]volume=0.6,adelay=11500:all=1[b];[a][b]amix=inputs=2:normalize=0,apad[audio]',
    '-map','0:v:0','-map','[audio]','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p',
    '-c:a','aac','-b:a','160k','-shortest','-movflags','+faststart',str(mp4)],check=True)
subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-ss','3.65','-t','2.8','-i',str(video),
    '-filter_complex','fps=20,scale=640:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=256[p];[b][p]paletteuse=dither=sierra2_4a',
    '-loop','0',str(gif)],check=True)
probe=subprocess.run([ffmpeg,'-hide_banner','-i',str(video)],capture_output=True,text=True,encoding='utf-8',errors='replace')
match=re.search(r'Duration: (\d+):(\d+):([\d.]+)',probe.stderr)
duration=int(match[1])*3600+int(match[2])*60+float(match[3]) if match else None
frames=folder/'frames_v2';frames.mkdir(exist_ok=True)
samples=[(.8,'DAY / FIXED ARCHITECTURE'),(3.3,'DUSK / ANCHORED FIRE'),(4.4,'STATUES / HELD FRACTURE'),(7.8,'FIRE / RISING CURLS DETAIL'),(11.9,'STATUE / 12-PIECE DETAIL'),(12.8,'STATUE / EXACT RESTORATION')]
sheet=Image.new('RGB',(1440,1430),'#0b222a');d=ImageDraw.Draw(sheet)
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',21)
d.text((24,18),'MEDUSA GAZE / BACKGROUND ANIMATION v2 / SHARED GAME RENDERER',font=font,fill='#f2c14e')
targets=[]
for i,(time,label) in enumerate(samples):
    target=frames/f'{i+1:02}_{time:.2f}.jpg';targets.append(target)
    subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-ss',str(time),'-i',str(video),'-frames:v','1','-q:v','2',str(target)],check=True)
    with Image.open(target) as image:
        x,y=20+(i%2)*720,65+(i//2)*450
        sheet.paste(image.resize((680,383),Image.Resampling.LANCZOS),(x,y));d.text((x,y+394),f'{time:.2f}s / {label}',font=font,fill='#dce8e8')
path=root/'_sheets/background_animation_v2_contact.jpg';sheet.save(path,quality=95,subsampling=0)
report={'video':video.name,'mp4':mp4.name,'gif':gif.name,'durationSeconds':duration,'bytes':video.stat().st_size,'mp4Bytes':mp4.stat().st_size,'source':'Browser canvas recording of the exact game Pixi renderer. Review crops at 7-14s only; game camera remains fixed. Not Stake Engine footage.','mp4Audio':'Existing original sfx_statues_crack at 4s and 11.5s, volume 0.6; WebM is silent.','contact':'../_sheets/background_animation_v2_contact.jpg','frames':[str(p.relative_to(folder)).replace('\\','/') for p in targets]}
(folder/'recording_v2.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps(report))
