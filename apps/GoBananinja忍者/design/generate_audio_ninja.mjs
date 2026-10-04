// Go Bananinja sound set. Deterministic, dependency-free PCM synthesis.
// Run: node design/generate_audio_ninja.mjs
// These are original procedural cues, with a Japanese game-music palette:
// taiko, wooden clappers, koto/shamisen plucks, breath flute and blade noise.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../static/assets/audio/ninja');
fs.mkdirSync(OUT, { recursive: true });
const SR = 22050;
let seed = 20261003;
const rnd = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const buf = (seconds) => new Float32Array(Math.ceil(seconds * SR));
const put = (to, from, at = 0, gain = 1) => {
	const start = Math.round(at * SR);
	for (let i = 0; i < from.length && i + start < to.length; i++) if (i + start >= 0) to[i + start] += from[i] * gain;
};
const fade = (a, ms = 5) => {
	const n = Math.min(a.length >> 1, Math.round(ms * SR / 1000));
	for (let i = 0; i < n; i++) { a[i] *= i / n; a[a.length - 1 - i] *= i / n; }
	return a;
};
const write = (name, a, peak = .7, loop = false) => {
	if (!loop) fade(a);
	let max = 1e-9;
	for (const v of a) max = Math.max(max, Math.abs(v));
	const scale = peak / max;
	const wav = Buffer.alloc(44 + a.length * 2);
	wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
	wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
	wav.writeUInt32LE(SR, 24); wav.writeUInt32LE(SR * 2, 28); wav.writeUInt16LE(2, 32);
	wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(a.length * 2, 40);
	for (let i = 0; i < a.length; i++) wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, a[i] * scale)) * 32767), 44 + i * 2);
	fs.writeFileSync(path.join(OUT, name + '.wav'), wav);
};
const N = { D3:146.83,F3:174.61,G3:196,A3:220,C4:261.63,D4:293.66,F4:349.23,G4:392,A4:440,C5:523.25,D5:587.33,F5:698.46,G5:783.99,A5:880,C6:1046.5 };

function pluck(f, d = .6, bright = .6) {
	const a = buf(d), len = Math.max(8, Math.round(SR/f)), line = new Float32Array(len);
	let low = 0;
	for (let i=0;i<len;i++) { low += .36*(rnd()-low); line[i] = low * bright + rnd()*(1-bright)*.25; }
	for (let i=0;i<a.length;i++) {
		const j=i%len, next=(j+1)%len, v=line[j];
		line[j]=.9975*(v+line[next])*.5;
		const t=i/SR;
		a[i]=(v + .12*Math.sin(2*Math.PI*f*2*t))*Math.exp(-2.8*t/d);
	}
	return fade(a);
}
function flute(f, d=.75, breath=.12) {
	const a=buf(d); let lp=0, phase=0;
	for(let i=0;i<a.length;i++) {
		const t=i/SR, env=Math.min(1,t/.08)*Math.min(1,(d-t)/.16), vibr=1+.004*Math.sin(2*Math.PI*5*t);
		phase += 2*Math.PI*f*vibr/SR;
		lp += .08*(rnd()-lp);
		a[i]=env*(.65*Math.sin(phase)+.2*Math.sin(2*phase)+breath*lp);
	}
	return fade(a,15);
}
function drum(d=.55, low=95) {
	const a=buf(d); let p=0, filtered=0;
	for(let i=0;i<a.length;i++) {
		const t=i/SR, f=low*(1+.7*Math.exp(-28*t)); p+=2*Math.PI*f/SR;
		filtered += .22*(rnd()-filtered);
		a[i]=Math.sin(p)*Math.exp(-10*t)+filtered*.58*Math.exp(-35*t);
	}
	return fade(a);
}
function clack(d=.13) {
	const a=buf(d); let lp=0;
	for(let i=0;i<a.length;i++) { const t=i/SR; lp+=.25*(rnd()-lp); a[i]=(lp+.3*Math.sin(2*Math.PI*1100*t))*Math.exp(-45*t); }
	return fade(a);
}
function bell(f,d=1.4) {
	const a=buf(d);
	for(let i=0;i<a.length;i++) {
		const t=i/SR;
		a[i]=Math.sin(2*Math.PI*f*t)*Math.exp(-3.5*t)
			+.35*Math.sin(2*Math.PI*f*2.01*t)*Math.exp(-5*t)
			+.15*Math.sin(2*Math.PI*f*3.91*t)*Math.exp(-8*t);
	}
	return fade(a);
}
function air(d=.5, center=.2, width=.13, color=.16) {
	const a=buf(d); let lp=0;
	for(let i=0;i<a.length;i++) {
		const t=i/SR, envelope=Math.exp(-Math.pow((t-center)/width,2));
		lp+=(color+.2*envelope)*(rnd()-lp);
		a[i]=lp*envelope;
	}
	return fade(a);
}
function slash(d=.6, heavy=false) {
	const a=buf(d);
	put(a,air(d,.18,.095,.43),0,1.45);
	put(a,clack(.1),.19,heavy?.8:.4);
	put(a,bell(heavy?610:930,.35),.2,heavy?.24:.14);
	if(heavy) put(a,drum(.5,83),.2,.7);
	return a;
}
function phrase(notes, beat, tone=pluck, gap=.03) {
	const length=(notes.length+.8)*beat, a=buf(length);
	notes.forEach((f,i)=>{ if(f) put(a,tone(f,Math.min(.8,beat*1.35)),i*beat+gap,.65); });
	return a;
}
const cue = (name,d,parts,peak=.7) => { const a=buf(d); for(const [sound,at,gain] of parts) put(a,sound,at,gain); write(name,a,peak); };

