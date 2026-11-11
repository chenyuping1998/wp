"""Precise master-based layer split; generated art supplies concealed areas/variants.
Authorized by Stone 2026-11-04. Never stages the game or writes Spine JSON.
"""
from pathlib import Path
import json,math,hashlib
import numpy as np
from scipy import ndimage as ndi
from PIL import Image,ImageDraw,ImageFont
import aggdraw
from skimage.morphology import convex_hull_image
ROOT=Path(__file__).resolve().parent
SIZE=(1024,1536)
FONT=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',18)

def bez(coords):
 im=Image.new('L',SIZE);c=aggdraw.Draw(im);p=aggdraw.Path()
 for op,pts in coords:
  getattr(p,{'M':'moveto','C':'curveto','L':'lineto'}[op])(*pts)
 p.close();c.path(p,None,aggdraw.Brush(255));c.flush();return np.array(im)/255.
def path(s):
 vals=s.split();out=[];i=0
 while i<len(vals):
  op=vals[i];n=2 if op in ['M','L'] else 6
  out.append((op,list(map(float,vals[i+1:i+1+n]))));i+=n+1
 return bez(out)
def smoothcap(x,y,rx,ry):
 im=Image.new('L',SIZE);ImageDraw.Draw(im).ellipse((x-rx,y-ry,x+rx,y+ry),fill=255);return np.array(im)/255.
def clean(im,roi=None):
 a=np.array(im.convert('RGBA')).copy();mask=a[:,:,3]>110
 if roi:
  r=np.zeros(mask.shape,bool);x0,y0,x1,y1=roi;r[max(0,y0):min(mask.shape[0],y1),max(0,x0):min(mask.shape[1],x1)]=True;mask&=r
 lab,num=ndi.label(mask)
 if num:
  areas=np.bincount(lab.ravel());areas[0]=0;main=lab==areas.argmax();near=ndi.binary_dilation(main,iterations=2)
  a[:,:,3]=np.where(near,np.clip((a[:,:,3].astype(float)-20)*255/220,0,255),0).astype('uint8')
 nz=np.argwhere(a[:,:,3]>0)
 if len(nz):
  y0,x0=nz.min(axis=0);y1,x1=nz.max(axis=0)+1;part=a[y0:y1,x0:x1];solid=part[:,:,3]>235
  if solid.any():
   dist,idx=ndi.distance_transform_edt(~solid,return_indices=True);edge=(part[:,:,3]>0)&(part[:,:,3]<235);colors=part[idx[0],idx[1],:3];part[edge,:3]=colors[edge];part[(edge)&(dist>5),3]=0
 fl,fn=ndi.label(a[:,:,3]>0)
 if fn:
  fs=np.bincount(fl.ravel());fs[0]=0;a[fl!=fs.argmax(),3]=0
 a[a[:,:,3]==0,:3]=0
 return Image.fromarray(a)
def load(ch,name):
 source=ROOT/'交件'/ch/'raw'/(name+'.png')
 if ch=='host' and name=='torso':source=ROOT/'精修/source/host_torso_no_socket.png'
 im=Image.open(source).convert('RGBA')
 # The defective DJ hip-hand export contains an unrelated white strip at right.
 return clean(im,(0,0,min(im.width,840),im.height) if ch=='dj' and name=='hand_l_hip' else None)
def bb(im):return im.getchannel('A').point(lambda a:255 if a>100 else 0).getbbox()
def fitted(im,box,stretch=True):
 b=bb(im);crop=im.crop(b);w=round(box[2]-box[0]);h=round(box[3]-box[1]);out=Image.new('RGBA',SIZE)
 if stretch:crop=crop.resize((w,h),Image.Resampling.LANCZOS)
 else:
  crop.thumbnail((w,h),Image.Resampling.LANCZOS)
 out.paste(crop,(round(box[0]),round(box[1])));return out

def masked(im,m):
 a=np.array(im).copy();a[:,:,3]=(a[:,:,3].astype(float)*m).clip(0,255).astype('uint8');a[a[:,:,3]==0,:3]=0;return Image.fromarray(a)
def over(a,b):return Image.alpha_composite(a,b)
def skin_mask(im,region):
 a=np.array(im).astype(float);r,g,b=a[:,:,:3].transpose(2,0,1)
 core=(r>65)&(g>r*.52)&(g<r*.80)&(b<g*.91)&(a[:,:,3]>100)&(region>0)
 core=ndi.binary_closing(core,iterations=2);core=ndi.binary_fill_holes(core)
 edge=ndi.binary_dilation(core,iterations=4)&((r+g+b)<240)&(region>0)&(a[:,:,3]>80)
 return (core|edge).astype(float)*region

def save_part(D,name,im):
 im=clean(im);im.save(D/'layers'/(name+'.png'));return im

def transform(im,src,dst,scale=1,angle=0):
 rad=math.radians(angle);c=math.cos(rad)/scale;s=math.sin(rad)/scale
 coeff=(c,s,src[0]-c*dst[0]-s*dst[1],-s,c,src[1]+s*dst[0]-c*dst[1])
 return im.transform(SIZE,Image.Transform.AFFINE,coeff,Image.Resampling.BICUBIC)

