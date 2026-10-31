import {motionTrack} from './treasureMotion.ts';
import {objectSecondary} from './treasureObjectGenerator.ts';

type Key=readonly [number,number];
type Track=readonly Key[];
type LetterPose={dx:number;dy:number;angle:number;sx:number;sy:number};
const sample=(time:number,keys:Track)=>motionTrack(Math.max(0,Math.min(970,time)),keys);

// The painted plaque is the fixed attachment. Each glyph gets its own phrasing,
// with offset contact / rotation / stretch keys instead of one shared bounce.
const LETTER_TRACKS:Record<string,Record<keyof LetterPose,Track>>={
 L1:{ // A loads its feet, hops, then takes a small second settling step.
  dx:[[0,0],[125,-.006],[345,.010],[580,-.004],[760,.002],[970,0]],
  dy:[[0,0],[110,.018],[315,-.067],[395,-.064],[570,.012],[710,-.018],[845,.003],[970,0]],
  angle:[[0,0],[140,-.035],[345,.035],[545,-.06],[710,.025],[850,-.006],[970,0]],
  sx:[[0,1],[110,1.075],[295,.965],[425,1.015],[565,1.055],[730,.985],[970,1]],
  sy:[[0,1],[110,.88],[290,1.09],[425,1.035],[565,.94],[730,1.025],[970,1]],
 },
 L2:{ // K cocks back, kicks into a proud lean, and lets its weight catch up.
  dx:[[0,0],[125,-.026],[300,.032],[415,.036],[585,-.012],[755,.004],[970,0]],
  dy:[[0,0],[135,.008],[325,-.036],[430,-.032],[585,.007],[755,-.006],[970,0]],
  angle:[[0,0],[145,-.10],[320,.18],[430,.165],[610,-.055],[785,.016],[970,0]],
  sx:[[0,1],[140,.965],[300,1.045],[440,1.025],[615,.985],[970,1]],
  sy:[[0,1],[125,.965],[335,1.055],[470,1.015],[620,.98],[970,1]],
 },
 L3:{ // Q makes a small off-centre orbit; its turn follows the rise.
  dx:[[0,0],[115,.012],[280,-.022],[410,-.027],[585,.024],[760,-.006],[970,0]],
  dy:[[0,0],[110,.008],[285,-.041],[425,-.034],[595,.009],[770,-.006],[970,0]],
  angle:[[0,0],[145,.055],[365,-.16],[475,-.145],[650,.075],[820,-.018],[970,0]],
  sx:[[0,1],[130,1.035],[300,.955],[465,1.045],[645,.985],[970,1]],
  sy:[[0,1],[130,.95],[300,1.055],[465,.97],[645,1.02],[970,1]],
 },
 L4:{ // J swings like a hooked pendant, then catches with a soft upward nod.
  dx:[[0,0],[140,.016],[350,-.041],[475,-.034],[650,.021],[805,-.005],[970,0]],
  dy:[[0,0],[140,.006],[325,-.053],[440,-.048],[620,.009],[785,-.011],[970,0]],
  angle:[[0,0],[125,.08],[340,-.175],[455,-.16],[640,.085],[800,-.022],[970,0]],
  sx:[[0,1],[130,1.03],[330,.965],[470,1.015],[640,1.025],[805,.995],[970,1]],
  sy:[[0,1],[130,.95],[330,1.095],[470,1.04],[640,.97],[805,1.02],[970,1]],
 },
};

const LETTER_TURNS:Record<string,{direction:number;keys:Track}>={
 L1:{direction:1,keys:[[0,0],[130,0],[260,.12],[460,.80],[610,1],[970,1]]},
 L2:{direction:-1,keys:[[0,0],[145,0],[300,.18],[490,.84],[650,1],[970,1]]},
 L3:{direction:1,keys:[[0,0],[115,0],[300,.22],[540,.88],[705,1],[970,1]]},
 L4:{direction:-1,keys:[[0,0],[150,0],[325,.15],[510,.88],[675,1],[970,1]]},
};

