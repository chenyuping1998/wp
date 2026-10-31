const clamp=(t:number)=>Math.max(0,Math.min(1,t));
export function partPerformance(kind:'purrfia'|'parrot',name:string,part:string,t:number){
 t=clamp(t);const hit=Math.sin(Math.PI*t),swing=Math.sin(Math.PI*t*3)*hit,lag=Math.sin(Math.PI*t*3-.65)*hit;
 const p={x:0,y:0,rotation:0,sx:1,sy:1,bend:0,ripple:0,glow:hit*hit};
 if(kind==='purrfia'){
  if(part==='h1_fish'){p.x=.055*swing;p.y=-.065*hit;p.rotation=.23*swing;p.bend=.045*lag;}
  else if(part==='h1_water'){p.ripple=.045*hit;p.sy=1+.08*swing;}
  else if(part==='h2_lid'){p.y=-.085*hit;p.x=-.035*hit;p.rotation=-.42*hit;}
  else if(part==='h2_tail'){p.rotation=.30*lag;p.bend=.065*swing;}
  else if(part==='h3_ball'){p.rotation=.32*swing;p.x=.035*swing;}
  else if(part==='h3_thread'){p.rotation=.16*lag;p.bend=.08*swing;}
  else if(part==='h4_leaves'){p.bend=.11*swing;p.rotation=.10*lag;}
  else if(part==='s_gem'){p.rotation=.25*swing;p.y=-.04*hit;p.sx=p.sy=1+.18*hit;}
  else{p.y=-.025*hit;p.sx=1+.045*hit;p.sy=1-.035*hit;}
 }else{
  if(part==='h1_disc'||part==='h1_label'){p.rotation=Math.PI*2*(t*t*(3-2*t));p.y=-.025*hit;}
  else if(part==='h2_hat'){p.rotation=.10*swing;p.y=-.04*hit;}
  else if(part==='h2_cord'){p.bend=.09*lag;p.rotation=.12*lag;}
  else if(part==='h3_scope'){p.x=.055*hit;p.rotation=-.055*swing;}
  else if(part==='h3_eye'){p.x=.055*hit;p.sy=1-.60*Math.pow(hit,12);}
  else if(part==='h4_straw'){p.bend=.065*swing;}
  else if(part==='h4_umbrella'){p.rotation=.18*lag;p.sx=1+.13*hit;p.bend=.05*lag;}
  else if(part==='s_feather'){p.rotation=.26*lag;p.bend=.10*swing;}
  else if(part==='s_charm'){p.rotation=.24*lag;p.y=.035*hit;}
  else{p.y=-.03*hit;p.rotation=.055*swing;}
 }
 if(name.startsWith('L')){p.sx=1+.11*hit;p.sy=1+.07*hit;p.rotation=.10*swing;p.bend=.025*lag;}
 return p;
}
export function partVertex(u:number,v:number,w:number,h:number,bend:number,ripple:number,t:number){
 const root=1-v,edge=Math.sin(Math.PI*u);
 return {x:(u-.5)*w+bend*w*root*root,y:(v-.5)*h+ripple*h*edge*Math.sin(u*Math.PI*3-t*Math.PI*6)};
}
