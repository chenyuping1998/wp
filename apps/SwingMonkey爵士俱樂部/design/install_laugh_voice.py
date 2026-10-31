"""Install the five-syllable Diner/Putt laugh, aligned by laughTiming.json.
Run after full audio regeneration. The source is kept inside this app.
"""
from pathlib import Path
import shutil
APP = Path(__file__).resolve().parents[1]
shutil.copy2(APP / 'design/source/swing/audio/voice_laugh_recorded.wav',
             APP / 'static/assets/audio/swing/voice_laugh.wav')
print('Installed five-syllable Swing laugh (Diner/Putt recording).')
