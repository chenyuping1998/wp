"""Align generated comic laugh heads to the Diner cast rig's face regions."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

APP=Path(__file__).resolve().parents[1]
SRC=APP/'design/source/diner/laugh'
SOURCE={'inhale':'half','half':'half','rising':'half','open':'peak','peak':'peak','settle':'half'}

def render(cast):
    folder=APP/'design/source'/cast
    neutral=Image.open(folder/'head_2_face.png').convert('RGBA')
    alpha=neutral.getchannel('A')
    # Preserve the hat, ears, fur perimeter and neck; exchange the face only.
    mask=Image.new('L',neutral.size,0)
    d=ImageDraw.Draw(mask)
    # Keep the ears and hair from the neutral rig: the generated head's ear
    # position differs a few pixels and otherwise creates a visible double ear.
    if cast=='mg':d.ellipse((21,67,132,205),fill=255)
    else:d.ellipse((24,64,142,215),fill=255)
    mask=mask.filter(ImageFilter.GaussianBlur(7))
    for state,variant in SOURCE.items():
        raw=Image.open(SRC/f'{cast}_{variant}_raw.png').convert('RGBA')
        raw=raw.resize(neutral.size,Image.Resampling.LANCZOS)
        raw.putalpha(alpha)
        im=Image.composite(raw,neutral,mask)
        im.putalpha(alpha)
        im.save(folder/f'head_2_face_{state}.png',optimize=True)
    print(cast,neutral.size,'six aligned expression attachments')

if __name__=='__main__':
    for cast in ('mg','fg'):render(cast)
