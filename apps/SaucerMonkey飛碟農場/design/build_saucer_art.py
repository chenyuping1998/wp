"""Build approved themed raster assets and native UI geometry.
Source masters are preserved. Every replaced asset is backed up once.
Run: python design/build_<theme>_art.py (from any directory).
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
import json, math, shutil, re

APP = Path(__file__).resolve().parents[1]
SAUCER = APP.name.startswith("Saucer")
THEME = "saucer" if SAUCER else "putt"
SRC = APP / "design/source" / THEME
SPR = APP / "static/assets/sprites"
BACKUP = APP / "design/source" / THEME / "_previous_runtime"
INK = "#141a33" if SAUCER else "#1b2a22"
PAPER = "#f6f0dc" if SAUCER else "#fff6df"
MID = "#2c3a66" if SAUCER else "#3e7a45"
RED = "#e8433a" if SAUCER else "#e5432f"
MECH = "#7cf05a" if SAUCER else "#3fb4e8"
FONT = APP / "static/fonts/sushi/BowlbyOne-Regular.ttf"
CHARS = "0123456789.,×+$/"
WRITTEN = []

def save(im, rel):
    p = SPR / rel
    if p.exists() and not (BACKUP / rel).exists():
        (BACKUP / rel).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(p, BACKUP / rel)
    p.parent.mkdir(parents=True, exist_ok=True)
    im.save(p, optimize=True)
    WRITTEN.append(rel)

def read(rel):
    return Image.open(SRC / rel).convert("RGBA")

def contain(im, size, extent=None):
    box = im.getchannel("A").getbbox()
    if not box:
        raise ValueError("Empty source")
    im = ImageOps.contain(im.crop(box), extent or size, Image.Resampling.LANCZOS)
    out = Image.new("RGBA", size)
    out.alpha_composite(im, ((size[0]-im.width)//2, (size[1]-im.height)//2))
    return out

def place(dst, im, xy, size):
    im = contain(im, size)
    dst.alpha_composite(im, tuple(map(round, xy)))

def font(px):
    return ImageFont.truetype(str(FONT), px)

def panel(size, fill=PAPER, inset=20, radius=24, accent=True):
    w,h=size
    im=Image.new("RGBA",size)
    d=ImageDraw.Draw(im)
    d.rounded_rectangle((inset,inset,w-inset-1,h-inset-1), radius,
                        fill=fill, outline=INK,width=max(3,w//180))
    if accent:
        p=inset+max(8,w//80)
        d.rounded_rectangle((p,p,w-p-1,h-p-1),max(4,radius-6),
                            outline=MID,width=max(2,w//500))
    return im

def circle_plate(on=False, spin=False):
    im=Image.new("RGBA",(256,256))
    d=ImageDraw.Draw(im)
    d.ellipse((13,13,243,243),fill=RED if spin else (MECH if on else MID),
              outline=INK,width=8)
    d.ellipse((25,25,231,231),outline=PAPER,width=4)
    return im

def native_buy():
    out=SPR/"sushiUi"
    for dark in (False,True):
        for idx,suffix in enumerate(("", "_roll1", "_roll2", "_lit")):
            face=INK if dark else PAPER
            rim=MECH if idx==3 else RED
            if SAUCER:
                art=f'<ellipse cx="256" cy="105" rx="114" ry="65" fill="{MID}" stroke="{INK}" stroke-width="8"/><path d="M37 169Q256 105 475 169L450 344Q256 394 62 344Z" fill="{face}" stroke="{INK}" stroke-width="9"/><path d="M64 348Q256 387 450 348" fill="none" stroke="{rim}" stroke-width="10"/>'
                for k in range(5):
                    x=150+53*k
                    art+=f'<circle cx="{x}" cy="370" r="7" fill="{MECH if (k+idx)%3==0 else PAPER}" stroke="{INK}" stroke-width="3"/>'
            else:
                art=f'<path d="M35 180Q23 127 82 127Q69 68 146 75Q176 26 228 75Q289 37 323 88Q396 63 409 124Q482 117 478 185L461 284Q256 315 51 284Z" fill="{face}" stroke="{INK}" stroke-width="9"/><path d="M70 284Q256 310 445 284" fill="none" stroke="{rim}" stroke-width="8"/><path d="M351 80V22L402 38L351 53" fill="{RED}" stroke="{INK}" stroke-width="5" stroke-linejoin="round"/>'
                x=115+idx*40
                art+=f'<circle cx="{x}" cy="308" r="15" fill="{PAPER}" stroke="{INK}" stroke-width="4"/>'
            p=out/f'buybonus_sign{"_dark" if dark else ""}{suffix}.svg'
            if p.exists() and not (BACKUP/"sushiUi"/p.name).exists():
                (BACKUP/"sushiUi").mkdir(parents=True,exist_ok=True)
                shutil.copy2(p,BACKUP/"sushiUi"/p.name)
            p.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">{art}</svg>',encoding="utf-8")
            WRITTEN.append("sushiUi/"+p.name)

def frame_bg():
    """The paper under the reels. Saucer (user, 2026-10-17): cut to the frame's
    own rounded outline (frame_edge's 78..1202, r35) so no cream backing shows
    round the outside of the frame; drawn 4x and scaled down for a clean edge."""
    bg=Image.new("RGBA",(1280,1280),PAPER)
    d=ImageDraw.Draw(bg)
    for y in range(140,1140,70):
        d.line((140,y,1140,y),fill="#e7e3d1" if SAUCER else "#e5ecd5",width=2)
    if SAUCER:
        k=4
        mask=Image.new("L",(1280*k,1280*k),0)
        ImageDraw.Draw(mask).rounded_rectangle((78*k,78*k,1203*k,1203*k),radius=35*k,fill=255)
        bg.putalpha(mask.resize((1280,1280),Image.Resampling.LANCZOS))
    return bg


def main():
    symbols={}
    for name in ("h1","h2","h3","h4","w","p","s"):
        master=read(f"symbols/{name}.png")
        if master.getextrema()[3][0] != 0:
            raise ValueError(f"{name}: source lacks transparent exterior")
        symbols[name]=contain(master,(512,512),(420,420))
        save(symbols[name],f"sushiSymbols/{name}.png")
    low=contain(read("symbols/low.png"),(512,512),(456,456))
    for i in range(1,6):
        save(low,f"sushiSymbols/l{i}.png")
    save(low,"sushiSymbols/low_label.png")
    plain=panel((512,512),inset=38,radius=30,accent=False)
    for n in ("back_h1","back_h2","back_s"):
        save(plain,f"sushiV8/{n}.png")
    save(plain,"sushiV8/symbol_paper.png")
    for mode in ("base","feature"):
        save(ImageOps.fit(read("backgrounds/background_feature_v2.png" if mode=="feature" and (SRC/"backgrounds/background_feature_v2.png").exists() else f"backgrounds/background_{mode}.png"),(1920,1080),method=Image.Resampling.LANCZOS),
             f"sushiBackground/bg_{mode}.png")
    frame=Image.new("RGBA",(1280,1280))
    d=ImageDraw.Draw(frame)
    d.rounded_rectangle((78,78,1202,1202),radius=35,fill="#b7c5ce" if SAUCER else PAPER,outline=INK,width=10)
    d.rounded_rectangle((94,94,1186,1186),radius=27,outline=RED,width=6)
    d.rectangle((140,140,1139,1139),fill=(0,0,0,0))
    for x in (112,1168):
        for y in (112,1168):
            d.ellipse((x-10,y-10,x+10,y+10),fill=PAPER,outline=INK,width=4)
    save(frame,"sushiFrame/frame_edge.png")
    save(frame_bg(),"sushiFrame/frame_bg.png")
    for name,on,spin in (("button_plate",False,False),("button_print",False,False),
                         ("button_print_on",True,False),("spin_plate",False,True)):
        save(circle_plate(on,spin),f"sushiUi/{name}.png")
    save(panel((1600,200),MID,12,24),"sushiUi/bar_strip.png")
    save(panel((652,146),INK,8,20),"sushiUi/ticker_plate.png")
    native_buy()
    for name in ("bonus","superbonus"):
        master=read(f"cards/card_{name}.png")
        scene=master.crop((25,25,master.width-25,round(master.height*.76)))
        card=panel((600,840),inset=16,radius=24,accent=False)
        place(card,scene,(30,24),(540,450))
        save(card,f"sushiUi/card_{name}.png")
    for name in ("collect","slice","receipt"):
        source = "intro/intro_receipt_cow_v2.png" if name == "receipt" else f"intro/intro_{name}.png"
        save(ImageOps.contain(read(source),(1024,640),Image.Resampling.LANCZOS).resize((1024,640)),
             "sushiV8/intro_receipt_cow_v2.png" if name == "receipt" else f"sushiV8/intro_{name}.png")
    save(panel((740,1024),inset=16,radius=24),"sushiV8/menu_frame.png")
    logo=panel((1600,600),inset=40,radius=80,accent=False)
    d=ImageDraw.Draw(logo)
    d.text((800,260),"SAUCER MONKEY" if SAUCER else "PUTT MONKEY",font=font(142),
           fill=RED,stroke_width=3,stroke_fill=INK,anchor="mm")
    place(logo,symbols["s"],(70,315),(170,170))
    place(logo,symbols["p"],(1360,315),(170,170))
    save(logo,"sushiV8/logo_board.png")
    save(logo,"sushiV8/logo_board_titled.png")
    save(symbols["w"],"sushiV8/logo_stamp.png")
    save(symbols["p"],"sushiV8/soy_full.png")
    empty=symbols["p"].copy()
    # Alpha, not white-key extraction: all cream object paint stays opaque.
    outline=empty.getchannel("A")
    from PIL import ImageFilter
    ring=ImageOps.autocontrast(outline.filter(ImageFilter.MaxFilter(9)))
    from PIL import ImageChops
    ring=ImageChops.subtract(ring,outline.filter(ImageFilter.MinFilter(5)))
    empty=Image.new("RGBA",(512,512),PAPER);empty.putalpha(ring)
    save(empty,"sushiV8/soy_empty.png")
    save(panel((512,512),RED,24,40,False),"sushiV8/stamp.png")
    for n in ("intro","total"):
        save(panel((1600,1000),inset=100,radius=60),f"sushiV8/fg_{n}.png")
        decor=Image.new("RGBA",(1600,1000))
        for key,x,y,s in (("p",45,655,265),("s",1260,75,275),("h1",80,70,210)):
            place(decor,symbols[key],(x,y),(s,s))
        save(decor,f"sushiV8/fg_{n}_decor.png")
    tiers=("big","super","mega","epic","max")
    setups=[
        [("s",42,65,210),("p",765,280,195)],
        [("h1",30,45,240),("s",760,50,215),("p",790,330,150)],
        [("p",20,80,210),("p",805,40,175),("s",730,300,240)],
        [("s",5,30,230),("h2",780,35,215),("p",750,305,240),("h1",40,330,190)],
        [("s",345,0,300),("w",15,190,260),("w",740,190,260),("p",45,395,145),("p",805,395,145)]
    ]
    for i,tier in enumerate(tiers):
        base=panel((1000,560),inset=70-i*8,radius=38+i*6,accent=False)
        save(base,f"sushiV8/win_{tier}.png")
        save(base,f"sushiWinBanners/{tier}.png")
        decor=Image.new("RGBA",(1000,560))
        for key,x,y,s in setups[i]:
            place(decor,symbols[key],(x,y),(s,s))
        save(decor,f"sushiV8/win_{tier}_decor.png")
    save(panel((1000,600),INK,28,44),"sushiScene/fs_plate.png")
    wipe=contain(read("scene/transition_wipe.png"),(1200,1200),(1160,1160))
    save(wipe,"sushiScene/transition_wipe.png")
    save(contain(read("scene/collector_ship.png"),(512,512),(470,470)),"saucer/collector_ship.png")
    save(contain(read("cast/fg.png"),(1024,1024),(900,900)),"sushiScene/chef_cut_in.png")
    save(contain(symbols["p"],(128,128),(116,116)),"sushiFx/collect_bananas.png")
    for i in range(16):
        key=("p","s","h1","h2")[i%4]
        save(contain(symbols[key],(128,128),(100,100)),f"sushiV8/particle_{i}.png")
    # Keep the existing sprite sheet keys and rectangles; replace only artwork.
    atlas=json.loads((SPR/"sushiWinPlates/bananas.json").read_text())
    sheet=Image.new("RGBA",(1280,512))
    for i,info in enumerate(atlas["frames"].values()):
        r=info["frame"]
        art=contain(symbols[("p","s")[i%2]],(r["w"],r["h"]))
        sheet.alpha_composite(art,(r["x"],r["y"]))
    save(sheet,"sushiWinPlates/bananas.png")
    ray=Image.new("RGBA",(1024,1024));d=ImageDraw.Draw(ray)
    for i in range(16):
        a=i*math.pi/8;b=a+math.pi/24
        d.polygon([(512,512),(512+900*math.cos(a),512+900*math.sin(a)),
                   (512+900*math.cos(b),512+900*math.sin(b))],fill=PAPER+"40")
    save(ray,"sushiV8/ray.png")
    # Rebuild type from local fonts at each established atlas dimension.
    table_text=(APP/"src/game/v8Digits.ts").read_text()
    table=json.loads(table_text[table_text.index("{"):table_text.rfind("}")+1])
    for role,entries in table.items():
        for idx,info in entries.items():
            i=int(re.search(r"(\d+)$",info["key"]).group(1));w=info["width"]
            im=Image.new("RGBA",(w,256));d=ImageDraw.Draw(im)
            face=font(min(192, int((w-14)/max(1,font(192).getlength(idx))*192)))
            d.text((w/2,122),idx,font=face,anchor="mm",
                   fill=INK,
                   stroke_width=2,stroke_fill=PAPER)
            save(im,f"sushiV8/glyph_{role}_{i}_v2.png" if idx in ("+","$") else f"sushiV8/digit_{role}_{i}.png")
    # Production contact sheets include 70px icons, lows with actual font, and silhouettes.
    out=SRC/"_sheets";out.mkdir(parents=True,exist_ok=True)
    sheet=Image.new("RGBA",(1400,800),PAPER);d=ImageDraw.Draw(sheet)
    for i,(name,im) in enumerate(symbols.items()):
        x=35+i*195
        place(sheet,im,(x,35),(170,170))
        place(sheet,im,(x+50,245),(70,70))
        sil=Image.new("RGBA",(512,512),INK);sil.putalpha(im.getchannel("A"))
        place(sheet,sil,(x+50,360),(70,70))
        d.text((x+75,450),name.upper(),font=font(24),fill=INK,anchor="mm")
    for i,letter in enumerate(("A","K","Q","J","10")):
        tile=low.copy();td=ImageDraw.Draw(tile)
        td.text((256,256),letter,font=font(190 if i<4 else 160),anchor="mm",fill=INK)
        place(sheet,tile,(35+i*240,520),(190,190))
    sheet.convert("RGB").save(out/"symbols_production_v1.png")
    # Square lobby and mandatory wide cover are independently composed from full masters.
    for size,label in (((1024,1024),"thumbnail"),((1920,1080),"cover")):
        cover=ImageOps.fit(read("backgrounds/cover_background.png" if SAUCER and (SRC/"backgrounds/cover_background.png").exists() else "backgrounds/background_base.png"),size,method=Image.Resampling.LANCZOS)
        cast=read("cast/mg.png")
        place(cover,cast,(int(size[0]*.49),int(size[1]*.12)),(int(size[0]*.48),int(size[1]*.86)))
        place(cover,logo,(int(size[0]*.01),int(size[1]*.01)),(int(size[0]*.78),int(size[1]*.3)))
        if label=="cover":
            deliver=APP/"design/cover";deliver.mkdir(parents=True,exist_ok=True)
            prefix="SaucerMonkey" if SAUCER else "PuttMonkey"
            read("backgrounds/cover_background.png" if SAUCER and (SRC/"backgrounds/cover_background.png").exists() else "backgrounds/background_base.png").convert("RGB").resize((1920,1080),Image.Resampling.LANCZOS).save(deliver/(prefix+"-Cover-BG.png"))
            read("cast/mg.png").save(deliver/(prefix+"-Cover-FG.png"))
        dest=APP/"design"/label
        dest.mkdir(parents=True,exist_ok=True)
        cover.convert("RGB").save(dest/f'{"SaucerMonkey" if SAUCER else "PuttMonkey"}-{label}-v1.png')
    (SRC/"runtime_manifest.json").write_text(json.dumps({"theme":THEME,"assets":WRITTEN},indent=2),encoding="utf-8")
    print(f"{THEME}: built {len(WRITTEN)} raster/vector assets")

if __name__=="__main__":
    main()
