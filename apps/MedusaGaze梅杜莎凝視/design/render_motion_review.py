"""Extract review frames from the browser-recorded offline preview, unchanged."""
from pathlib import Path
import subprocess
import re
import json
import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont

app = Path(__file__).resolve().parent.parent
root = app / 'design/source/medusagaze'
folder = root / 'motion'
video = folder / 'MedusaGaze_symbols_v2_motion.webm'
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
probe = subprocess.run([ffmpeg, '-hide_banner', '-i', str(video)], capture_output=True, text=True, encoding='utf-8', errors='replace')
match = re.search(r'Duration: (\d+):(\d+):([\d.]+)', probe.stderr)
duration = int(match[1])*3600 + int(match[2])*60 + float(match[3]) if match else None
frames = folder / 'frames_symbols_v2'
frames.mkdir(exist_ok=True)
samples = [(0.10, 'SYMBOL ACTING'), (0.32, 'PETRIFY'), (0.44, 'CRACKS IN THE SYMBOL'), (0.63, 'SYMBOL FRAGMENTS'), (0.98, 'GRAVITY DROP'), (1.20, 'COLUMN CONTACT')]
sheet = Image.new('RGB', (1200, 1340), '#0b2028')
d = ImageDraw.Draw(sheet)
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 20)
d.text((28, 16), 'MEDUSA GAZE / POLISHED SYMBOLS v2 / OFFLINE MOTION PREVIEW', font=font, fill='#f2c14e')
targets = []
for i, (time, label) in enumerate(samples):
    target = frames / f'{i+1:02}_{time:.2f}.jpg'
    targets.append(target)
    subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(time), '-i', str(video), '-frames:v', '1', '-q:v', '2', str(target)], check=True)
    with Image.open(target) as im:
        im = im.resize((552, 359), Image.Resampling.LANCZOS)
        x, y = 24+(i%2)*600, 65+(i//2)*420
        # Keep the whole 1152x750 recorded frame; fit without cropping.
        sheet.paste(im, (x, y))
        d.text((x, y+368), f'{time:.2f}s / {label}', font=font, fill='#efe8d8')
sheets = root / '_sheets'
sheets.mkdir(exist_ok=True)
sheet.save(sheets / 'symbols_v2_motion_contact.jpg', quality=95)
report = {'video': video.name, 'durationSeconds': duration, 'bytes': video.stat().st_size, 'source': 'Browser canvas recording using shared motion curves, polished symbols and real book data; not Stake Engine footage.', 'frames': [str(p.relative_to(root)).replace('\\','/') for p in targets], 'contact': '_sheets/symbols_v2_motion_contact.jpg'}
(folder / 'recording_symbols_v2.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
print(json.dumps(report))
