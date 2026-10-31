import type { Graphics } from 'pixi.js';
import { winningAccentPose, stoneChipPose, landingAccentPose, impactWavePose } from './presentationMotion';

export function drawWinningAccent(g: Graphics, x: number, y: number, size: number, ageMs: number, seed = 0) {
	const p = winningAccentPose(ageMs);
	if (p.alpha < .001) return;
	const color = p.stone > .2 ? 0x9bffd5 : 0xffe4a0, r = size * (.42 - .035 * p.gather);
	// Open arcs leave the painted silhouette and the amount unobscured.
	for (const side of [-1, 1]) {
		const a = side < 0 ? Math.PI * .67 : -Math.PI * .33;
		g.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r).arc(x, y, r, a, a + Math.PI * .66).stroke({width: 1.5, color, alpha: p.alpha * .5});
	}
	for (let i = 0; i < 5; i++) {
		const a = i * Math.PI * 2 / 5 + seed * .37, d = size * (.62 - p.gather * .23);
		const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
		g.moveTo(px + Math.cos(a) * size * .045, py + Math.sin(a) * size * .045)
			.lineTo(px, py).stroke({width: 1.2, color, alpha: p.alpha * .72});
		g.circle(px, py, 1.1).fill({color: 0xfff6d9, alpha: p.alpha * .8});
	}
	if (p.contact > .001) g.ellipse(x, y + size * .31, size * (.22 + p.contact * .15), size * .025)
		.fill({color: 0xc4ffe0, alpha: p.contact * .28});
}

/** Normalized to the original icon size. All debris dies with its crumble. */
export function drawStoneDebris(g: Graphics, progress: number, seed = 0) {
	g.clear();
	const t = Math.max(0, Math.min(1, (progress-.08)/.92));
	if (t <= 0 || t >= 1) return;
	const dust = Math.sin(Math.PI * t) ** 1.5;
	for (let i = 0; i < 4; i++) {
		const a = i * 2.399963 + seed * .11, x = Math.cos(a) * t * .32, y = Math.sin(a) * t * .2 + .12 * t * t;
		const r = .045 + .15 * t;
		for (let layer = 3; layer >= 1; layer--) g.ellipse(x, y, r * layer / 2, r * layer / 3)
			.fill({color: 0xb6c2b6, alpha: dust * .035});
	}
	for (let i = 0; i < 6; i++) {
		const p = stoneChipPose(i, progress, seed), c = Math.cos(p.rotation), s = Math.sin(p.rotation);
		const points = [[-1,-.5],[.7,-.9],[1,.35],[-.35,1]].flatMap(([x,y]) => [p.x + (x*c-y*s)*p.size,p.y + (x*s+y*c)*p.size]);
		g.poly(points).fill({color: i % 2 ? 0xd5d4c5 : 0x8f9d94, alpha: p.alpha * .86});
	}
}

/** Compact impact at the planted foot, shared by all three board speeds. */
export function drawLandingAccent(g:Graphics,size:number,progress:number,strength=1){
	g.clear();const p=landingAccentPose(progress,strength);if(p.alpha<.001)return;
	const r=size*(.12+.24*p.spread)*p.weight;
	g.ellipse(0,0,r,size*.016).fill({color:0xffefd0,alpha:p.alpha*.5});
	g.ellipse(0,1,r*1.14,size*(.015+.025*p.spread)).stroke({width:1,color:0xb4eed1,alpha:p.alpha*.38});
	for(const side of [-1,1]){
		const x=side*r*.66,tip=side*r*1.24,y=-size*(.015+.07*p.spread);
		g.moveTo(x,-1).quadraticCurveTo(side*r,-size*.055,tip,y).stroke({width:1.2,color:0xffdc88,alpha:p.alpha*.75});
		g.circle(tip,y,1.15).fill({color:0xfff8dc,alpha:p.alpha*.8});
		const chipX=side*size*(.08+.18*p.spread),chipY=-size*.11*Math.sin(progress*Math.PI);
		g.poly([chipX-1,chipY,chipX,chipY-1.8,chipX+1.6,chipY+.4]).fill({color:0xc6d6c6,alpha:p.alpha*.7});
	}
}

/** A delayed, softer wave resolves the initial orb contact without extra hold. */
export function drawImpactWave(g:Graphics,x:number,y:number,ageSeconds:number,strength=1,color=0x9bffb8){
	const p=impactWavePose(ageSeconds);if(p.alpha<.001)return;
	const r=(32+58*p.spread)*strength;
	for(let layer=3;layer>=1;layer--)g.ellipse(x,y,r*(.75+layer*.12),r*.62)
		.fill({color,alpha:p.alpha*.024});
	g.ellipse(x,y,r,r*.62).stroke({width:1.5*(1-p.spread)+.5,color,alpha:p.alpha*.5});
	for(const side of [-1,1]){
		const a=side<0?Math.PI*.85:-Math.PI*.15;
		g.moveTo(x+Math.cos(a)*r*.8,y+Math.sin(a)*r*.8).arc(x,y,r*.8,a,a+.52)
			.stroke({width:1.2,color:0xfff2bd,alpha:p.alpha*.65});
	}
}