CFG={
'dj':{
 'joints':{'shoulder_l':[352,390],'elbow_l':[230,530],'wrist_l':[320,682],'shoulder_r':[681,399],'elbow_r':[757,567],'wrist_r':[683,501],'hip_l':[440,870],'knee_l':[358,1100],'ankle_l':[327,1380],'hip_r':[640,868],'knee_r':[665,1105],'ankle_r':[689,1375],'neck':[527,342]},
 'torso_box':(324,326,733,823),'pelvis_box':(300,758,760,1055),
 'torso_mask':'M 414 327 C 439 321 468 335 500 346 C 539 357 580 344 604 324 C 647 326 689 347 700 389 C 707 439 689 477 699 531 C 711 612 720 683 735 780 C 643 830 405 837 323 789 C 332 727 356 666 355 600 C 350 551 337 525 348 477 C 372 441 384 399 365 365 C 380 345 400 334 414 327',
 'arm_l_upper':'M 398 342 C 323 348 260 399 225 449 C 203 478 181 507 187 536 C 190 556 213 579 240 581 C 262 578 283 558 289 539 C 311 513 343 501 363 466 C 400 427 425 370 398 342',
 'arm_l_lower':'M 242 485 C 220 478 195 497 188 523 C 192 575 239 640 280 687 C 297 708 321 719 341 704 C 357 690 351 671 328 655 C 299 625 287 576 275 538 C 266 512 254 493 242 485',
 'arm_r_upper':'M 627 332 C 687 349 723 374 740 410 C 754 441 783 480 785 510 C 783 541 766 568 745 580 C 722 575 707 547 698 519 C 685 476 660 447 650 411 C 642 386 624 347 627 332',
 'arm_r_lower':'M 727 524 C 742 511 772 516 787 535 C 805 560 802 592 782 609 C 754 631 708 597 695 569 C 684 542 660 516 654 486 C 661 471 687 475 700 492 C 711 505 717 516 727 524',
 'hand_l_hip':'M 287 652 C 315 647 343 649 362 648 C 387 646 414 660 425 675 C 426 690 413 693 402 688 C 423 703 424 715 411 718 C 407 728 400 731 390 724 C 405 742 391 751 376 742 C 353 730 336 715 320 713 C 296 706 280 681 287 652',
 'hand_r_grip':'M 594 420 C 623 399 656 408 674 427 C 688 442 690 467 704 483 C 718 503 700 525 682 530 C 654 521 641 505 624 497 C 605 481 588 449 594 420',
 'head_box':(395,90,650,390),'head_mask':'M 300 30 C 400 0 700 0 780 100 C 810 230 698 318 613 342 C 588 355 570 378 551 396 C 522 417 478 403 457 377 C 432 353 379 342 348 300 C 305 230 292 100 300 30',
 'neck_box':(455,310,612,397),'hat_box':(397,110,646,308),
 'legs':{'l':{'root':[441,862],'knee':[357,1100],'ankle':[327,1380],'region':'M 330 752 C 425 745 536 754 565 833 C 571 900 498 987 447 1089 C 425 1174 426 1240 400 1385 C 362 1423 286 1424 239 1397 C 236 1310 250 1220 270 1130 C 282 1019 286 927 307 850 C 322 806 326 776 330 752'},'r':{'root':[642,868],'knee':[669,1105],'ankle':[690,1378],'region':'M 559 764 C 618 755 701 749 735 807 C 766 880 795 977 767 1040 C 744 1118 786 1207 757 1304 C 754 1346 766 1381 746 1405 C 705 1425 638 1416 599 1408 C 584 1325 578 1240 589 1175 C 572 1092 549 1028 544 970 C 536 915 513 823 559 764'}},
 'foot_boxes':{'l':(200,1345,391,1456),'r':(601,1340,845,1456)},
},
'host':{
 'joints':{'shoulder_l':[437,390],'elbow_l':[306,525],'wrist_l':[420,650],'shoulder_r':[651,405],'elbow_r':[729,566],'wrist_r':[733,482],'hip_l':[481,721],'knee_l':[392,1025],'ankle_l':[347,1271],'hip_r':[641,722],'knee_r':[661,1027],'ankle_r':[686,1274],'neck':[555,321]},
 'torso_box':(423,328,706,615),'pelvis_box':(366,587,733,994),
 'torso_mask':'M 491 326 C 536 327 568 339 605 326 C 638 335 663 354 671 388 C 679 428 680 467 690 506 C 699 543 698 582 681 611 C 627 629 533 621 473 592 C 478 555 472 514 445 486 C 412 450 420 396 438 366 C 472 347 480 337 491 326',
 'arm_l_upper':'M 444 349 C 406 344 377 372 366 405 C 336 426 307 431 279 461 C 260 484 245 502 251 528 C 258 552 284 574 305 573 C 330 564 352 537 367 516 C 401 493 420 463 439 439 C 464 415 475 370 444 349',
 'arm_l_lower':'M 285 495 C 263 499 255 526 268 549 C 301 598 360 641 398 670 C 416 687 440 678 454 659 C 455 638 432 628 419 630 C 386 603 352 559 331 528 C 318 508 303 496 285 495',
 'arm_r_lower':'M 701 512 C 704 491 718 460 737 452 C 754 457 761 482 766 499 C 779 530 779 557 760 577 C 740 597 709 586 700 567 C 690 551 696 530 701 512',
 'hand_l_hip':'M 392 637 C 420 622 444 606 462 603 C 484 603 513 610 531 625 C 538 638 525 644 513 639 C 533 650 530 662 518 663 C 511 676 500 674 490 671 C 474 687 458 676 446 675 C 424 680 401 675 392 658 C 388 651 388 643 392 637',
 'head_box':(383,90,707,363),'head_mask':'M 300 0 C 440 0 740 0 810 120 C 821 253 741 322 656 331 C 612 336 610 347 596 365 C 563 384 529 371 513 348 C 501 324 450 329 415 320 C 346 297 307 201 300 0',
 'neck_box':(516,297,613,400),'glasses_box':(445,190,609,250),
 'legs':{'l':{'root':[472,724],'knee':[391,1025],'ankle':[347,1273],'region':'M 429 598 C 475 581 548 608 583 661 C 586 746 542 828 500 917 C 471 994 448 1077 444 1153 C 437 1193 449 1225 433 1264 C 390 1297 333 1301 291 1267 C 263 1248 270 1201 291 1154 C 299 1069 319 1009 325 948 C 345 873 354 784 379 713 C 391 667 409 624 429 598'},'r':{'root':[638,722],'knee':[661,1025],'ankle':[686,1278],'region':'M 561 603 C 605 591 658 604 681 644 C 708 704 732 776 733 831 C 748 888 720 953 729 1002 C 737 1070 771 1112 760 1169 C 749 1205 763 1258 736 1288 C 697 1310 628 1302 602 1274 C 580 1230 586 1175 589 1120 C 563 1062 563 986 563 933 C 548 865 520 813 512 757 C 524 697 539 639 561 603'}},
 'foot_boxes':{'l':(228,1256,425,1456),'r':(615,1262,796,1456)},
}}


