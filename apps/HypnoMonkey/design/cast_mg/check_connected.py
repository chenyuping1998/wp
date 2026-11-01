"""Measure connected source silhouettes without altering them."""
from pathlib import Path
from PIL import Image
import json,re


def components(alpha,threshold=32):
    mask=alpha.point(lambda v:255 if v>threshold else 0)
    bounds=mask.getbbox()
    if not bounds:return []
    mask=mask.crop(bounds);width,height=mask.size;data=mask.tobytes()
    parent=[];areas=[];boxes=[];previous=[]
    def root(k):
        while parent[k]!=k:
            parent[k]=parent[parent[k]];k=parent[k]
        return k
    for y in range(height):
        current=[];row=data[y*width:(y+1)*width]
        for match in re.finditer(b'\xff+',row):
            x0,x1=match.span();k=len(parent);parent.append(k);areas.append(x1-x0);boxes.append([x0,y,x1,y+1])
            for p0,p1,pk in previous:
                if p1<x0-1:continue
                if p0>x1+1:break
                a=root(k);b=root(pk)
                if a!=b:parent[b]=a
            current.append((x0,x1,k))
        previous=current
    grouped={}
    for k,area in enumerate(areas):
        r=root(k);item=grouped.setdefault(r,{'area':0,'bbox':[width,height,0,0]});item['area']+=area
        b=item['bbox'];q=boxes[k]
        item['bbox']=[min(b[0],q[0]),min(b[1],q[1]),max(b[2],q[2]),max(b[3],q[3])]
    result=sorted(grouped.values(),key=lambda x:x['area'],reverse=True)
    for item in result:
        b=item['bbox'];item['bbox']=[b[0]+bounds[0],b[1]+bounds[1],b[2]+bounds[0],b[3]+bounds[1]]
    return result


if __name__=='__main__':
    root=Path(__file__).resolve().parent
    report={p.stem:components(Image.open(p).getchannel('A')) for p in sorted((root/'layers').glob('*.png'))}
    (root/'qa/connected-components.json').write_text(json.dumps(report,indent=2)+'\n')
    for name,parts in report.items():
        if len(parts)>1:print(name,[(p['area'],p['bbox']) for p in parts])
    print('Source connected-component audit saved.')
