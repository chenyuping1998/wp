"""Static placement check for live-type presentation assets (not shipped)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'static/assets/sprites'
OUT=ROOT/'design/source/diner/_sheets'
FONT=ROOT/'static/fonts/sushi/Bangers-Regular.ttf'

def paste_fit(dst,src,box):
    x,y,w,h=box
    im=Image.open(ART/src).convert('RGBA').resize((round(w),round(h)),Image.Resampling.LANCZOS)
    dst.alpha_composite(im,(round(x),round(y)))

def text(dst,xy,label,size,fill='#E2342B',stroke='#1B1B1B'):
    d=ImageDraw.Draw(dst)
    d.text(xy,label,font=ImageFont.truetype(str(FONT),size),anchor='mm',fill=fill,stroke_width=3,stroke_fill=stroke)

def stage():
    bg=Image.open(ART/'sushiBackground/bg_feature.png').convert('RGBA').resize((1280,720))
    # Same source and visual proportions as FreeSpinAnimation on a 1280x720 screen.
    x,y,w,h=297,143,686,429
    paste_fit(bg,'sushiV8/fg_intro.png',(x,y,w,h))
    paste_fit(bg,'sushiV8/fg_intro_decor.png',(x,y,w,h))
    paste_fit(bg,'sushiV8/title_free.png',(309,207,662,207))
    text(bg,(640,311),'FREE SPINS',68)
    text(bg,(640,438),'10',125,fill='#F48FB1')
    text(bg,(640,496),'SPINS AWARDED',28,fill='#1B1B1B',stroke='#FBF5E6')
    bg.convert('RGB').save(OUT/'fg_runtime_preview.png')

    bg=Image.open(ART/'sushiBackground/bg_base.png').convert('RGBA').resize((1280,720))
    # Win.svelte uses a 5.2-symbol-wide (728 px) plaque over the board centre.
    x,y,w,h=276,156,728,408
    paste_fit(bg,'sushiV8/win_max.png',(x,y,w,h))
    paste_fit(bg,'sushiV8/win_max_decor.png',(x,y,w,h))
    text(bg,(640,287),'MAX WIN',65,fill='#FBF5E6')
    text(bg,(640,436),'$10,000.00',60)
    bg.convert('RGB').save(OUT/'win_runtime_preview.png')

if __name__=='__main__':
    OUT.mkdir(parents=True,exist_ok=True)
    stage()
    print('Wrote FG and MAX WIN placement previews')