export function letterPose(name:string,time:number,mode:'none'|'win'|'land',reduced=false):LetterPose{
 const rest={dx:0,dy:0,angle:0,sx:1,sy:1};
 if(mode==='none')return rest;
 const t=mode==='land'?time*970/240:time;
 // A landing is a brief contact reaction; save the full performance for a win.
 const gain=(reduced?.18:1)*(mode==='land'?.42:1),tracks=LETTER_TRACKS[name]??LETTER_TRACKS.L4;
 const travel=mode==='win'?1.7:1,turn=mode==='win'?1.55:1,stretch=mode==='win'?1.45:1;
 const lift=mode==='win'?sample(t,[[0,0],[120,.025],[325,.12],[455,.10],[650,.025],[820,0],[970,0]]):0;
 const circle=LETTER_TURNS[name]??LETTER_TURNS.L4;
 const phase=sample(t,circle.keys);
 // Wrapping a completed turn to zero is visually identical and leaves the
 // glyph at its exact rest transform. Reduced motion keeps the small lean.
 const spin=mode==='win'&&!reduced&&phase<1?circle.direction*phase*Math.PI*2:0;
 let dx=0,dy=0,angle=0,sx=0,sy=0;
 // Generator accents follow the contact / weight of each glyph. These are
 // local attachment channels: neither plaque nor its painted frame moves.
 if(name==='L1'){
  const contact=objectSecondary('letterAContact',t),stretch=objectSecondary('letterAStretch',t);
  dy=.0045*contact;sx=.010*stretch;sy=-.017*stretch;
 }else if(name==='L2'){
  const lean=objectSecondary('letterKLean',t),weight=objectSecondary('letterKWeight',t);
  angle=.013*lean;dx=.0025*weight;dy=.0012*weight;
 }else if(name==='L3'){
  const turn=objectSecondary('letterQTurn',t),weight=objectSecondary('letterQWeight',t);
  angle=-.012*turn;dx=.0025*weight;dy=.002*weight;sy=.006*weight;
 }else{
  const hook=objectSecondary('letterJHook',t),contact=objectSecondary('letterJContact',t);
  angle=-.012*hook;dx=-.002*hook;dy=.0035*contact;sx=.006*contact;sy=-.008*contact;
 }
 return {
  dx:(sample(t,tracks.dx)+dx)*gain*travel,dy:(sample(t,tracks.dy)+dy)*gain*travel,
  angle:(sample(t,tracks.angle)+angle)*gain*turn+spin,
  sx:1+((sample(t,tracks.sx)-1+sx)*stretch+lift)*gain,
  sy:1+((sample(t,tracks.sy)-1+sy)*stretch+lift)*gain,
 };
}

const SCROLL_CLOSURE:Track=[[0,0],[55,-.03],[155,1],[245,.985],[420,-.055],[505,-.035],[585,0],[660,0],[755,.09],[855,-.015],[970,0]];
// End rolls trail the lateral reveal, then settle while the map stays readable.
const SCROLL_ROLL:Track=[[0,0],[90,-.18],[185,1],[245,.95],[440,-.55],[580,.16],[690,-.07],[850,.025],[970,0]];
export function scrollPose(time:number,active:boolean,reduced=false){
 const closure=active?sample(time,SCROLL_CLOSURE):0;
 const paper=active?objectSecondary('paperRecoil',time):0,roll=active?objectSecondary('rollRecoil',time):0;
 return {open:1+(-.73*closure+.0028*paper)*(reduced?.12:1),
  roll:((active?sample(time,SCROLL_ROLL):0)*.10-.009*roll)*(reduced?.15:1)};
}

const STRAW_TURN:Track=[[0,0],[105,-.17],[165,-.155],[305,.46],[365,.43],[535,-.255],[690,.12],[830,-.035],[970,0]];
const STRAW_TWIST:Track=[[0,0],[140,.12],[325,1],[415,.78],[560,.32],[710,.12],[850,.015],[970,0]];
export function strawPose(time:number,active:boolean,reduced=false){
 // The insertion point never translates. A delayed facing change makes the
 // paper bend read as a small stir, rather than a rigid metronome swing.
 const gain=reduced?.16:1;
 const bend=active?objectSecondary('strawBend',time):0,facing=active?objectSecondary('strawFacing',time):0;
 return {angle:((active?sample(time,STRAW_TURN):0)+.011*bend)*gain,
  sx:1-((active?sample(time,STRAW_TWIST):0)*.085+.004*facing)*gain};
}

export function keyShine(time:number,active:boolean,reduced=false){
 if(!active||reduced)return 0;
 // The first reflection catches, holds briefly, then sweeps off the brass.
 return Math.max(0,sample(time,[[0,0],[180,0],[290,.90],[330,.86],[435,0],[585,0],[690,.62],[735,.42],[820,0],[970,0]]));
}
