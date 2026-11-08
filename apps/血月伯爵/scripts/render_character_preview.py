"""Offline character-only review of the game's clip plan; not browser capture.

Input: E:/stake/tmp/bloodmoon-character-plan.json, exported from presentation.ts.
The original 30 fps packed RGB/alpha clips are preserved. Only the 110 ms
crossfades are sampled at 60 fps; no artificial motion interpolation is used.
"""
from pathlib import Path
import json, subprocess
import imageio_ffmpeg
from PIL import Image, ImageEnhance

APP = Path(__file__).resolve().parents[1]
STAKE = APP.parents[2]
plan = json.loads((STAKE/'tmp/bloodmoon-character-plan.json').read_text())
manifest = json.loads((APP/'static/bloodmoon/manifest.json').read_text(encoding='utf-8'))
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
size = (960, 720)
background = Image.open(APP/'static'/manifest['scene']['base'].lstrip('/')).convert('RGB')
ratio = max(size[0]/background.width, size[1]/background.height)
background = background.resize((round(background.width*ratio),round(background.height*ratio)))
left, top = (background.width-size[0])//2, (background.height-size[1])//2
background = ImageEnhance.Brightness(background.crop((left,top,left+size[0],top+size[1]))).enhance(.55)
cache = {}
def frames_for(name):
    if name not in cache:
        reader = imageio_ffmpeg.read_frames(str(APP/'static'/manifest['character']['base'][name].lstrip('/')),pix_fmt='rgb24')
        meta = next(reader); frames = []
        for raw in reader:
            packed = Image.frombytes('RGB',meta['size'],raw); w,h = packed.size
            rgb = packed.crop((0,0,w,h//2)).convert('RGBA')
            rgb.putalpha(packed.crop((0,h//2,w,h)).convert('L'))
            frames.append(rgb.resize((560,796),Image.Resampling.LANCZOS))
        cache[name] = (frames,meta['fps'])
    return cache[name]
def layer_at(clip,clock):
    frames,fps = frames_for(clip['name'])
    frame = int(max(0,clock-clip['origin'])/1000*fps)
    index = frame%len(frames) if clip['loop'] else min(len(frames)-1,frame)
    layer = Image.new('RGBA',size)
    layer.paste(frames[index],(200,-60))
    return layer

out = STAKE/'deliverables/血月伯爵預覽/WILD角色銜接預覽.mp4'
encoder = subprocess.Popen([ffmpeg,'-v','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size','960x720','-framerate','60','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',str(out)],stdin=subprocess.PIPE)
active = outgoing = None
transition = 0
for frame in plan['frames']:
    clock = frame['clock']
    if active is None or active['name'] != frame['name']:
        outgoing = active
        active = dict(frame,origin=clock-frame['elapsed'])
        transition = clock
    incoming = layer_at(active,clock)
    rendered = background.copy(); rendered.paste(incoming,(0,0),incoming)
    if outgoing is not None and clock-transition < 110:
        p = min(1,(clock-transition)/110); blend = p*p*(3-2*p)
        previous = layer_at(outgoing,clock)
        previous_scene = background.copy();previous_scene.paste(previous,(0,0),previous)
        rendered = Image.blend(previous_scene,rendered,blend)
    else:
        outgoing = None
    encoder.stdin.write(rendered.tobytes())
encoder.stdin.close()
if encoder.wait():raise RuntimeError('Character preview encoder failed')
print(str(out))
