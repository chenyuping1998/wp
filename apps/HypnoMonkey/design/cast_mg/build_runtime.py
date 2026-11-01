"""Crop and pack the SAME accepted source layers for the app-owned 4.3 renderer."""
from pathlib import Path
from PIL import Image
import json,hashlib,shutil

ROOT=Path(__file__).resolve().parent
APP=ROOT.parents[1]
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def main():
    source=ROOT/'layers';spine=ROOT/'cast_mg_spine'
    entries=[]
    for path in source.glob('*.png'):
        assert sha(path)==sha(spine/'images'/path.name),f'Spine/source revision mismatch: {path.name}'
        image=Image.open(path).convert('RGBA');box=image.getchannel('A').getbbox()
        entries.append((path.stem,image.crop(box),box,sha(path)))
    entries.sort(key=lambda item:item[1].height,reverse=True)
    atlas=Image.new('RGBA',(2048,2048));x=y=row=2;mapping={}
    for name,image,box,digest in entries:
        if x+image.width+2>2048:x=2;y+=row+2;row=0
        assert y+image.height+2<=2048,'Atlas overflow'
        atlas.alpha_composite(image,(x,y))
        mapping[name]={'x':x,'y':y,'width':image.width,'height':image.height,'cropX':box[0],'cropY':box[1],'sourceSha256':digest}
        x+=image.width+4;row=max(row,image.height)
    folder=APP/'static/assets/sprites/hypnoCast';folder.mkdir(parents=True,exist_ok=True)
    atlas.save(folder/'mg-atlas.png',optimize=True)
    game=APP/'src/game'
    (game/'hypnoCastAtlas.json').write_text(json.dumps({'width':2048,'height':2048,'parts':mapping},indent=2)+'\n')
    shutil.copy2(spine/'cast_mg.json',game/'hypnoCastData.json')
    (ROOT/'runtime-manifest.json').write_text(json.dumps({'sourceLayers':32,'atlas':str(folder/'mg-atlas.png'),'atlasSha256':sha(folder/'mg-atlas.png'),'spineSha256':sha(spine/'cast_mg.json'),'runtimeSpineSha256':sha(game/'hypnoCastData.json'),'crops':mapping},indent=2)+'\n')
    print('Packed 32 matching source layers into a 2048x2048 atlas; RGBA texture budget 16 MiB.')
if __name__=='__main__':main()
