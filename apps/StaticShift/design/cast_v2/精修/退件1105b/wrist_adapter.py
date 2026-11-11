"""Retract only concealed left-hand roots; keep native palm/finger geometry.
The visible wrist contour reuses the generated forearm's actual side ink.
"""
import numpy as np
from scipy import ndimage as ndi

def adapt_left(L,J,ch,yy,xx):
 E=np.array(J['elbow_l'],float);W=np.array(J['wrist_l'],float);v=(W-E)/np.linalg.norm(W-E);q=(xx-W[0])*v[0]+(yy-W[1])*v[1];c=-(xx-W[0])*v[1]+(yy-W[1])*v[0];fore=L['arm_l_lower'];fm=fore[:,:,3]>160;inner=ndi.binary_erosion(fm,iterations=1);sample=(q>-55)&(q<-20)&(abs(c)<8)&(fore[:,:,3]>220);rgb=np.median(fore[sample,:3],axis=0);lum=fore[:,:,:3]@[.299,.587,.114];stroke=(q>-55)&(q<-15)&(fore[:,:,3]>220)&(lum<45);black=np.median(fore[stroke,:3],axis=0)
 for name in ['hand_l_hip','hand_l_open','hand_l_point']:
  a=L[name].copy();root=(q<0)&(np.hypot(xx-W[0],yy-W[1])<100);a[root&~inner]=0;a[root&(a[:,:,3]>0),:3]=rgb
  # Only the actual exposed wrist/palm side, not the concealed overlap cap.
  distance=ndi.distance_transform_edt(a[:,:,3]>128);band=(a[:,:,3]>0)&(distance<3.7)&(q>=0)&(q<32)&(abs(c)<48);a[band,:3]=black
  # The old hip-hand split had also lost a short knuckle-side contour that
  # was hidden against the pants. Repair only missing visible hand ink.
  ink=(a[:,:,3]>150)&((a[:,:,:3]@[.299,.587,.114])<70);body=a[:,:,3]>128;edge=body&~ndi.binary_erosion(body,iterations=1);missing=edge&(ndi.distance_transform_edt(~ink)>2)&(q>=0);near=ndi.binary_dilation(missing,iterations=3);a[(a[:,:,3]>0)&(distance<2.8)&near&(q>=0),:3]=black
  # Fill only tiny concave wrist notches in the actual assembled contour.
  # The original palm/finger alpha is preserved; no mesh or limb shortening.
  union=(a[:,:,3]>128)|(fore[:,:,3]>128)
  from scipy import ndimage
  import cv2
  closed=cv2.morphologyEx(union.astype('uint8'),cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(11,11)))>0
  zone=np.hypot(xx-W[0],yy-W[1])<43
  added=closed&~union&zone;a[added,3]=255;a[added,:3]=rgb
  contour=ndi.distance_transform_edt(closed)<3.7;visible=contour&zone&(a[:,:,3]>0);a[visible,:3]=black
  opened=cv2.morphologyEx((a[:,:,3]>128).astype('uint8'),cv2.MORPH_OPEN,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(7,7)))>0;a[(q<0)&~opened]=0
  a[a[:,:,3]==0,:3]=0;L[name]=a
 return L