# Measured centers inside the baggy trouser legs, not the outer pocket folds.
CFG['dj']['joints']['knee_r']=[685,1105]
CFG['dj']['joints']['elbow_l']=[235,545]
CFG['host']['joints']['elbow_l']=[306,545]
CFG['host']['joints']['knee_r']=[645,1027]

REGIONS={
 'dj':{'l':'M 0 720 L 560 720 C 575 810 580 870 550 920 C 550 980 530 1040 490 1110 C 480 1220 500 1320 500 1536 L 0 1536','r':'M 540 720 L 1024 720 L 1024 1536 L 520 1536 C 510 1320 530 1120 530 1030 C 525 950 525 850 540 720'},
 'host':{'l':'M 0 570 L 548 570 C 566 650 567 705 555 760 C 540 870 510 960 470 1050 C 460 1160 490 1270 490 1536 L 0 1536','r':'M 543 570 L 1024 570 L 1024 1536 L 540 1536 C 550 1160 550 1030 547 930 C 525 830 515 700 543 570'}}

def perspective_hat(im):
 b=bb(im);crop=im.crop(b);src=np.array(crop);h,w=src.shape[:2];out=Image.new('RGBA',SIZE)
 # A continuous perspective warp: the far earcup is narrower and sits on the
 # far ear, rather than covering the eye. No component is discarded.
 yy,xx=np.mgrid[:1536,:1024];normx=np.interp(xx,[0,393,427,550,640,1023],[0,0,79,194,w,w])
 yf=np.interp(xx,[0,427,550,1023],[.72,.72,.90,.90]);normy=(yy-110)/yf
 arr=np.empty((1536,1024,4),dtype=np.uint8)
 for c in range(4):arr[:,:,c]=ndi.map_coordinates(src[:,:,c].astype(float),[normy,normx],order=1,mode='constant',cval=0).clip(0,255).astype('uint8')
 arr[(xx<393)|(xx>640)]=0
 return Image.fromarray(arr)

def material_ellipse(paint,center,axis,width,length):
 x,y=map(float,center);im=Image.new('RGBA',SIZE);w,h=round(width),round(length);paint=paint.resize((w,h),Image.Resampling.LANCZOS);im.paste(paint,(round(x-w/2),round(y-h/2)));im=masked(im,smoothcap(x,y,width/2,length/2));angle=math.degrees(math.atan2(axis[1],axis[0]))-90;return transform(im,(x,y),(x,y),1,angle)

