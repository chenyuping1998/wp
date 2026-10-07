"""Generate original geometric terminal chrome; lettering stays in runtime."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / 'static/assets/sprites'
PAPER, INK, ORANGE, BLUE, PINK = '#EFEADC', '#282828', '#B87B60', '#8FA9B5', '#BD9393'

def save(group, name, im):
    dest = ROOT / group / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, optimize=True)

def window(size, accent=INK, inset=8, title=.13):
    w,h=size
    im=Image.new('RGBA',size)
    d=ImageDraw.Draw(im)
    line=max(2,round(w*.006))
    d.rectangle((inset+5,inset+5,w-1,h-1),fill=INK)
    d.rectangle((inset,inset,w-inset-1,h-inset-1),fill=PAPER,outline=INK,width=line)
    ty=int(h*title)+inset
    d.rectangle((inset+line,inset+line,w-inset-line,ty),fill=accent)
    side=max(9,int(h*title*.65))
    y=inset+max(line, int(h*title*.12))
    for i in range(3):
        x=w-inset-8-(i+1)*(side+5)
        d.rectangle((x,y,x+side,y+side),fill=PAPER,outline=INK,width=max(1,line//2))
        if i==0:
            d.line((x+side*.25,y+side*.25,x+side*.75,y+side*.75),fill=INK,width=max(1,line//2))
            d.line((x+side*.75,y+side*.25,x+side*.25,y+side*.75),fill=INK,width=max(1,line//2))
        elif i==1:
            d.rectangle((x+side*.25,y+side*.25,x+side*.75,y+side*.75),outline=INK,width=max(1,line//2))
        else:
            d.line((x+side*.2,y+side*.72,x+side*.8,y+side*.72),fill=INK,width=max(1,line//2))
    return im

def paper_label(size):
    """Hand-inked sushi menu slip, with no terminal chrome."""
    w, h = size
    im = Image.new('RGBA', size)
    d = ImageDraw.Draw(im)
    def pts(values):
        return [(round(x*w/512), round(y*h/512)) for x,y in values]
    edge = pts([(31,34),(178,29),(341,32),(477,28),(480,163),
                (476,326),(482,475),(329,479),(178,475),(29,481),
                (33,324),(28,178),(31,34)])
    d.polygon(edge, fill=PAPER)
    d.line(edge, fill=INK, width=max(3,round(w*0.012)), joint='curve')
    # Sparse dry-brush edging and a small folded corner; the face stays blank.
    for path,width in [([(40,39),(168,34)],2), ([(344,37),(459,33)],2),
                       ([(35,187),(39,294)],2), ([(473,343),(476,444)],3),
                       ([(47,472),(152,470)],2)]:
        d.line(pts(path), fill=INK, width=max(1,round(width*w/512)))
    fold=pts([(451,477),(480,449),(482,475),(451,477)])
    d.polygon(fold,fill='#E4E0D4')
    d.line(pts([(451,477),(452,450),(480,449)]),fill=INK,width=max(2,round(w*.005)))
    for i in range(3):
        d.line(pts([(47+i*7,453),(55+i*7,443)]), fill=INK,width=max(1,round(w*.003)))
    return im

def main():
    bg=Image.new('RGBA',(1280,1280),PAPER)
    # Approved hand-drawn counter frame is imported by import_sushi_ui.py.
    edge=window((1280,1280),INK,inset=4,title=.07)
    ImageDraw.Draw(edge).rectangle((140,140,1140,1140),fill=(0,0,0,0))
    # Do not overwrite the approved counter frame.
    for name in ['big','superwin','mega','epic','max']:
        # Keep the inherited mesh's title/amount regions exactly aligned.
        im=window((1000,560),ORANGE,inset=30,title=.07)
        d=ImageDraw.Draw(im)
        d.rectangle((141,94,859,273),fill=ORANGE,outline=INK,width=6)
        d.rectangle((188,313,812,477),fill=PAPER,outline=INK,width=5)
        save('sushiWinBanners',name+'.png',im)
    save('sushiScene','fs_plate.png',window((1000,600),PINK,title=.1))
    save('sushiScene','shutter.png',window((1920,1080),INK,title=.06))
    save('sushiUi','ticker_plate.png',window((652,146),INK,title=.12))
    # Approved order plaque is imported by import_sushi_ui.py.
    for name,accent in [('card_bonus.png',BLUE),('card_superbonus.png',PINK)]:
        save('sushiUi',name,window((600,840),accent,title=.08))
    save('sushiUi','bar_strip.png',window((1600,200),INK,inset=4,title=.07))
    for name,on in [('button_print.png',False),('button_print_on.png',True),('button_plate.png',False),('spin_plate.png',True)]:
        im=Image.new('RGBA',(256,256)); d=ImageDraw.Draw(im)
        d.ellipse((8,8,247,247),fill=ORANGE if on else PAPER,outline=INK,width=9)
        d.ellipse((21,21,234,234),outline=INK,width=2)
        save('sushiUi',name,im)
    im=paper_label((512,512))
    save('sushiSymbols','low_label.png',im)
    print('Sushi terminal frame, plates, cards, banners and controls written')

if __name__=='__main__': main()
