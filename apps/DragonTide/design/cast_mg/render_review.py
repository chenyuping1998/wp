"""Render actual Spine-evaluated matrices for visual QA; no hand-authored motion."""
from pathlib import Path
from PIL import Image, ImageDraw
import json

ROOT=Path(__file__).resolve().parent


def main():
    spec=json.loads((ROOT/'qa/motion-frames.json').read_text())
    images={p.stem:Image.open(p).convert('RGBa') for p in (ROOT/'layers').glob('*.png')}
    w,h=spec['width'],spec['height']
    def render(index,light=True,scale=1):
        size=(round(w*scale),round(h*scale))
        output=Image.new('RGBA',size,(245,245,245,255) if light else (28,28,28,255))
        for name,values in spec['frames'][index]['slots']:
            a,b,c,d,e,f=[x*scale for x in values];det=a*d-b*c
            inverse=(d/det,-b/det,(-d*e+b*f)/det,-c/det,a/det,(c*e-a*f)/det)
            layer=images[name].transform(size,Image.Transform.AFFINE,inverse,resample=Image.Resampling.BICUBIC).convert('RGBA')
            output.alpha_composite(layer)
        return output.convert('RGB')
    # Preserve chronological segments, including transitions back to idle.
    segments=[]
    for k,frame in enumerate(spec['frames']):
        if not segments or segments[-1]['label']!=frame['label']:
            segments.append({'label':frame['label'],'start':k,'end':k})
        else:segments[-1]['end']=k
    seen=set();order=[]
    for seg in segments:
        label=seg['label']
        if label in seen:continue
        seen.add(label);order.append(label)
        indexes=[round(seg['start']+(seg['end']-seg['start'])*t/5) for t in range(6)]
        sheet=Image.new('RGB',(w*3,(h+25)*2),(245,245,245));draw=ImageDraw.Draw(sheet)
        for j,index in enumerate(indexes):
            sheet.paste(render(index),(j%3*w,j//3*(h+25)+25))
            draw.text((j%3*w+10,j//3*(h+25)+5),f'{label} / frame {index}',fill='black')
        sheet.save(ROOT/'qa'/f'motion-{len(order):02d}.jpg',quality=95)
    for index in [112,116,180,247,315,337,405]:
        render(index,scale=2).save(ROOT/'qa'/f'close-frame-{index}.jpg',quality=96)
    (ROOT/'qa/review-segments.json').write_text(json.dumps({'fps':spec['fps'],'frames':len(spec['frames']),'segments':segments,'contact_sheet_order':order},ensure_ascii=False,indent=2)+'\n')
    print(f'Rendered {len(order)} motion sheets plus transition/extreme closeups from current layers.')


if __name__=='__main__':main()
