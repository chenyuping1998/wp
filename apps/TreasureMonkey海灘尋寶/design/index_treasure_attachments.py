"""Read alpha bounds into runtime texture frames; never rewrite generated pixels."""
from pathlib import Path
from PIL import Image
import numpy as np
import json
ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'static/assets/treasure/attachments'
frames={}
def bounds(alpha,offset=(0,0)):
 y,x=np.where(alpha>48)
 assert len(x)>100
 return [int(x.min()+offset[0]),int(y.min()+offset[1]),int(x.max()-x.min()+1),int(y.max()-y.min()+1)]
im=Image.open(ART/'low_boards_v3.png').convert('RGBA');a=np.asarray(im)[:,:,3]
for i in range(4):
 x=(i%2)*im.width//2;y=(i//2)*im.height//2
 frames[f'lowL{i+1}']={'atlas':'treasureLowBoards','rect':bounds(a[y:y+im.height//2,x:x+im.width//2],(x,y))}
for file,key,names in [('scroll_parts_v3.png','treasureScrollParts',['mapPaper','mapRollLeft','mapRollRight']),('coconut_parts_v3.png','treasureCoconutParts',['coconutBase','coconutStraw'])]:
 im=Image.open(ART/file).convert('RGBA');a=np.asarray(im)[:,:,3]
 columns=np.where((a>48).sum(axis=0)>3)[0];groups=[]
 start=previous=int(columns[0])
 for x in columns[1:]:
  if x-previous>16:groups.append((start,previous+1));start=int(x)
  previous=int(x)
 groups.append((start,previous+1))
 assert len(groups)==len(names),(file,groups)
 for name,(x,end) in zip(names,groups):frames[name]={'atlas':key,'rect':bounds(a[:,x:end],(x,0))}
(ROOT/'src/game/treasureAttachmentFrames.json').write_text(json.dumps(frames,indent=2)+'\n')
print(json.dumps(frames,indent=2))
