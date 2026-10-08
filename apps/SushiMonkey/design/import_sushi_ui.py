"""Mechanical nine-slice fit of approved original manga UI art."""
from pathlib import Path
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'design/source/ui'
SPRITES=ROOT/'static/assets/sprites'
frame=Image.open(SOURCE/'sushi_counter_frame.png').convert('RGBA')
# Keep all drawn corner joints; map the measured opening to the engine board.
xs=[0,144,1108,1254];ys=[0,166,1062,1254]
dx=[0,128,1152,1280];dy=[0,128,1152,1280]
edge=Image.new('RGBA',(1280,1280))
for y in range(3):
 for x in range(3):
  piece=frame.crop((xs[x],ys[y],xs[x+1],ys[y+1]))
  piece=piece.resize((dx[x+1]-dx[x],dy[y+1]-dy[y]),Image.Resampling.LANCZOS)
  edge.alpha_composite(piece,(dx[x],dy[y]))
edge.save(SPRITES/'sushiFrame/frame_edge.png',optimize=True)
bg=Image.new('RGBA',(1280,1280))
ImageDraw.Draw(bg).rectangle((118,118,1162,1162),fill='#EFEADC')
bg.save(SPRITES/'sushiFrame/frame_bg.png',optimize=True)
plaque=Image.open(SOURCE/'order_wood_plaque.png').convert('RGBA')
plaque.thumbnail((512,280),Image.Resampling.LANCZOS)
button=Image.new('RGBA',(512,512))
button.alpha_composite(plaque,((512-plaque.width)//2,(512-plaque.height)//2))
button.save(SPRITES/'sushiUi/buybonus_plate.png',optimize=True)
print('Counter frame and order plaque fitted')
