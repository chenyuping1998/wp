"""Pack the generated matching painted linen into a separate long rig texture."""
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parent;D=ROOT/'source/mummy_delivery';out=ROOT.parent/'static/assets/spines/mummyCat'
a=Image.open(D/'originals/flow_bandage_painted_v1.png').convert('RGBA')
# The generated transparent surround contains faint checkerboard residue; discard
# only those low-alpha pixels, retaining the opaque painted cloth and frayed tip.
a.putalpha(a.getchannel('A').point(lambda v:0 if v<160 else v))
a=a.crop(a.getchannel('A').getbbox())
a=a.resize((96,1024),Image.Resampling.LANCZOS)
page=Image.new('RGBA',(104,1032));page.alpha_composite(a,(4,4));page.save(out/'flow_bandage.png')
(D/'mascot/flow').mkdir(exist_ok=True);a.save(D/'mascot/flow/long_linen.png')
print('Prepared painted linen texture:96x1024, transparent frayed edges')