// UI and five ascending reel/scatter pitches.
cue('btn',.13,[[clack(.11),0,.8],[bell(N.A5,.11),0,.18]],.36);
cue('spin',.42,[[clack(.12),0,.7],[drum(.35,145),.01,.43],[air(.3,.13,.09),.04,.4]],.65);
cue('reel_stop',.25,[[clack(.17),0,.8],[drum(.22,150),0,.4]],.55);
[N.G4,N.A4,N.C5,N.D5,N.F5].forEach((f,i)=>cue(`scatter_${i+1}`,.72,[[bell(f,.66),0,.75],[clack(.1),0,.25]],.63));
cue('pluck_low',.65,[[pluck(N.D4,.6),0,.8],[drum(.3,110),0,.35]],.58);
cue('mult_update',.7,[[pluck(N.A4,.55),0,.65],[pluck(N.D5,.5),.12,.65],[bell(N.F5,.4),.24,.3]],.6);
cue('win_gliss',1.22,[[phrase([N.D4,N.F4,N.G4,N.A4,N.C5,N.D5],.105),0,.8],[bell(N.D5,.6),.66,.2]],.68);
cue('win_gliss_big',2.1,[[phrase([N.D4,N.F4,N.G4,N.A4,N.C5,N.D5,N.F5,N.G5],.12),0,.8],[drum(.6,95),.1,.35],[bell(N.D5,1.1),.94,.42],[bell(N.A5,.8),1.08,.3]],.78);
cue('gong_feature',2.3,[[drum(.7,82),0,.7],[bell(N.D4,2),.1,.8],[flute(N.A4,1.3),.35,.47],[bell(N.D5,1),1.05,.48]],.82);
cue('fs_intro',2.15,[[drum(.5,100),0,.6],[clack(.11),.2,.5],[clack(.11),.4,.5],[phrase([N.D5,N.F5,N.A5,N.C6],.24),.55,.65],[bell(N.C6,.7),1.33,.4]],.77);
cue('bigwin_blast',2.2,[[drum(.9,66),0,.9],[slash(.7,true),.03,.4],[bell(N.D4,1.8),.1,.5],[phrase([N.D5,N.F5,N.A5,N.C6],.15),.48,.55]],.82);
cue('coin_shimmer',2.4,[[phrase([N.A5,N.C6,N.A5,N.G5,N.A5,N.C6,N.D5,N.F5],.22),0,.57],[bell(N.D5,.8),.1,.2]],.5);
cue('reel_tension',2,Array.from({length:16},(_,i)=>[i%4===0?drum(.18,120):clack(.1),i*.125,i%4===0?.4:.2]),.48);
cue('wild_expand',1.8,[[air(.9,.43,.26),0,.65],[drum(.45,90),.65,.7],[bell(N.A4,1),.7,.36],[flute(N.D5,.6),.83,.33]],.75);
cue('grenade_blast',.9,[[drum(.75,55),0,.9],[air(.72,.17,.14,.36),0,.75],[clack(.13),0,.6]],.82);
cue('slash_draw',.72,[[air(.64,.37,.19,.35),0,.85],[bell(N.A5,.45),.35,.2]],.6);
cue('slash_hit',.7,[[slash(.68,true),0,.8],[bell(N.D5,.45),.29,.18]],.8);
cue('slash_finale',1.25,[[slash(.9,true),0,.85],[drum(.7,70),.24,.65],[bell(N.D5,.9),.34,.42]],.83);
// Nonverbal ninja-monkey effort/celebration, deliberately short under SFX.
function voice(d,f0,f1) { const a=buf(d); let p=0, lp=0; for(let i=0;i<a.length;i++) { const t=i/SR, q=t/d, f=f0+(f1-f0)*q; p+=2*Math.PI*f/SR; lp+=.15*(rnd()-lp); const env=Math.sin(Math.PI*q)**.7; a[i]=env*(.48*Math.sin(p)+.23*Math.sin(2*p)+.13*Math.sin(3*p)+.09*lp); } return a; }
cue('voice_effort',.34,[[voice(.32,185,275),0,.8]],.47);
cue('voice_roar',.95,[[voice(.48,210,330),0,.7],[voice(.43,270,190),.42,.65]],.56);

