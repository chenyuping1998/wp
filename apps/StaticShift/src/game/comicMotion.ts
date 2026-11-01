// Original motion for these drawings, in normalized texture coordinates.
// The geometry and runtime share this function. Heads translate at the neck;
// arms/feet stay planted. Never cut a drawing into sliding limb pieces.
export const smooth = (t:number) => {t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function nodAt(ms:number) {
 const p=((ms%2000)+2000)%2000;
 if(p<400) return smooth(p/400);
 if(p<1000) return 1;
 if(p<1800) return 1-1.32*smooth((p-1000)/800);
 return -.32*(1-smooth((p-1800)/200));
}
export function deform(u:number,v:number,ms:number,kind:'cast'|'portrait',reaction=0,variant=0) {
 const n=nodAt(ms), neck=kind==='cast'?.24:.68;
 const head=1-smooth((v-(kind==='cast'?.13:.42))/(neck-(kind==='cast'?.13:.42)));
 const dy=n*(kind==='cast'?.029:.007)*head;
 // Brow/cheek and hair lag: localized and small, no whole-card sway.
 const side=Math.sin(ms/2000*Math.PI*2-.45+variant*.1);
 const hair=(1-smooth(v/(kind==='cast'?.12:.25)))*Math.sin(u*Math.PI);
 // A tiny asymmetric cheek/eyebrow turn gives each face expression without
 // moving the entire paper card. Hands and planted feet remain outside this field.
 const face=kind==='portrait'?Math.exp(-(((v-.39)/.17)**2))*Math.exp(-(((u-.5)/.32)**2)):Math.exp(-(((v-.09)/.055)**2))*Math.exp(-(((u-.5)/.32)**2));
 const glance=Math.sin(ms/2000*Math.PI*2+variant*.65);
 return [u+side*.0025*hair+face*glance*(kind==='portrait'?.0035:.0015), v+dy+side*.002*hair+face*glance*.0015-reaction*.018*head] as const;
}
