
def facial_cels(full,folder,c):
 names=("neutral","blink","grin","shock","laugh_inhale","laugh_rising","laugh_peak","laugh_settle")
 cels={"neutral":full.copy()}
 mask=Image.new("L",(W,H),0)
 ImageDraw.Draw(mask).rounded_rectangle(c["face"],radius=18,fill=255)
 mask=mask.filter(ImageFilter.GaussianBlur(3))
 for name in names[1:]:
  path=folder/"expressions"/(name+".png")
  if not path.exists():
   raise FileNotFoundError(f"Missing registered facial cel: {path}")
  source=Image.open(path).convert("RGBA").resize((440,420),Image.Resampling.LANCZOS)
  patch=full.copy()
  patch.alpha_composite(source,(60,0))
  cel=Image.composite(patch,full,mask)
  cel.putalpha(full.getchannel("A"))
  cels[name]=cel
 out=folder/"registered";out.mkdir(exist_ok=True)
 for name,im in cels.items():
  im.save(out/(name+".png"))
 sheet=Image.new("RGB",(4*280,2*320),"#dedcd2")
 d=ImageDraw.Draw(sheet)
 for i,(name,im)in enumerate(cels.items()):
  head=im.crop((60,0,500,420))
  head.thumbnail((270,280),Image.Resampling.LANCZOS)
  x=(i%4)*280+5;y=(i//4)*320
  sheet.paste(head,(x,y),head)
  d.text((x+8,y+288),name,fill="black")
 sheet.save(folder/"expressions_contact.png")
 return cels
