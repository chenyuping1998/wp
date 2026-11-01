<script lang="ts">
 import { Graphics } from 'pixi-svelte';
 import type { Graphics as PixiGraphics } from 'pixi.js';
 import { onMount } from 'svelte';
 import { getContext } from '../game/context';
 const context = getContext();
 let t = $state(0);
 const feature = $derived(context.stateGame.gameType === 'freegame');
 onMount(() => {
  let raf = 0;
  let last = performance.now();
  const tick = (now: number) => { t += Math.min(now - last, 80) / 1000; last = now; raf = requestAnimationFrame(tick); };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
 });
 const draw = (g: PixiGraphics) => {
  g.clear();
  const { width: w, height: h } = context.stateLayoutDerived.canvasSizes();
  const unit = Math.min(w / 1440, h / 900);
  const ink = 0x282828, paper = 0xefeadc, red = 0xc47d60, rope = 0x282828;
  // Lanterns swing around their actual ceiling attachment. The cord, body,
  // ribs and tassels share the same pivot; nothing slides across the backdrop.
  for (const [index, xf] of [0.075, 0.925].entries()) {
   const a = Math.sin(t * .85 + index * 1.7) * .065;
   const x = xf * w, y = h * .025, cord = 76 * unit;
   const cx = x + Math.sin(a) * cord, cy = y + Math.cos(a) * cord;
   const rw = 31 * unit, rh = 42 * unit;
   g.moveTo(x,y).lineTo(cx,cy).stroke({ color: ink, width: 3 * unit });
   g.ellipse(cx,cy+rh,rw,rh).fill(feature ? paper : red).stroke({color:ink,width:3*unit});
   for (let i = 1; i < 6; i++) {
    const yy=cy+i*rh/3;
    const spread=rw*Math.sqrt(Math.max(0,1-((yy-cy-rh)/rh)**2));
    g.moveTo(cx-spread,yy).lineTo(cx+spread,yy).stroke({color:ink,width:1.2*unit,alpha:.55});
   }
   g.rect(cx-rw*.6,cy-3*unit,rw*1.2,7*unit).fill(ink);
   g.rect(cx-rw*.55,cy+rh*2-3*unit,rw*1.1,7*unit).fill(ink);
   g.moveTo(cx,cy+rh*2+4*unit).lineTo(cx+Math.sin(t*1.3+index)*5*unit,cy+rh*2+25*unit).stroke({color:rope,width:4*unit});
  }
  // Paper shide flutter on the side ropes, with changing fold angles.
  for (let side = 0; side < 2; side++) {
   const sx = w * (side ? .985 : .015), ex = w * (side ? .78 : .22);
   g.moveTo(sx,h*.035).quadraticCurveTo((sx+ex)/2,h*.105,ex,h*.045).stroke({color:rope,width:5*unit});
   for (let i=0;i<5;i++) {
    const q=(i+.5)/5,x=sx+(ex-sx)*q,y=h*(.035+.08*q*(1-q));
    const wave=Math.sin(t*1.6+i*.9+side)*7*unit;
    const s=13*unit;
    g.poly([x,y,x+s,y+7*unit,x+wave,y+20*unit,x+s+wave,y+27*unit,x+wave*.5,y+43*unit,x-6*unit,y+31*unit,x+4*unit,y+22*unit,x-7*unit,y+14*unit]).fill(paper).stroke({color:ink,width:1*unit});
   }
  }
  if (feature) {
   // Paper nobori flutter at the arena edges, and a few salt grains rise
   // in short repeating arcs. The centre of the reels stays unobstructed.
   for (let side=0;side<2;side++) {
    const x=w*(side?.965:.035),y=h*.43,dir=side?-1:1,flutter=Math.sin(t*2.2+side)*9*unit;
    g.moveTo(x,y-70*unit).lineTo(x,h*.86).stroke({color:rope,width:4*unit});
    g.poly([x,y-70*unit,x+dir*45*unit,y-66*unit,x+dir*(45*unit+flutter),y+45*unit,x,y+53*unit]).fill(side?paper:red).stroke({color:rope,width:2*unit});
    g.circle(x+dir*22*unit,y-15*unit,10*unit).stroke({color:paper,width:3*unit});
   }
   for (let i=0;i<12;i++) {
    const p=(t*.14+i*.137)%1,side=i%2;
    const x=w*(side?.86:.14)+(side?-1:1)*Math.sin(p*Math.PI)*42*unit+Math.sin(i*8.1)*30*unit;
    const y=h*(.83-p*.45),size=(2+i%3)*unit;
    g.poly([x,y-size,x+size,y,x,y+size,x-size,y]).fill({color:paper,alpha:Math.sin(p*Math.PI)*.45});
   }
  }
 };
</script>

<Graphics zIndex={-0.5} draw={draw} eventMode="none" />