// Pentatonic D-minor with taiko pulse and koto figures. Exact bar length;
// the last bar resolves early, leaving the loop transition clean.
function music(name,bpm,fast) {
	const beat=60/bpm, bars=8, duration=bars*4*beat, a=buf(duration);
	const motifs=fast
		? [[N.D5,N.F5,N.A5,N.G5,N.F5,N.D5,N.C5,N.A4],[N.D5,N.F5,N.G5,N.A5,N.C6,N.A5,N.G5,N.F5]]
		: [[N.D5,0,N.F5,N.G5,N.A5,0,N.G5,N.F5],[N.D5,N.F5,0,N.A5,N.G5,0,N.F5,N.D5]];
	for(let bar=0;bar<bars;bar++) {
		const t=bar*4*beat, root=bar%4===3?N.C4:N.D4;
		put(a,drum(.34,fast?92:105),t,fast?.37:.29);
		put(a,drum(.3,fast?99:110),t+2*beat,fast?.3:.23);
		for(let k=0;k<8;k++) {
			const f=motifs[Math.floor(bar/2)%2][k];
			if(f && !(bar===bars-1 && k>5)) put(a,pluck(f,.42,fast?.72:.6),t+k*.5*beat,fast?.32:.27);
			if(fast || k%2===0) put(a,clack(.07),t+k*.5*beat,.11);
		}
		put(a,pluck(root,.7,.5),t,.34);
		if(bar%2===0) put(a,flute(bar%4===0?N.A4:N.G4,1.2),t+1.05*beat,.18);
		if(fast && bar%4===3) for(let k=0;k<4;k++) put(a,clack(.09),t+(3+k*.25)*beat,.13+.04*k);
	}
	// Tiny equal-power boundary fades keep the repeating WAV click-free.
	const n=Math.round(.03*SR);
	for(let i=0;i<n;i++) {
		a[i] *= Math.sin((Math.PI/2)*(i/n));
		a[a.length-n+i] *= Math.cos((Math.PI/2)*(i/n));
	}
	write(name,a,fast?.57:.45,true);
}
music('bgm_main',108,false);
music('bgm_freespin',138,true);
console.log('Go Bananinja: 26 original audio files written to',OUT);
