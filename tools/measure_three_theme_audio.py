"""Report integrated LUFS and true peak for the delivered MP3 loops."""
from pathlib import Path
import re
import subprocess
import imageio_ffmpeg

root = Path(__file__).resolve().parents[1] / 'apps'
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
for app, theme in [('MonkeyKingRush齊天大聖','monkeyking'),
                   ('PochaMonkey韓式路邊攤','pocha'),
                   ('SwingMonkey爵士俱樂部','swing')]:
    for mode in ('main','freespin'):
        file = root/app/'static/assets/audio'/theme/f'bgm_{mode}.mp3'
        result = subprocess.run([ffmpeg,'-hide_banner','-i',str(file),'-af',
                                 'ebur128=peak=true','-f','null','NUL'],
                                capture_output=True,text=True,encoding='utf-8',errors='replace')
        lines = result.stderr.splitlines()
        summary = '\n'.join(lines[lines.index(next(line for line in lines if 'Summary:' in line)):])
        loudness = re.search(r'Integrated loudness:\s*I:\s*([-+\d.]+) LUFS', summary)
        peak = re.search(r'True peak:\s*Peak:\s*([-+\d.]+) dBFS', summary)
        print(f'{theme} {mode}: {loudness.group(1) if loudness else "?"} LUFS, '
              f'{peak.group(1) if peak else "?"} dBTP')
