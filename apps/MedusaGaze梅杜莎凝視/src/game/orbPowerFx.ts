import type {Graphics} from 'pixi.js';
import {orbPower} from './orbPower';
/** An open corona, always outside the painted centre and upright numeral. */
export function drawOrbMantle(g:Graphics,x:number,y:number,value:number,scale:number,phase:number,alpha:number,charging:boolean){
 const p=orbPower(value),r=48*scale*p.bodyScale,a=alpha*(.2+.6*p.energy);
 if(a<.001)return;
 const turn=phase*(charging?1.1:.5),mantleReveal=charging?Math.min(1,phase/.35):1;
 for(let band=0;band<2;band++){
  const start=turn*(band?-1:1)+band*Math.PI,rr=r+(5+band*5)*scale;
  g.moveTo(x+Math.cos(start)*rr,y+Math.sin(start)*rr).arc(x,y,rr,start,start+(.5+p.energy*.9)*mantleReveal)
   .stroke({width:(.8+p.energy)*scale,color:band?0xffefbd:p.color,alpha:a*.68});
 }
 // Gradually introduce crystal points, then long flame-shaped golden fingers.
 for(let i=0;i<p.petals;i++){
  const angle=i*Math.PI*2/p.petals+turn*.28,ca=Math.cos(angle),sa=Math.sin(angle);
  const pulse=.68+.32*Math.sin(phase*7-i*.71)**2;
  const inner=r+9*scale,outer=inner+(3+25*p.divinity)*scale*pulse*mantleReveal,w=(1.2+2.1*p.energy)*scale;
  const px=x+ca*inner,py=y+sa*inner;
  g.poly([px-sa*w,py+ca*w,x+ca*outer,y+sa*outer,px+sa*w,py-ca*w,x+ca*(inner-3*scale),y+sa*(inner-3*scale)])
   .fill({color:i%2?p.color:0xfff2c0,alpha:a*(.28+.35*p.divinity)});
 }
 if(p.divinity>.02){
  // Broken Greek key marks orbit beyond the light crown, never across the value.
  for(let i=0;i<8;i++){
   const angle=i*Math.PI/4-turn*.22,rr=r+(18+12*p.divinity)*scale,ca=Math.cos(angle),sa=Math.sin(angle);
   const at=(rad:number,tan:number)=>[x+ca*rad-sa*tan,y+sa*rad+ca*tan] as const;
   const A=at(rr,-4*scale),B=at(rr,4*scale),C=at(rr+4*scale,4*scale),D=at(rr+4*scale,0);
   g.moveTo(...A).lineTo(...B).lineTo(...C).lineTo(...D).stroke({width:scale,color:0xffe6a2,alpha:a*p.divinity*.65*mantleReveal});
  }
 }
}
/** Power radiates locally; the board, camera and readable score stay planted. */
export function drawOrbPowerImpact(g:Graphics,x:number,y:number,value:number,age:number,frame:'score'|'plate'|'orb'){
 const p=orbPower(value),life=.54;
 if(age<0||age>=life)return;
 const strength=p.impact,alpha=(1-age/life)**1.5;
 // Stronger orbs release two delayed pressure fronts within the existing beat.
 for(let wave=0;wave<3;wave++){
  if(wave&&p.energy<(wave===1?.25:.67))continue;
  const t=(age-wave*.055)/(.32+wave*.025);if(t<0||t>1)continue;
  const spread=1-(1-t)**3,r=(32+78*spread)*strength;
  if(frame==='score'){
   const grow=(8+44*spread)*strength;
   g.roundRect(x-208-grow,y-119-grow,416+grow*2,238+grow*2,24+grow*.3)
    .stroke({width:(1.6-wave*.35)*(1-t)+.3,color:wave?0xffefb6:p.color,alpha:(1-t)**2*(.35+.25*p.energy)});
  }else g.ellipse(x,y,r,r*(.6+wave*.1)).stroke({width:1.7*(1-t)+.3,color:wave?0xffefb6:p.color,alpha:(1-t)**2*(.32+.3*p.energy)});
 }
 if(p.divinity>.01){
  const spread=1-(1-Math.min(1,age/.42))**3;
  for(let side=-1;side<=1;side+=2)for(let i=0;i<5;i++){
   const angle=side<0?Math.PI+(i-2)*.24:(i-2)*.24;
   const start=(frame==='score'?226:48)*strength,reach=(14+55*spread)*p.divinity;
   const ax=x+Math.cos(angle)*start,ay=y+Math.sin(angle)*(frame==='score'?100:48)*strength;
   g.moveTo(ax,ay).quadraticCurveTo(ax+side*reach*.7,ay+(i-2)*reach*.12,ax+side*reach,ay+(i-2)*reach*.35)
    .stroke({width:(1.2+p.divinity)*alpha,color:i%2?p.color:0xfff5d7,alpha:alpha*p.divinity*.65});
  }
 }
}
