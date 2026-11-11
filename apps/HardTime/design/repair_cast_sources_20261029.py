"""Register ImageGen repairs onto existing art. No procedural painting.

Only damaged/hidden sleeve pixels and concealed towel cloth come from the new
paintings. Original visible pixels, pose, joints and animation stay intact.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter, ImageChops
from scipy.ndimage import binary_fill_holes, label

APP = Path(__file__).resolve().parents[1]
ART = APP/'design/_incoming/cast_repair_20261029'
SIZE = (1024, 2048)


def registered(name, box):
    im = Image.open(ART/(name+'.png')).convert('RGBA')
    a = im.getchannel('A').point(lambda v:255 if v>24 else 0)
    im = im.crop(a.getbbox()).resize((box[2]-box[0],box[3]-box[1]),Image.Resampling.LANCZOS)
    out = Image.new('RGBA',SIZE);out.alpha_composite(im,box[:2])
    return out


def replace_rgb(original, painting, mask, feather=3):
    m = Image.fromarray(np.uint8(mask)*255)
    if feather: m=m.filter(ImageFilter.GaussianBlur(feather))
    out = Image.composite(painting,original,m)
    out.putalpha(original.getchannel('A'))
    return out


def components(alpha, count=1):
    labs,n=label(np.array(alpha)>24)
    sizes=np.bincount(labs.ravel());sizes[0]=0
    keep=np.argsort(sizes)[-count:]
    return np.isin(labs,keep)&(labs>0)


def apply(cfg,layers):
    who=cfg['name']
    if who=='prisoner':
        # Replace the whole damaged sleeve with one continuous painted part.
        # Local patches retained copied body scraps and inconsistent edges.
        # Registration keeps the original hand/wrist and elbow coordinates.
        layers['forearm_over']=registered('forearm',(385,589,779,729))
        a=np.array(layers['forearm_over'].getchannel('A'))

        ua=layers['upper_arm_l'];hand=np.array(layers['forearm_under'].getchannel('A'))>40
        hand[:,:640]=False
        m=np.array(Image.fromarray(np.uint8(hand)*255).filter(ImageFilter.MaxFilter(11)))>0
        paint=registered('upper_arm',(671,426,778,701))
        # The concealed lower sleeve must also be painted fabric: the old
        # finger-removal patch had dark marks despite having continuous alpha.
        m[580:,:]=True
        fixed=replace_rgb(ua,paint,m&(np.array(paint.getchannel('A'))>128),3)
        aa=np.array(fixed);bb=np.array(paint);aa[590:]=bb[590:]
        layers['upper_arm_l']=Image.fromarray(aa)

        # Retain the two original visible towel ends, discard the scattered
        # pixels that formerly filled the sleeve holes, and paint one hidden
        # continuous span between the ends. The towel is behind both arms.
        towel=layers['towel'];clean=np.array(towel)
        clean[...,3][~components(towel.getchannel('A'),2)]=0
        original=Image.fromarray(clean)
        paint=registered('towel',(615,376,790,845))
        band=np.zeros(a.shape,np.uint8);band[515:765,:]=255
        bridge=paint.copy();bridge.putalpha(ImageChops.multiply(paint.getchannel('A'),Image.fromarray(band)))
        bridge.alpha_composite(original)
        layers['towel']=bridge
    else:
        # Remove the copied hand at the upper-arm shoulder. Use the clean
        # generated sleeve at the hidden joint, retaining the visible elbow.
        arm=layers['upper_arm_r'];paint=registered('warden_upper_arm',(230,348,407,684))
        a=np.array(arm);b=np.array(paint)
        a[:485,:,:]=b[:485,:,:]
        layers['upper_arm_r']=Image.fromarray(a)
        # Original thigh crop had the key tips baked in; W3 is the approved
        # complete trousers painting already used by the existing pelvis.
        from build_cast_spine_v2_layers import repair
        pants=repair('W3',(262,690,778,1875))
        thigh=layers['thigh_r'];m=np.zeros((2048,1024),bool);m[895:960,330:415]=True
        layers['thigh_r']=replace_rgb(thigh,pants,m,4)
    return layers
