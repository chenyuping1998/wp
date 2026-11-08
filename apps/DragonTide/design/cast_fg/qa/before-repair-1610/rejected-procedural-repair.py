"""Editable same-canvas anatomical source repairs after the 16:10 art return.

The existing extraction script is the native source. These curves replace its
rectangular masks and caps; no motion, joints, pose registration or scale changes.
ImageGen drafts with diffuse alpha are retained separately and are NOT accepted.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops, ImageFilter
import importlib.util, json, math, hashlib
D=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('curves',D.parent/'cast_mg/native_repairs.py')
curves=importlib.util.module_from_spec(spec);spec.loader.exec_module(curves)
SIZE=(1024,1536);S=3
INK='#372018';BROWN='#884c30';DARK='#713b25';LIGHT='#995735'

def shape(path,color,stroke=None,width=2):return curves.shape(path,color,stroke,width)
def pathline(path,color,width=2):
 im=Image.new('RGBA',(SIZE[0]*S,SIZE[1]*S));d=ImageDraw.Draw(im)
 pts=[(round(x*S),round(y*S)) for x,y in curves.path_points(path)]
 d.line(pts,fill=color,width=round(width*S),joint='curve')
 return im.resize(SIZE,Image.Resampling.LANCZOS)
def over(im,*tops):
 out=im.copy()
 for top in tops:out.alpha_composite(top)
 return out
def crop_to(im,mask):
 out=im.copy();out.putalpha(ImageChops.multiply(im.getchannel('A'),mask.getchannel('A')));return out
def clean(im):
 a=im.getchannel('A').point(lambda v:0 if v<16 else 255 if v>239 else v)
 out=im.copy();out.putalpha(a);return out

def complete_forearm(elbow,wrist,r0,r1):
 """One continuous curved taper, with clean unoutlined overlap ends."""
 ex,ey=elbow;wx,wy=wrist;length=math.dist(elbow,wrist);ux=(wx-ex)/length;uy=(wy-ey)/length
 def p(u,v):return (ex+ux*u-uy*v,ey+uy*u+ux*v)
 def coords(points):return ' '.join(f'{v:.3f}' for pt in points for v in pt)
 def M(u,v):return 'M'+coords([p(u,v)])
 def C(*vs):return ' C'+coords([p(*vs[i:i+2]) for i in range(0,6,2)])
 top=M(-18,-r0*.65)+C(length*.24,-r0*1.04,length*.7,-r1*1.16,length+22,-r1)
 bottom=M(length+22,r1)+C(length*.73,r1,length*.18,r0,-18,r0*.65)
 outline=top+C(length+40,-r1*.6,length+40,r1*.6,length+22,r1)+bottom.replace('M',' L',1)+C(-40,r0*.6,-40,-r0*.6,-18,-r0*.65)+' Z'
 out=shape(outline,BROWN)
 shading=M(-18,r0*.04)+C(length*.22,r0*.5,length*.65,r1*.32,length+22,r1*.4)+' L'+coords([p(length+22,r1)])+bottom.replace('M',' L',1)+' Z'
 out=over(out,crop_to(shape(shading,DARK),out),pathline(top,INK,2),pathline(bottom,INK,2))
 # No cross-line on either anatomical overlap cap.
 return out

def repair(layers):
 old={p.stem:Image.open(p).convert('RGBA') for p in layers.glob('*.png')}
 out={}
 # One rounded neck, no white collar, gold edging or peach jaw pixels.
 out['neck']=over(shape('M485 320 C510 306 552 312 571 335 C575 370 550 403 512 429 C491 442 470 452 452 442 C454 425 473 399 480 376 C484 357 482 338 485 320 Z',DARK),shape('M503 326 C519 321 540 326 550 337 C552 367 530 395 501 420 L470 440 C483 415 494 396 499 375 Z',BROWN))
 # Complete shorts: no old hand-colour rectangle survives. Rounded upper waist
 # is concealed by the separate vest; the entire side remains real fabric.
 shorts='M391 619 C427 604 494 599 529 621 C553 641 580 680 603 708 C628 738 648 766 655 785 C633 800 595 802 558 809 C524 815 503 824 486 829 C454 818 431 803 402 799 C383 796 370 795 358 790 C370 746 372 690 391 619 Z'
 out['pelvis']=over(shape(shorts,'#bf3029',INK,2),shape('M398 637 C434 665 485 684 523 651 C531 681 548 703 568 719 C546 738 513 759 486 795 C457 758 403 743 375 765 L386 684 Z','#a52623'),shape('M568 721 C595 731 617 747 636 770 L649 785 L594 792 C587 771 578 748 568 721 Z','#d2392e'),pathline('M390 632 C435 651 489 654 528 631','#e5b647',12),pathline('M390 632 C435 651 489 654 528 631',INK,1),pathline('M366 783 C405 780 453 804 485 817 C533 790 601 778 649 784',INK,18),pathline('M366 783 C405 780 453 804 485 817 C533 790 601 778 649 784','#e8b948',13),pathline('M568 716 C579 737 587 760 593 783','#edbf50',11),pathline('M423 670 C429 717 453 749 483 781',INK,1.6),pathline('M484 806 C493 771 514 745 540 730','#681d1b',2),pathline('M390 746 C413 743 435 751 454 763','#7c201f',2))
 # Preserve the original left gold button (never the hand from that master).
 buttonmask=shape('M376 689 C395 680 402 692 399 709 C395 729 380 747 374 733 C369 721 370 701 376 689 Z','white')
 out['pelvis']=over(out['pelvis'],crop_to(old['pelvis'],buttonmask))
 # Tail-root centerline follows the original body into the original lower tail.
 # Longitudinal side ink only. Root and distal overlap do not have cross-lines.
 tail='M621 744 C640 746 656 767 670 792 C704 847 733 905 770 950 C794 979 818 991 858 996 C871 1013 877 1032 870 1051 C830 1050 799 1038 770 1019 C727 989 701 943 674 889 C655 850 635 819 621 789 C613 770 611 755 621 744 Z'
 out['tail_1']=over(shape(tail,BROWN),shape('M620 765 C645 803 664 848 689 895 C726 967 767 1019 834 1037 L867 1044 L870 1051 C830 1050 799 1038 770 1019 C727 989 701 943 674 889 C655 850 635 819 621 789 Z',DARK),pathline('M621 789 C635 819 655 850 674 889 C701 943 727 989 770 1019 C799 1038 830 1050 862 1050',INK,2),pathline('M651 763 C665 785 704 847 733 905 C770 966 796 990 848 996',INK,2))
 # Forearms are continuous shapes, not overlapping round balls or cut tubes.
 out['arm_l_lower']=complete_forearm((285,560),(190,382),28,17)
 out['arm_r_lower']=complete_forearm((730,612),(609,682),30,18)
 # Complete rounded bubble sleeves keep the original details and trim. Replace
 # only the clipped shoulder/elbow boundaries with continuous source artwork.
 for name,outline in [
 ('arm_l_upper','M365 402 C389 391 411 405 421 430 C430 460 419 488 397 508 C363 537 328 566 298 583 C283 590 262 587 249 572 C236 556 253 539 276 521 C294 505 304 490 307 474 C297 451 299 428 321 422 C336 416 349 409 365 402 Z'),
 ('arm_r_upper','M564 392 C590 378 612 396 626 417 C644 443 659 460 683 466 C698 470 697 488 695 502 C709 525 742 569 759 589 C777 611 777 627 762 640 C748 650 732 645 714 629 C691 607 660 575 641 555 C622 550 601 555 581 548 C556 539 548 513 546 484 C543 456 539 408 564 392 Z')]:
  mask=shape(outline,'white')
  # Inpainting only the newly exposed boundary uses adjacent anatomical colour.
  base=crop_to(shape(outline,BROWN),mask)
  base=over(base,crop_to(old[name],mask))
  out[name]=base
 # Clean the troublesome right lower vest hem using a fully drawn curved tip,
 # preserving all source detail above it, with one continuous gold border.
 vestmask=shape('M392 381 C437 368 469 389 496 393 L552 372 C579 379 595 396 596 407 L572 440 L560 493 L551 536 L510 579 C519 595 536 608 549 622 C532 630 519 635 504 647 C487 662 470 676 455 683 C436 671 418 652 407 633 L383 662 L367 655 L383 608 L366 561 L354 522 L350 470 L375 411 Z','white')
 out['torso']=crop_to(old['torso'],vestmask)
 # Hands keep their approved fingers and palms, replacing only the old cuff
 # ends with rounded unoutlined fur at the actual wrist socket.
 for name in ['hand_l_hip','hand_r_pinch','hand_r_grip','hand_r_open']:
  im=old[name].copy()
  if name=='hand_l_hip':
   mask=shape('M140 240 L270 240 L270 333 C245 348 218 357 205 379 C197 393 180 395 170 386 C160 375 154 349 149 335 Z','white')
  else:
   mask=shape('M390 450 L675 450 L675 620 C660 640 636 657 623 676 C613 696 592 709 578 699 L390 760 Z','white')
  out[name]=crop_to(im,mask)
 # Rounded knee overlap is underpainted from the same complete calf, not a
 # rectangle. Original visible calf shading is retained below the knee.
 for side,kx,ky in [('l',333,1058),('r',580,1077)]:
  name=f'leg_{side}_lower';im=old[name].copy()
  if side=='l':outline='M311 1019 C330 1010 350 1018 366 1042 C388 1076 422 1115 424 1144 C423 1171 404 1235 391 1280 L378 1346 C363 1354 344 1353 330 1341 C328 1284 313 1213 306 1161 C298 1110 286 1050 311 1019 Z'
  else:outline='M556 1036 C576 1023 595 1030 611 1054 C636 1093 669 1132 676 1158 C683 1188 660 1245 655 1275 L656 1344 C643 1362 619 1365 603 1353 C600 1303 580 1243 566 1201 C556 1169 552 1115 547 1085 C544 1065 546 1049 556 1036 Z'
  mask=shape(outline,'white');base=shape(outline,BROWN)
  # Blend source colour into the new rounded cap over a curved anatomical
  # distance; no alpha rectangle or exposed transverse border.
  a=im.getchannel('A');fade=Image.new('L',SIZE);fp=fade.load()
  for y in range(ky-30,1536):
   value=round(255*max(0,min(1,(y-(ky-16))/55)))
   for x in range(kx-100,kx+125):fp[x,y]=value
  im.putalpha(ImageChops.multiply(a,fade));base=over(base,crop_to(im,mask));out[name]=base
 # Thigh texture's historical horizontal clothes-edge line is hidden anatomy,
 # not part of the thigh. It is replaced with the limb's own palette.
 for side in ['l','r']:
  name=f'leg_{side}_upper';im=old[name].copy();p=im.load()
  for y in range(740,850):
   for x in range(260,660):
    r,g,b,a=p[x,y]
    if a and y<835:
     # Smoothly shade the concealed root towards the visible source at y835.
     donor=im.getpixel((x,850))
     if donor[3]>128:p[x,y]=(*donor[:3],a)
  out[name]=im
 return {n:clean(im) for n,im in out.items()}

def main():
 layers=D/'qa/before-repair-1610/layers'
 if not layers.exists():raise RuntimeError('Immutable pre-repair source required')
 repaired=repair(layers);target=D/'source/repairs-1028';target.mkdir(parents=True,exist_ok=True)
 for n,im in repaired.items():im.save(target/(n+'.png'))
 (target/'manifest.json').write_text(json.dumps({'generator':'repair_sources.py: editable curves and original source texture','rejectedGeneratedDrafts':'ImageGen diffuse alpha/halo; not consumed','layers':{n:hashlib.sha256((target/(n+'.png')).read_bytes()).hexdigest() for n in repaired}},indent=2)+'\n')
 print(f'{len(repaired)} same-canvas repairs saved. Motion/registration untouched.')
if __name__=='__main__':main()
