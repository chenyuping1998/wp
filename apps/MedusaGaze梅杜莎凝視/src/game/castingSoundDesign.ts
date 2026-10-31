/** Production and the art review share the same casting balance and pitch. */
import {orbPower} from './orbPower.ts';
export const castingMix={charge:.95,release:1.1,fly:1.4,voice:1.7,voiceRate:.92,hiss:.6,hissRate:.9,hit:1.15,collision:1.5,gaze:.8,gazeBeam:.8,transfer:1.3,count:.78} as const;
/** Parallel flights share one wind budget so three orbs do not mask the voice. */
export const orbFlightGain=(layers=1)=>castingMix.fly/Math.sqrt(Math.max(1,Math.min(3,layers)));
export const castingCueGain=(cue:string,collision=false)=>cue==='sfx_snakes_hiss'?castingMix.hiss:cue==='sfx_orb_charge'?castingMix.charge:cue==='sfx_orb_release'?castingMix.release:cue==='sfx_orb_fly'?castingMix.fly:cue==='vo_medusa_cast'?castingMix.voice:cue.startsWith('sfx_orb_hit_')?(collision?castingMix.collision:castingMix.hit):cue==='sfx_gaze_charge'?castingMix.gaze:cue==='sfx_gaze_beam'?castingMix.gazeBeam:cue==='sfx_total_to_win'?castingMix.transfer:1;
export type OrbSoundCue='charge'|'release'|'fly'|'hit'|'collision';
/** Morph weight and crystal body; keep 350ms charge and 600ms flight at rate 1. */
export function orbSoundVoices(cue:OrbSoundCue,value:number,layers=1){
 const p=orbPower(value),voice=(cue:string,gain:number)=>({cue,gain,rate:1});
 if(cue==='charge')return[voice('sfx_orb_charge',castingMix.charge*(.72+.42*p.energy)),...(p.divinity>0?[voice('sfx_medusa_jewel',.18*p.divinity)]:[])];
 if(cue==='release')return[voice('sfx_orb_release',castingMix.release*(.76+.48*p.energy)),...(p.divinity>0?[voice('sfx_gaze_beam',.16*p.divinity)]:[])];
 if(cue==='fly')return[voice('sfx_orb_fly',orbFlightGain(layers)*(.76+.4*p.energy))];
 const valueClamped=Math.max(2,Math.min(500,Number.isFinite(value)?value:2));
 const blend=valueClamped<=25?Math.log(valueClamped/2)/Math.log(12.5):Math.min(1,Math.log(valueClamped/25)/Math.log(6));
 const first=valueClamped<=25?'s':'m',second=valueClamped<=25?'m':'l';
 const gain=(cue==='collision'?castingMix.collision:castingMix.hit)*(.76+.5*p.energy);
 const voices=[voice('sfx_orb_hit_'+first,gain*Math.cos(blend*Math.PI/2)),voice('sfx_orb_hit_'+second,gain*Math.sin(blend*Math.PI/2))].filter(v=>v.gain>.001);
 if(p.divinity>0)voices.push(voice('sfx_medusa_jewel',.26*p.divinity));
 return voices;
}
