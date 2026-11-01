from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from PIL import Image
from pathlib import Path
import json
app=Path(__file__).resolve().parents[1];chars='0123456789.,×$+/'
meta=json.loads((app/'src/game/v8Digits.json').read_text())['receipt'];glyphs={};metrics={};order=['.notdef','space']+[f'g{i}' for i in range(16)]
for name in order[:2]:glyphs[name]=TTGlyphPen(None).glyph();metrics[name]=(90,0)
for i,c in enumerate(chars):
 im=Image.open(app/f'static/assets/sprites/sushiV8/digit_receipt_{i}.png');alpha=im.getchannel('A');pen=TTGlyphPen(None)
 for y in range(im.height):
  x=0
  while x<im.width:
   if alpha.getpixel((x,y))<128:x+=1;continue
   x0=x
   while x<im.width and alpha.getpixel((x,y))>=128:x+=1
   pen.moveTo((x0,256-y));pen.lineTo((x,256-y));pen.lineTo((x,255-y));pen.lineTo((x0,255-y));pen.closePath()
 glyphs[f'g{i}']=pen.glyph();metrics[f'g{i}']=(meta[c]['advance'],0)
fb=FontBuilder(256,isTTF=True);fb.setupGlyphOrder(order);fb.setupCharacterMap({32:'space',**{ord(c):f'g{i}' for i,c in enumerate(chars)}});fb.setupGlyf(glyphs);fb.setupHorizontalMetrics(metrics);fb.setupHorizontalHeader(ascent=256,descent=0);fb.setupNameTable({'familyName':'SushiReceipt','styleName':'Regular','uniqueFontIdentifier':'SushiMonkeyReceiptV8','fullName':'SushiReceipt','psName':'SushiReceipt'});fb.setupOS2(sTypoAscender=256,sTypoDescender=0,usWinAscent=256,usWinDescent=0);fb.setupPost();fb.setupMaxp();fb.save(app/'static/fonts/sushi/SushiReceipt.ttf')
