import fs from 'node:fs';
import path from 'node:path';

const SR = 44100;
const outDir = process.argv[2];
if (!outDir) throw new Error('output directory required');
fs.mkdirSync(outDir, { recursive: true });

let seed = 0x46524f53;
const rnd = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 0xffffffff) * 2 - 1;
const env = (t, d, a = .01, r = .2) => Math.min(1, t / a) * Math.min(1, (d - t) / r);
const soft = x => Math.tanh(x * 1.4) * .78;
const reson = (t, f, decay, phase = 0) => Math.sin(2 * Math.PI * f * t + phase) * Math.exp(-t / decay);
function wav(name, dur, fn, stereo = false) {
  const n = Math.round(dur * SR), ch = stereo ? 2 : 1, data = Buffer.alloc(n * ch * 2);
  let peak = 1e-9, samples = Array.from({ length: n }, (_, i) => {
    const v = fn(i / SR, i, dur); const a = Array.isArray(v) ? v : [v, v];
    peak = Math.max(peak, Math.abs(a[0]), Math.abs(a[1])); return a;
  });
  const gain = .86 / peak;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) data.writeInt16LE(Math.round(32767 * soft(samples[i][c] * gain)), (i * ch + c) * 2);
  const h = Buffer.alloc(44); h.write('RIFF'); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(ch, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * ch * 2, 28); h.writeUInt16LE(ch * 2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(path.join(outDir, name + '.wav'), Buffer.concat([h, data]));
}
const ice = (t, base, decay=.3) => [1,1.41,1.87,2.36,3.14].reduce((s,m,k)=>s+reson(t,base*m,decay/(1+k*.11),k*.7)/(1+k*.5),0);
const crack = (t, d, depth=1) => {
  const hits = [0,.055,.13,.27,.46].filter(x=>x<d);
  return hits.reduce((s,h,k)=>t>=h?s+(rnd()*.7+ice(t-h,180+97*k,.09+.04*k))*Math.exp(-(t-h)/(.025+.02*k)):s,0)*depth;
};

wav('frost_creep', .26, (t,i,d) => env(t,d,.004,.04) * (ice(t,2100+t*5000,.08)*.55 + rnd()*.12));
wav('ice_freeze', 1.35, (t,i,d) => env(t,d,.02,.3) * (rnd()*.08 + ice(t,3600-t*1700,.32)*.48 + reson(t,83,.7)*.16));
wav('ice_crack', .95, (t,i,d) => env(t,d,.001,.18) * (crack(t,d,1) + reson(t,74,.42)*.35));

for (let k=0;k<5;k++) wav(`reel_stop_${k+1}`, .18, (t,i,d)=>env(t,d,.001,.08)*(reson(t,105+k*12,.055)*1.3+ice(t,1700+k*120,.035)*.28+rnd()*.05));
wav('reel_stop', .18, (t,i,d)=>env(t,d,.001,.08)*(reson(t,128,.055)*1.3+ice(t,1940,.035)*.28+rnd()*.05));
wav('spin', 2.6, (t,i,d)=>env(t,d,.2,.35)*(rnd()*.1+reson(t,48+8*Math.sin(t*1.7),.9)*.13), true);
wav('btn', .14, (t,i,d)=>env(t,d,.001,.06)*(reson(t,260,.045)+ice(t,2100,.03)*.18));
wav('pluck_low', .25, (t)=>ice(t,1450,.11)*.7+reson(t,190,.12)*.25);

const notes=[523.25,587.33,659.25,783.99,987.77];
notes.forEach((f,k)=>wav(`scatter_${k+1}`, .62, t=>ice(t,f,.38)*.72));
wav('win_gliss', .9, (t)=>ice(t,620*Math.pow(2,t/.9),.22)*.6);
wav('win_gliss_big', 1.45, (t)=>ice(t,420*Math.pow(3,t/1.45),.38)*.7+reson(t,70,.9)*.16);
wav('gong_feature', 2.2, (t,i,d)=>crack(t,d,.7)+ice(t,118,.95)*.8+reson(t,43,1.5)*.45);
wav('fs_intro', 2.8, (t,i,d)=>env(t,d,.04,.55)*(rnd()*.08+ice(Math.max(0,t-.55),392,.85)*(t>.55?.65:0)+reson(t,55,1.4)*.22),true);
wav('bigwin_blast', 1.8, (t,i,d)=>env(t,d,.001,.4)*(crack(t,d,.9)+ice(t,1350,.48)*.5+reson(t,52,.75)*.45),true);
wav('coin_shimmer', .82, (t)=>ice(t,2200+t*900,.25)*.5);
wav('mult_update', .75, (t,i,d)=>env(t,d,.008,.15)*(reson(t,72+t*55,.4)*.7+ice(t,860+t*500,.16)*.25));
wav('reel_tension', 3.2, (t,i,d)=>env(t,d,.1,.2)*(rnd()*(.025+.11*t/d)+reson(t,45+35*t/d,.65)*.2),true);

function music(name,dur,free=false){
  const scale=free?[146.83,174.61,220,261.63]:[110,130.81,164.81,196];
  wav(name,dur,(t,i,d)=>{
    const beat=free?2.5:2, step=Math.floor(t*beat)%scale.length, local=(t*beat)%1, f=scale[step];
    const pad=(reson(t,f/2,9)+reson(t,f*.749,7)*.45)*.18;
    const bell=ice(local/beat,f*4,.18)*Math.exp(-local*5)*.26;
    const wind=rnd()*.025*(.5+.5*Math.sin(t*.31));
    const pulse=reson(local/beat,55,.11)*Math.exp(-local*8)*.22;
    return env(t,d,.6,1.2)*(pad+bell+pulse+wind);
  },true);
}
music('bgm_main',16,false); music('bgm_freespin',16,true);
console.log(`generated ${fs.readdirSync(outDir).filter(x=>x.endsWith('.wav')).length} wav files`);