def paint_sample(master,kind):
 a=np.array(master);r,g,b=a[:,:,:3].transpose(2,0,1).astype(float);yy,xx=np.mgrid[:1536,:1024]
 if kind=='skin':m=(r>150)&(g>r*.52)&(g<r*.80)&(b>g*.43)&(b<g*.9)&(yy>500)&(yy<650)&(xx>180)&(xx<810)
 elif kind=='blue':m=(g>r*1.1)&(b>g*1.08)&(b>50)&(b<190)&(yy>850)&(yy<1300)
 elif kind=='purple':m=(r>g*1.3)&(b>g*1.3)&(r>35)&(r<130)&(yy>800)&(yy<1200)
 else:m=(r>170)&(g>r*.85)&(b>r*.70)&(b<r*.95)&(yy>360)&(yy<510)&(xx>250)&(xx<470)
 m&=a[:,:,3]>240;vals=(a[:,:,:3]//4).astype(int);keys=vals[:,:,0]*4096+vals[:,:,1]*64+vals[:,:,2];counts=np.bincount(keys[m].ravel(),minlength=262144);dominant=counts.argmax();flat=m&(keys==dominant);d=ndi.distance_transform_edt(flat);cy,cx=np.unravel_index(d.argmax(),d.shape);tile=master.crop((cx-2,cy-2,cx+3,cy+3));return tile,(int(cx),int(cy))
def paint_region(im,tile,weight):
 a=np.array(im).astype(float);rgb=np.array(tile.resize(SIZE,Image.Resampling.NEAREST))[:,:,:3].astype(float);w=np.clip(weight,0,1)[:,:,None];a[:,:,:3]=a[:,:,:3]*(1-w)+rgb*w;return Image.fromarray(a.clip(0,255).astype('uint8'))
def round_forearm(master,orig,E,W,tile,wrist_radius):
 E=np.array(E,float);W=np.array(W,float);v=(W-E)/np.linalg.norm(W-E);length=np.linalg.norm(W-E);yy,xx=np.mgrid[:1536,:1024];q=(xx-E[0])*v[0]+(yy-E[1])*v[1];cross=-(xx-E[0])*v[1]+(yy-E[1])*v[0]
 a=np.array(orig).copy();root_radius=np.sqrt(np.maximum(0,34**2-q**2));root=(q>=-34)&(q<=12)&(np.abs(cross)<=root_radius)
 # The actual shaft is retained; only the concealed root and old palm fragments
 # become smooth tapered paint, not cut-flat old hand pieces.
 alpha=a[:,:,3].astype(float);alpha=np.where(q<0,root.astype(float)*255,alpha)
 qw=q-length;rad=wrist_radius+(34-wrist_radius)*np.sqrt(np.clip(-qw/max(length,1),0,1));rad=np.where(qw>=0,wrist_radius*np.sqrt(np.maximum(0,1-(qw/40)**2)),rad)
 taper=np.clip(rad-np.abs(cross)+.5,0,1);alpha=np.where(qw>-40,alpha*taper,alpha);tip=(qw>=-10)&(qw<=40)&(np.abs(cross)<=rad);alpha=np.maximum(alpha,tip.astype(float)*255)
 a[:,:,3]=alpha.clip(0,255);out=Image.fromarray(a.astype('uint8'));wroot=np.clip((28-q)/20,0,1);wtip=np.clip((qw+35)/15,0,1);out=paint_region(out,tile,np.maximum(wroot,wtip));return out
def round_upper(orig,S,E,tile,radius=34):
 S=np.array(S,float);E=np.array(E,float);v=(E-S)/np.linalg.norm(E-S);yy,xx=np.mgrid[:1536,:1024];q=(xx-E[0])*v[0]+(yy-E[1])*v[1];cross=-(xx-E[0])*v[1]+(yy-E[1])*v[0];a=np.array(orig).copy()
 radial=np.where(q>=0,np.sqrt(np.maximum(0,radius**2-q**2)),radius+16*np.clip(-q/65,0,1));bound=np.clip(radial-np.abs(cross)+.5,0,1);a[:,:,3]=(a[:,:,3]*np.where(q>-65,bound,1)).astype('uint8');cap=(q>=-12)&(q<=radius)&(np.abs(cross)<=radial);a[:,:,3]=np.maximum(a[:,:,3],cap.astype('uint8')*255);return paint_region(Image.fromarray(a),tile,np.clip((q+28)/16,0,1))

def detect_wrist(im,fallback):
 a=np.array(im).astype(float);r,g,b=a[:,:,:3].transpose(2,0,1);m=a[:,:,3]>150;edge=m&~ndi.binary_erosion(m,iterations=2)
 warm=(r>100)&(g>r*.50)&(g<r*.92)&(b<g*.92);cand=edge&warm
 lab,n=ndi.label(ndi.binary_dilation(cand,iterations=3))
 if n:
  counts=np.bincount(lab[cand].ravel(),minlength=n+1);counts[0]=0;pts=np.argwhere(cand&(lab==counts.argmax()))[:,::-1].astype(float)
 else:pts=np.empty((0,2))
 if len(pts)>5:cap=np.median(pts,axis=0)
 else:
  x0,y0,x1,y1=bb(im);cap=np.array([x0+(x1-x0)*fallback[0],y0+(y1-y0)*fallback[1]])
 skin=np.argwhere(warm&m)[:,::-1].astype(float);center=np.median(skin,axis=0);axis=center-cap;axis/=max(np.linalg.norm(axis),1)
 return cap,axis

def generate(ch):
 cfg=CFG[ch];D=ROOT/'精修'/'v1'/ch
 for sub in ['layers','qa']: (D/sub).mkdir(parents=True,exist_ok=True)
 reference=ROOT/'交件'/ch/'reference-master.png'
 if not reference.exists():reference=ROOT/'交件'/ch/'master.png'
 master=clean(Image.open(reference))
 for side in ['l','r']:
  cfg['legs'][side]['root']=cfg['joints']['hip_'+side];cfg['legs'][side]['knee']=cfg['joints']['knee_'+side];cfg['legs'][side]['ankle']=cfg['joints']['ankle_'+side]
 layers={};J=cfg['joints']
 # Complete, generated body underpainting; its organic outline is retained.
 body=fitted(load(ch,'torso'),cfg['torso_box'])
 if ch=='dj':
  ba=np.array(body);warm=(ba[:,:,0]>90)&(ba[:,:,1]<ba[:,:,0]*.65);rgb=ba[:,:,:3].astype(float);rgb[warm]+=np.array([-25,4,7]);ba[:,:,:3]=rgb.clip(0,255).astype('uint8');body=Image.fromarray(ba)
 layers['torso']=masked(body,path(cfg['torso_mask']))
 if ch=='dj':
  rootmask=np.maximum(path('M 355 350 C 379 338 407 331 423 345 C 427 372 413 404 392 417 C 371 402 350 373 355 350'),path('M 645 343 C 667 345 692 351 708 371 C 716 390 709 412 691 423 C 665 413 639 377 645 343'))
  layers['torso']=over(masked(master,rootmask),layers['torso'])
 pelvis=fitted(load(ch,'pelvis'),cfg['pelvis_box'])
 # Preserve original trouser linework wherever visible; generated waist under
 # shirt/hand remains painted behind. Filter out skin and upper clothing.
 a=np.array(master)
 if ch=='dj':
  pants=path('M 0 795 C 310 795 330 792 350 798 C 450 832 620 833 735 790 C 800 785 950 790 1024 790 L 1024 1536 L 0 1536')>0
 else:
  pants=path('M 0 680 C 350 680 411 625 450 597 C 490 582 530 598 555 604 C 590 619 631 622 657 608 C 701 655 725 727 745 790 L 1024 800 L 1024 1536 L 0 1536')>0
 hand_exclude=skin_mask(master,path(cfg['hand_l_hip']))>0
 pants &= ~ndi.binary_dilation(hand_exclude,iterations=2)
 # Use the master for the entire visible lower body; existing folds remain intact.
 lower=over(pelvis,masked(master,pants.astype(float)))
 yy,xx=np.mgrid[:1536,:1024];lower=masked(lower,np.where(yy>(800 if ch=='dj' else 685),(np.array(master)[:,:,3]>128).astype(float),1.))
 upper_union=np.zeros((1536,1024),float)
 for side,v in cfg['legs'].items():
  region=path(REGIONS[ch][side]);kx,ky=v['knee'];ax,ay=v['ankle']
  # The split is an organic cap tucked inside the neighbouring limb. It never
  # shaves the visible calf or thigh silhouette with a straight chord.
  top=path(f'M 0 0 C 300 0 800 0 1024 0 L 1024 {ky-15} C {kx+180} {ky+15} {kx+100} {ky+65} {kx} {ky+65} C {kx-100} {ky+65} {kx-180} {ky+15} 0 {ky-15}')
  bottom=path(f'M 0 {ky+25} C {kx-130} {ky-65} {kx-85} {ky-65} {kx} {ky-65} C {kx+85} {ky-65} {kx+130} {ky-50} 1024 {ky+25} L 1024 1536 L 0 1536')
  foot_end=path(f'M 0 0 L 1024 0 L 1024 {ay+20} C {ax+100} {ay+45} {ax+55} {ay+45} {ax} {ay+45} C {ax-55} {ay+45} {ax-100} {ay+20} 0 {ay+20}')
  rx,ry=v['root'];gy,gx=np.mgrid[:1536,:1024];rootline=ry+15-70*np.sqrt(np.maximum(0,1-((gx-rx)/110)**2));rootcap=(gy>=rootline).astype(float)
  top=(gy<=ky-10+75*np.sqrt(np.maximum(0,1-((gx-kx)/180)**2))).astype(float);bottom=(gy>=ky+10-75*np.sqrt(np.maximum(0,1-((gx-kx)/180)**2))).astype(float)
  layers[f'leg_{side}_upper']=masked(lower,region*top*rootcap)
  ll=masked(lower,region*bottom*foot_end)
  la=np.array(ll);cr,cg,cb=la[:,:,:3].transpose(2,0,1).astype(float);mat=((cb>cg*1.04)&(cg>cr*.9)&(cb>cr*.95)&(cb>40)) if ch=='dj' else ((cb>cg*1.05)&(cr>cg*1.25)&(cb>cr*.7)&(cr<165)&(cr>45)&(cb>40))
  mat=ndi.binary_dilation(ndi.binary_fill_holes(ndi.binary_closing(mat,iterations=2)),iterations=3)
  yy0=np.arange(1536)[:,None];ll=masked(ll,np.where(yy0>ay-50,mat.astype(float),1.))
  layers[f'leg_{side}_lower']=ll
  foot=fitted(load(ch,f'foot_{side}'),cfg['foot_boxes'][side])
  if ch=='host':
   fb=bb(foot);fa=np.array(foot);row=fb[1]+25;xs=np.where(fa[row,:,3]>200)[0];x0,x1=int(xs.min()),int(xs.max())+1;paint=foot.crop((x0,row+5,x1,row+30)).resize((x1-x0,80),Image.Resampling.LANCZOS);shaft=Image.new('RGBA',SIZE);shaft.paste(paint,(x0,fb[1]-60));shaft=masked(shaft,smoothcap((x0+x1)/2,fb[1]-17,(x1-x0)/2,43));foot=over(shaft,foot)
  layers[f'foot_{side}']=foot
  upper_union=np.maximum(upper_union,region)
 py=900 if ch=='dj' else 745
 pelvis_end=path(f'M 0 0 L 1024 0 L 1024 {py-30} C 760 {py-25} 650 {py+40} 560 {py+5} C 470 {py+40} 350 {py+30} 0 {py-30}')
 layers['pelvis']=masked(lower,pelvis_end*upper_union)
 # Arms come from the same master, not independently redrawn limbs.
 for side in ['l','r']:
  for seg in ['upper','lower']:
   name=f'arm_{side}_{seg}'
   if name in cfg:layers[name]=masked(master,path(cfg[name]))
   if name=='arm_r_lower' and ch=='host':layers[name]=masked(master,skin_mask(master,path(cfg[name])))
 # Near jacket sleeve is concealed by the microphone arm in the master.
 # Reuse the complete matching far sleeve, reflected and positioned by actual
 # shoulder/elbow landmarks; generated sleeves supplied the covered cloth.
 if ch=='host':
  upper=layers['arm_l_upper']
  flip=upper.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
  srcS=np.array([1023-J['shoulder_l'][0],J['shoulder_l'][1]]);srcE=np.array([1023-J['elbow_l'][0],J['elbow_l'][1]])
  dstS=np.array(J['shoulder_r']);dstE=np.array(J['elbow_r']);v=srcE-srcS;w=dstE-dstS
  scale=np.linalg.norm(w)/np.linalg.norm(v);angle=math.degrees(math.atan2(w[1],w[0])-math.atan2(v[1],v[0]))
  layers['arm_r_upper']=transform(flip,srcS,dstS,scale,angle)
  yy,xx=np.mgrid[:1536,:1024];vx,vy=(dstE-dstS)/np.linalg.norm(dstE-dstS);q=(xx-dstE[0])*vx+(yy-dstE[1])*vy;cross=-(xx-dstE[0])*vy+(yy-dstE[1])*vx
  layers['arm_r_upper']=masked(layers['arm_r_upper'],(q<-15-(cross/55)**2*12).astype(float))
  ma=np.array(master);rr,gg,bb0=ma[:,:,:3].transpose(2,0,1).astype(float);cm=(rr>140)&(gg>rr*.80)&(bb0>rr*.72)&(ma[:,:,3]>80)&(xx>675)&(yy>475)&(yy<622)&(xx<795)
  cm=ndi.binary_fill_holes(ndi.binary_closing(cm,iterations=2));cl,cn=ndi.label(cm);cs=np.bincount(cl.ravel());cs[0]=0;cm=(cl==cs.argmax());cm=ndi.binary_dilation(cm,iterations=4)&(xx>673)&(yy>473)&(yy<624)&(xx<797)
  cm &= ~((rr>120)&(gg>rr*.6)&(bb0<gg*.6));layers['arm_r_upper']=over(layers['arm_r_upper'],masked(master,cm.astype(float)))
 else:
  flip=layers['arm_l_upper'].transpose(Image.Transpose.FLIP_LEFT_RIGHT);srcS=np.array([1023-J['shoulder_l'][0],J['shoulder_l'][1]]);srcE=np.array([1023-J['elbow_l'][0],J['elbow_l'][1]]);dstS=np.array(J['shoulder_r']);dstE=np.array(J['elbow_r']);v=srcE-srcS;w=dstE-dstS;sc=np.linalg.norm(w)/np.linalg.norm(v);ang=math.degrees(math.atan2(w[1],w[0])-math.atan2(v[1],v[0]));up=transform(flip,srcS,dstS,sc,ang)
  yy,xx=np.mgrid[:1536,:1024];vx,vy=w/np.linalg.norm(w);q=(xx-dstE[0])*vx+(yy-dstE[1])*vy;cross=-(xx-dstE[0])*vy+(yy-dstE[1])*vx;layers['arm_r_upper']=masked(up,(q<-20+35*np.sqrt(np.maximum(0,1-(cross/35)**2))).astype(float))
 # Reconcile the near elbow against the native master silhouette, not just
 # a numeric overlap. Concealed cloth/skin is painted from this same figure.
 if ch=='dj':
  um=path('M 647 339 C 682 343 711 362 733 397 C 750 424 773 458 785 492 C 796 512 801 536 800 555 C 787 582 755 594 730 572 C 713 552 712 524 703 500 C 696 473 691 449 681 428 C 668 407 649 378 647 339')
  yy,xx=np.mgrid[:1536,:1024];bad=(skin_mask(master,um)>0)&(yy<490);base=layers['arm_r_upper'];cloth=material_ellipse(master.crop((707,410,727,445)),(681,430),np.array([0.,1.]),90,190);base=over(cloth,base);upper=over(base,masked(master,um*(~bad)));layers['arm_r_upper']=masked(upper,um)
 else:
  E=np.array(J['elbow_r']);paint=material_ellipse(master.crop((720,530,737,548)),E,np.array([0.,1.]),66,96);up=layers['arm_r_upper'];ua=np.array(up);ma=np.array(master);flesh=skin_mask(master,path(cfg['arm_r_lower']));pa=np.array(paint);zone=(flesh>0)&(ua[:,:,3]>0)&(yy>520)&(pa[:,:,3]>0);ua[zone,:3]=pa[zone,:3];up=Image.fromarray(ua)
  # Fill the actual sleeve opening with complete elbow anatomy. The genuine
  # rolled cuff is then the only cloth contour in front of that skin.
  union=(np.array(up)[:,:,3]>128)|(np.array(layers['arm_r_lower'])[:,:,3]>128);inside=np.zeros((1536,1024),bool);ex,ey=J['elbow_r'];inside[ey-65:ey+50,ex-55:ex+55]=convex_hull_image(union[ey-65:ey+50,ex-55:ex+55]);paint=masked(paint,inside.astype(float));up=over(paint,up);ua=np.array(up);pa=np.array(paint);zone=(flesh>0)&(ua[:,:,3]>0)&(yy>520)&(pa[:,:,3]>0);ua[zone,:3]=pa[zone,:3];layers['arm_r_upper']=Image.fromarray(ua)
 # The cuff covers the painted upper end of each forearm. Preserve the full
 # hidden anatomy beneath it, with no cloth fragments on the forearm layer.
 if ch=='host':
  for side,core in [('l',(321,565,341,585)),('r',(720,530,737,548))]:
   upper=layers[f'arm_{side}_upper'];lowername=f'arm_{side}_lower';orig=masked(master,skin_mask(master,path(cfg[lowername])))
   ex,ey=J['elbow_'+side];wx,wy=J['wrist_'+side];vec=np.array([wx-ex,wy-ey]);vec=vec/np.linalg.norm(vec);yy,xx=np.mgrid[:1536,:1024];q=(xx-ex)*vec[0]+(yy-ey)*vec[1]
   paint=master.crop(core).resize((60,100),Image.Resampling.LANCZOS);under=Image.new('RGBA',SIZE);under.paste(paint,(ex-30,ey-65));union=(np.array(upper)[:,:,3]>128)|(np.array(orig)[:,:,3]>128);inside=np.zeros((1536,1024),bool);xa,xb=max(0,ex-70),min(1024,ex+70);ya,yb=max(0,ey-85),min(1536,ey+50);inside[ya:yb,xa:xb]=convex_hull_image(union[ya:yb,xa:xb]);inside=ndi.binary_erosion(inside,iterations=2)
   cap=smoothcap(ex,ey-15,30,50)*inside.astype(float)
   lo=over(masked(under,cap),orig);la=np.array(lo);pa=np.array(under);zone=(q<20)&(la[:,:,3]>0)&(pa[:,:,3]>0);la[zone,:3]=pa[zone,:3];layers[lowername]=Image.fromarray(la)
   if side=='r':
    # The bracelets belong to the hand variants; no spare bracelet fragments
    # remain on the forearm when the hand changes.
    la=np.array(layers[lowername]);skinpaint=material_ellipse(master.crop(core),J['wrist_r'],vec,90,150);sp=np.array(skinpaint);zone=(yy<523)&(la[:,:,3]>0)&(sp[:,:,3]>0);la[zone,:3]=sp[zone,:3];perp=-(xx-ex)*vec[1]+(yy-ey)*vec[0];rad=22+25/(1+np.exp((q-45)/8));la[:,:,3]=np.where(np.abs(perp)>rad,0,la[:,:,3]);layers[lowername]=Image.fromarray(la)
 else:
  # Replace the old palm/nail pixels beyond the wrist with an organic painted
  # continuation of this same forearm, tucked under the separate hand.
  E=np.array(J['elbow_r']);W=np.array(J['wrist_r']);v=(W-E)/np.linalg.norm(W-E);yy,xx=np.mgrid[:1536,:1024];q=(xx-W[0])*v[0]+(yy-W[1])*v[1];cross=-(xx-W[0])*v[1]+(yy-W[1])*v[0];region=((np.abs(cross)<43)&(q>-135)&(q<10)).astype(float);orig=masked(master,skin_mask(master,region));paint=material_ellipse(master.crop((720,550,745,574)),W,v,50,95)
  layers['arm_r_lower']=over(paint,masked(orig,(q<=-(cross/35)**2*12).astype(float)))
 # Default hip hand uses master skin, excluding every piece of torso cloth.
 handregion=path(cfg['hand_l_hip']);layers['hand_l_hip']=masked(master,skin_mask(master,handregion))
 if ch=='dj':layers['hand_r_grip']=masked(master,skin_mask(master,path(cfg['hand_r_grip'])))
 else:
  # The clean raised-mic take retains the full wireless microphone and its hand.
  layers['hand_r_grip']=fitted(load(ch,'hand_r_hatheld'),(672,315,775,526))
 # Heads have a common measured hair width and a common neck connector. This
 # corrects generator framing while retaining uniform scale (no squashing).
 hx0,hy0,hx1,hy1=cfg['head_box']
 for name in ['head_idle','head_blink','head_spiral','head_grin','head_annoyed']:
  raw=load(ch,name);b0=bb(raw);crop=raw.crop(b0);scale=(hx1-hx0)/crop.width
  crop=crop.resize((round(crop.width*scale),round(crop.height*scale)),Image.Resampling.LANCZOS)
  head=Image.new('RGBA',SIZE);head.paste(crop,(hx0,hy0));yy,xx=np.mgrid[:1536,:1024];cx=540 if ch=='dj' else 557;cy=375 if ch=='dj' else 353;neckarea=(xx>cx-65)&(xx<cx+65);cut=cy-((xx-cx)/65)**2*25;layers[name]=masked(head,np.where(neckarea,yy<cut,True).astype(float))
 if ch=='host':
  neck=load(ch,'neck').crop((538,330,610,430));nc=Image.new('RGBA',SIZE);nc.paste(neck.resize((92,141),Image.Resampling.LANCZOS),(520,280));layers['neck']=masked(nc,path('M 549 282 C 570 278 589 285 597 304 C 604 337 611 368 611 398 C 599 422 540 431 522 400 C 520 368 523 337 529 310 C 533 292 541 286 549 282'))
 else:
  neck=load(ch,'neck').crop((490,337,600,380));nc=Image.new('RGBA',SIZE);nc.paste(neck.resize((135,120),Image.Resampling.LANCZOS),(470,290));layers['neck']=masked(nc,path('M 495 292 C 530 282 567 291 585 308 C 600 334 606 370 594 398 C 561 420 512 418 480 393 C 466 362 470 322 495 292'))
 prop='hat' if ch=='dj' else 'glasses';layers[prop]=fitted(load(ch,prop),cfg[prop+'_box'])
 if ch=='dj':layers['hat']=perspective_hat(load(ch,'hat'))
 # All replacement hands are registered at a shared wrist, not at their bbox
 # center. Uniform scale preserves fingers, hand-held props and anatomy.
 wristdata={
 'dj':{'hand_l_open':((.03,.52),.49,59),'hand_l_point':((.94,.70),.49,-127),'hand_r_open':((.06,.90),.60,-93),'hand_r_pinch':((.81,.90),.49,-18),'hand_r_hatheld':((.88,.15),.56,22)},
 'host':{'hand_l_open':((.91,.70),.37,-149),'hand_l_point':((.94,.70),.43,-144),'hand_r_open':((.13,.92),.39,-42),'hand_r_pinch':((.53,.94),.43,13),'hand_r_hatheld':((.65,.91),.90,13)}}
 for name,(pivot,scale,ang) in wristdata[ch].items():
  raw=load(ch,name);b0=bb(raw);cap,axis=detect_wrist(raw,pivot)
  dst=np.array(J['wrist_l' if name.startswith('hand_l') else 'wrist_r']);elbow=np.array(J['elbow_l' if name.startswith('hand_l') else 'elbow_r']);v=(dst-elbow)/np.linalg.norm(dst-elbow)
  ang=math.degrees(math.atan2(v[1],v[0])-math.atan2(axis[1],axis[0]))
  layers[name]=transform(raw,cap,dst-v*14,scale,ang)
  yy,xx=np.mgrid[:1536,:1024];start=dst-v*45;px=xx-start[0];py=yy-start[1];along=np.clip(px*v[0]+py*v[1],0,35);dist=(px-along*v[0])**2+(py-along*v[1])**2
  patchsource=master
  if ch=='host' and name.startswith('hand_r'):
   # A clean painted section of the same forearm supplies the concealed wrist,
   # not an extra copy of its bracelets or any torso pixels.
   patchsource=transform(master,(729,548),dst-v*28,1,0)
  patch=masked(patchsource,skin_mask(patchsource,(dist<(16 if ch=='dj' else 12)**2).astype(float)))
  layers[name]=over(patch,layers[name])
  if ch=='host' and name=='hand_l_open':
   ar=np.array(layers[name]);rr,gg,bb0=ar[:,:,:3].transpose(2,0,1).astype(float);along=(xx-dst[0])*v[0]+(yy-dst[1])*v[1];gold=(rr>120)&(gg>rr*.58)&(bb0<gg*.50)&(ar[:,:,3]>128)&(along<25);cut=float(np.quantile(along[gold],.98)+3) if gold.any() else 10.
   flesh=material_ellipse(master.crop((321,565,341,585)),dst+v*2,v,28,max(100,cut*2+65));layers[name]=over(flesh,masked(layers[name],(along>cut).astype(float)))
 # Final source joint painting: small round anatomical caps and matching
 # flat pigment in the overlaps. Printed fold/old hand lines never end as a
 # rectangular seam, and no pose amplitude is reduced.
 sk,skpos=paint_sample(master,'skin');cloth,clpos=paint_sample(master,'blue' if ch=='dj' else 'purple');white,whpos=paint_sample(master,'white') if ch=='host' else (sk,skpos)
 for side in ['l','r']:
  layers[f'arm_{side}_upper']=round_upper(layers[f'arm_{side}_upper'],J['shoulder_'+side],J['elbow_'+side],sk if ch=='dj' else white)
  layers[f'arm_{side}_lower']=round_forearm(master,layers[f'arm_{side}_lower'],J['elbow_'+side],J['wrist_'+side],sk,22 if ch=='dj' else 16)
  yy,xx=np.mgrid[:1536,:1024];H=np.array(J['hip_'+side]);K=np.array(J['knee_'+side]);A=np.array(J['ankle_'+side]);v=(K-H)/np.linalg.norm(K-H);rootq=(xx-H[0])*v[0]+(yy-H[1])*v[1];endq=(xx-K[0])*v[0]+(yy-K[1])*v[1];capweight=np.maximum(np.clip((28-rootq)/18,0,1),np.clip((endq+28)/18,0,1));layers[f'leg_{side}_upper']=paint_region(layers[f'leg_{side}_upper'],cloth,capweight)
  v=(A-K)/np.linalg.norm(A-K);q=(xx-K[0])*v[0]+(yy-K[1])*v[1];layers[f'leg_{side}_lower']=paint_region(layers[f'leg_{side}_lower'],cloth,np.clip((28-q)/18,0,1))
 hy=max(J['hip_l'][1],J['hip_r'][1]);bottom=path(f'M 0 0 L 1024 0 L 1024 {hy-22} C 760 {hy-22} 700 {hy+10} 640 {hy+10} C 590 {hy+10} 575 {hy+40} 550 {hy+40} C 525 {hy+40} 510 {hy+10} 440 {hy+10} C 360 {hy+10} 320 {hy-22} 0 {hy-22}');layers['pelvis']=masked(layers['pelvis'],bottom);layers['pelvis']=paint_region(layers['pelvis'],cloth,np.clip((yy-(hy-18))/18,0,1))
 (D/'paint-sources.json').write_text(json.dumps({'reference_skin_tile_center':skpos,'reference_trouser_tile_center':clpos,'reference_white_tile_center':whpos},indent=2)+'\n')
 for name,im in layers.items():layers[name]=save_part(D,name,im)
 order=['arm_l_upper','leg_l_upper','leg_r_upper','foot_l','foot_r','leg_l_lower','leg_r_lower','pelvis','neck','torso','head_idle',prop,'arm_l_lower','hand_l_hip','arm_r_upper','arm_r_lower','hand_r_grip']
 assembled=Image.new('RGBA',SIZE)
 for name in order:assembled.alpha_composite(layers[name])
 assembled.save(D/'qa'/'assembled-candidate.png')
 cfgout={'canvas':SIZE,'ground_y':1456,'joints':J,'draw_order':order,'tool':'master masks + generated underpainting/variants','status':'WORK_IN_PROGRESS'}
 (D/'layout.json').write_text(json.dumps(cfgout,indent=2)+'\n')
 # Every part against both light and dark, full canvas plus tight native crop.
 contacts=[]
 for name,im in sorted(layers.items()):
  sheet=Image.new('RGB',(768,600),'#888888');d=ImageDraw.Draw(sheet)
  for x,col in [(0,'#eeeade'),(384,'#15191f')]:
   bg=Image.new('RGBA',(384,576),col);bg.alpha_composite(im.resize((384,576),Image.Resampling.LANCZOS));sheet.paste(bg.convert('RGB'),(x,24))
  d.text((8,3),name,fill='black',font=FONT);sheet.save(D/'qa'/(name+'-light-dark.jpg'),quality=95)
  b0=bb(im);crop=im.crop(b0);crop.thumbnail((240,260));tile=Image.new('RGBA',(500,300),'#eeeade');tile.alpha_composite(Image.new('RGBA',(250,300),'#15191f'),(250,0))
  tile.alpha_composite(crop,((250-crop.width)//2,32+(260-crop.height)//2));tile.alpha_composite(crop,(250+(250-crop.width)//2,32+(260-crop.height)//2));ImageDraw.Draw(tile).text((5,4),name,font=FONT,fill='black');contacts.append(tile.convert('RGB'))
 sheet=Image.new('RGB',(1500,math.ceil(len(contacts)/3)*300),'#888888')
 for i,t in enumerate(contacts):sheet.paste(t,((i%3)*500,(i//3)*300))
 sheet.save(D/'qa'/'tight-contact.jpg',quality=96)
 proof=Image.new('RGBA',(2048,1536),'#eeeade');proof.alpha_composite(Image.new('RGBA',SIZE,'#15191f'),(1024,0));proof.alpha_composite(assembled,(0,0));proof.alpha_composite(assembled,(1024,0));proof.convert('RGB').save(D/'qa'/'assembled-light-dark.jpg',quality=96)
 print(ch,'written',len(layers),'layers')

if __name__=='__main__':
 for ch in ['dj','host']:generate(ch)
