"""1028 visual-review corrections in final registered coordinates."""
from PIL import Image,ImageDraw,ImageFilter,ImageChops
from collections import deque


def clean_hand(image,name):
    alpha=image.getchannel('A').point(lambda v:255 if v>=145 else 0)
    # Eliminate thin protruding wrist lines and broken fuzzy edge pixels.
    alpha=alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    alpha=alpha.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
    if name=='hand_l_hip':alpha=alpha.filter(ImageFilter.MinFilter(7)).filter(ImageFilter.MaxFilter(7))
    if name.startswith('hand_r_'):
        stronger=alpha.filter(ImageFilter.MinFilter(7)).filter(ImageFilter.MaxFilter(7));box=alpha.getbbox();pixels=alpha.load();clean=stronger.load()
        for y in range(int(box[1]+(box[3]-box[1])*.6),box[3]):
            for x in range(int(box[0]+(box[2]-box[0])*.65),box[2]):pixels[x,y]=clean[x,y]
    alpha=alpha.filter(ImageFilter.GaussianBlur(1.1)).point(lambda v:255 if v>=140 else 0)
    # One continuous ink contour, confined to the actual hand/held hat silhouette.
    inner=alpha.filter(ImageFilter.MinFilter(7 if name=='hand_l_hip' else 5));edge=ImageChops.subtract(alpha,inner)
    out=image.copy();out.putalpha(alpha);ink=Image.new('RGBA',image.size,(34,18,15,255));out.paste(ink,(0,0),edge)
    # Native-resolution one-pixel antialiasing, without a broad transparent halo.
    a=alpha.resize((image.width*2,image.height*2),Image.Resampling.LANCZOS).resize(image.size,Image.Resampling.LANCZOS)
    out.putalpha(a.point(lambda v:0 if v<12 else 255 if v>243 else v))
    return out


def repair_grin(grin):
    # Remove only exterior brown shadow reachable from the empty canvas.
    # The painted black jaw is a barrier; inner mouth/fur remain untouched.
    out=grin.copy();p=out.load();box=(215,365,335,545);reachable=set();queue=deque()
    def allowed(x,y):
        red,green,blue,alpha=p[x,y]
        brown=45<red<190 and 20<green<140 and blue<110 and red>green*1.15 and green>blue*1.12
        return alpha<16 or brown
    for y in range(box[1],box[3]):
        for x in range(box[0],box[2]):
            if p[x,y][3]<16:queue.append((x,y))
    while queue:
        x,y=queue.popleft()
        if (x,y) in reachable:continue
        reachable.add((x,y))
        for nx,ny in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
            if box[0]<=nx<box[2] and box[1]<=ny<box[3] and (nx,ny) not in reachable and allowed(nx,ny):queue.append((nx,ny))
    removed=0
    for x,y in reachable:
        if p[x,y][3]:removed+=1;p[x,y]=(0,0,0,0)
    print(f'Grin exterior brown shadow removed: {removed} pixels; other head silhouettes unchanged.')
    return out


def finish(parts):
    for name in ['hand_l_hip','hand_r_grip','hand_r_pinch','hand_r_hatheld']:
        parts[name]=clean_hand(parts[name],name)
    parts['head_grin']=repair_grin(parts['head_grin'])
    # Bicubic registration can overshoot a flat brown fill at opaque cut ends
    # (e.g. 112 -> 128), creating a pale seam despite perfect alpha coverage.
    # Clamp only that color overshoot; preserve ink, alpha and all geometry.
    for name,image in parts.items():
        if not (name.startswith('tail_') or name.startswith('leg_')):continue
        pixels=image.load();box=image.getbbox()
        for y in range(box[1],box[3]):
            for x in range(box[0],box[2]):
                red,green,blue,alpha=pixels[x,y]
                if alpha and red>=110 and 50<green<100 and blue<60:pixels[x,y]=(min(red,112),min(green,65),min(blue,38),alpha)

    return parts
