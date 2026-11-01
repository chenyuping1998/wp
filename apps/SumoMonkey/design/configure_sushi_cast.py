"""Measured cuts for the two Sushi Monkey drawings on the 560x912 grid."""
import json
from pathlib import Path
APP=Path(__file__).resolve().parents[1]

def rect(x0,y0,x1,y1): return [(x0,y0),(x1,y0),(x1,y1),(x0,y1)]
cuts={
 'mg':[
 ('head_2_face',30,[(170,0),(440,0),(440,200),(350,211),(315,226),(267,210),(196,211),(160,180)],None),
 ('left_arm_0_upper_arm',22,[(120,220),(183,215),(199,276),(188,353),(163,398),(61,398),(67,326),(91,270)],None),
 ('left_arm_2_hand',20,rect(42,393,172,627),None),
 ('right_arm_0_upper_arm',26,[(380,232),(419,241),(458,300),(480,347),(484,402),(394,402),(387,340)],None),
 ('right_arm_2_hand',24,rect(397,398,522,625),None),
 ('left_leg_2_foot',12,rect(60,820,236,912),None),
 ('right_leg_2_foot',16,rect(330,820,524,912),None),
 ('left_leg_1_calf',11,rect(125,745,233,835),None),
 ('right_leg_1_calf',15,rect(324,747,438,836),None),
 ('left_leg_0_thigh',10,[(147,612),(294,612),(261,664),(245,751),(127,755)],None),
 ('right_leg_0_thigh',14,[(297,613),(418,613),(439,754),(326,754),(316,667)],None),
 ],
 'fg':[
 ('head_2_face',30,[(141,0),(438,0),(438,237),(356,226),(330,234),(289,230),(248,216),(165,221),(141,190)],None),
 ('left_arm_0_upper_arm',22,[(155,246),(208,233),(222,299),(215,352),(195,383),(129,371),(116,340)],None),
 ('left_arm_2_hand',20,[(112,354),(194,354),(190,399),(162,476),(163,507),(180,609),(76,623),(82,427)],None),
 ('right_arm_0_upper_arm',26,[(349,247),(382,254),(416,328),(416,357),(371,392),(351,348)],None),
 ('right_arm_2_hand',24,[(362,374),(411,353),(421,400),(464,496),(479,619),(393,626),(384,516),(360,438)],None),
 ('left_leg_2_foot',12,rect(69,820,228,912),None),
 ('right_leg_2_foot',16,rect(286,820,460,912),None),
 ('left_leg_1_calf',11,rect(128,743,230,834),None),
 ('right_leg_1_calf',15,rect(296,743,409,838),None),
 ('left_leg_0_thigh',10,[(174,578),(289,581),(266,643),(243,700),(224,751),(121,756)],None),
 ('right_leg_0_thigh',14,[(290,582),(399,581),(398,664),(400,752),(293,754),(280,659)],None),
 ]
}
p=APP/'design/cut_cast_layers.py'
s=p.read_text(); start=s.index('CUTS = {'); end=s.index('TRUNK = ',start)
s=s[:start]+'CUTS = '+repr(cuts)+'\n'+s[end:]
s=s.replace('MIRROR = True','MIRROR = False')
s=s.replace('INPAINT_UNDER = {"head_6_bubble": "head_2_face"}','INPAINT_UNDER = {}')
p.write_text(s)
for cast in ['mg','fg']:
    fg=cast=='fg'
    rig={
      '_note':'Measured on new Sushi Monkey grid; figure already faces board left.',
      'out':'sushiApprentice' if fg else 'sushiMaster',
      'root':[280,895], 'hip':[285,455], 'waist':[285,409], 'neck':[280,224 if fg else 207],
      'helmet':{'at':[285,80],'dir':[285,20]},
      'banana':{'at':[265,160],'dir':[265,205]},
      'pocket':{'at':[285,460],'dir':[285,410]},
      'cuffL':{'at':[160,310] if fg else [130,314],'dir':[153,363] if fg else [124,394]},
      'cuffR':{'at':[389,313] if fg else [434,327],'dir':[397,375] if fg else [443,403]},
      'handL':[130,556] if fg else [118,558],
      'handR':[438,555] if fg else [459,565],
      'prop':[135,574] if fg else [123,576],
      'pantL':{'at':[207,650],'dir':[190,748]},
      'pantR':{'at':[355,650],'dir':[354,750]},
    }
    (APP/f'design/cast_cut/{cast}_rig.json').write_text(json.dumps(rig,indent=2))
print('New cuts and rig points configured')
