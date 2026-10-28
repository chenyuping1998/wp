"""Store art in the sibling games' upload layout (SumoMonkey / PicklePanic).

  thumbnail/HypnoMonkey-Thumbnail-BG.png  1024x1024 RGB, plaza, no text
  thumbnail/HypnoMonkey-Thumbnail-FG.png  1024x1024 RGBA, hypnotist bust
  thumbnail/Silverstars-Logo.png          provider logo, separate layer
  cover/HypnoMonkey-Cover-BG.png          1920x1080 RGB, plaza, no text
  cover/HypnoMonkey-Cover-FG.png          1920x1080 RGBA, both casts (MG + FG)
  */*-PREVIEW-only.png                    composites for review, not uploaded

The platform draws the title and its own badges, so no wordmark is baked in;
top-right and bottom-left stay clear of the cast.

  python3 design/store_upload/build_upload_store.py
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageStat

A = Path(__file__).resolve().parents[2]
O = Path(__file__).resolve().parent
S = A / 'static/assets/sprites'
LOGO = Path('/Users/stone/stake-engine/upload/SumoMonkey/thumbnail/Silverstars-Logo.png')

def trim(im):
    return im.crop(im.getchannel('A').getbbox())

hypnotist = trim(Image.open(A / 'design/cast_mg/master.png').convert('RGBA'))
assistant = trim(Image.open(A / 'design/cast_fg/assembled.png').convert('RGBA'))
plaza = Image.open(S / 'hypnoBackground/bg_base.jpg').convert('RGB')

# thumbnail: bust of the hypnotist, centred, cut by the bottom edge
(O / 'thumbnail').mkdir(exist_ok=True)
bg = ImageOps.fit(plaza, (1024, 1024), Image.Resampling.LANCZOS)
fg = Image.new('RGBA', (1024, 1024))
# stop above the tail curl (it starts at 0.53 of the height), full width
bust = trim(hypnotist.crop((0, 0, hypnotist.width, int(hypnotist.height * 0.52))))
bust = ImageOps.contain(bust, (960, 1060), Image.Resampling.LANCZOS)
# shifted right so the provider logo's bottom-left corner stays clear
fg.alpha_composite(bust, (1024 - bust.width - 10, 1024 - bust.height + 40))
bg.save(O / 'thumbnail/HypnoMonkey-Thumbnail-BG.png')
fg.save(O / 'thumbnail/HypnoMonkey-Thumbnail-FG.png')
Image.open(LOGO).save(O / 'thumbnail/Silverstars-Logo.png')
prev = bg.convert('RGBA'); prev.alpha_composite(fg)
logo = ImageOps.contain(trim(Image.open(LOGO).convert('RGBA')), (150, 195), Image.Resampling.LANCZOS)
prev.alpha_composite(logo, (24, 1024 - logo.height - 24))
prev.convert('RGB').save(O / 'thumbnail/HypnoMonkey-Thumbnail-PREVIEW-only.png')

# cover: hypnotist centre-right, assistant beside him, feet on the plaza
(O / 'cover').mkdir(exist_ok=True)
bg = ImageOps.fit(plaza, (1920, 1080), Image.Resampling.LANCZOS)
fg = Image.new('RGBA', (1920, 1080))
h = ImageOps.contain(hypnotist, (760, 960), Image.Resampling.LANCZOS)
a = ImageOps.contain(assistant, (600, 860), Image.Resampling.LANCZOS)
fg.alpha_composite(a, (1920 - a.width - 70, 1080 - a.height - 50))
fg.alpha_composite(h, (1920 - a.width - h.width + 60, 1080 - h.height - 30))
bg.save(O / 'cover/HypnoMonkey-Cover-BG.png')
fg.save(O / 'cover/HypnoMonkey-Cover-FG.png')
prev = bg.convert('RGBA'); prev.alpha_composite(fg)
prev.convert('RGB').save(O / 'cover/HypnoMonkey-Cover-PREVIEW-only.png')

for f in ['thumbnail/HypnoMonkey-Thumbnail-BG.png', 'cover/HypnoMonkey-Cover-BG.png']:
    print(f, 'mean', round(sum(ImageStat.Stat(Image.open(O / f).convert('L')).mean), 1))
