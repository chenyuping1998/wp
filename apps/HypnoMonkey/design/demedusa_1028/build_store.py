"""Layered store artwork using the same actual MG revision as the game."""
from PIL import Image,ImageOps,ImageStat
from pathlib import Path
import json,hashlib,shutil
D=Path(__file__).resolve().parent;A=D.parents[1];O=D/'store';S=A/'static/assets/sprites'
castPath=A/'design/cast_mg/master.png';cast=Image.open(castPath).convert('RGBA');cast=cast.crop(cast.getchannel('A').getbbox())
providerPath=Path('/Users/stone/stake-engine/upload/SumoMonkey/thumbnail/Silverstars-Logo.png');provider=Image.open(providerPath).convert('RGBA');provider=provider.crop(provider.getchannel('A').getbbox());title=Image.open(S/'hypnoBrand/logo.png').convert('RGBA')
manifest={'characterSource':str(castPath),'characterSha256':hashlib.sha256(castPath.read_bytes()).hexdigest(),'providerSource':str(providerPath),'providerSha256':hashlib.sha256(providerPath.read_bytes()).hexdigest(),'delivery':'Independent background/transparent character/provider/title layers; preview is a composition, not a gameplay screenshot.','outputs':{}}
for name,size in [('thumbnail',(200,200)),('cover',(1920,1080))]:
 out=O/name;out.mkdir(parents=True,exist_ok=True);bg=ImageOps.fit(Image.open(S/'hypnoBackground/bg_base.jpg').convert('RGB'),size,Image.Resampling.LANCZOS);fg=Image.new('RGBA',size);brand=Image.new('RGBA',size);word=Image.new('RGBA',size)
 if name=='thumbnail':
  c=Image.open(castPath).convert('RGBA').crop((0,0,1024,810));c=c.crop(c.getchannel('A').getbbox());c=ImageOps.contain(c,(210,220),Image.Resampling.LANCZOS);fg.alpha_composite(c,((200-c.width)//2,200-c.height+25));p=ImageOps.contain(provider,(34,44),Image.Resampling.LANCZOS);brand.alpha_composite(p,(4,152))
 else:
  c=ImageOps.contain(cast,(780,1000),Image.Resampling.LANCZOS);fg.alpha_composite(c,(1920-c.width-120,1080-c.height-35));p=ImageOps.contain(provider,(125,170),Image.Resampling.LANCZOS);brand.alpha_composite(p,(55,1080-p.height-40));t=ImageOps.contain(title,(920,360),Image.Resampling.LANCZOS);word.alpha_composite(t,(105,250))
 bg.save(out/'Background.png');fg.save(out/'Foreground.png');brand.save(out/'Provider.png');word.save(out/'Title.png');shutil.copy2(providerPath,out/'Silverstars-Logo.png')
 preview=bg.convert('RGBA')
 for layer in [fg,word,brand]:preview.alpha_composite(layer)
 preview.convert('RGB').save(out/'preview.jpg',quality=96)
 brightness=sum(ImageStat.Stat(bg).mean)/3;assert brightness>=100
 manifest['outputs'][name]={'size':size,'backgroundMeanRGB':brightness,'files':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in out.iterdir() if p.is_file()}}
(O/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print('200x200 thumbnail and 1920x1080 cover, separate BG/character/provider/title layers; both backgrounds >100 mean brightness.')
