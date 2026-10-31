import { castingMix } from './castingSoundDesign.ts';

export type CharacterVoice = { cue:string; gain:number; rate:number };
const voice=(cue:string,gain:number,rate=1):CharacterVoice=>({cue,gain,rate});
/** Authored Spine events own body sounds; orb/effect sounds keep their own clock. */
export const characterSoundDesign = {
 motion_gather:{voices:[voice('sfx_medusa_gather',.58)],cooldownMs:0},
 motion_wrist:{voices:[voice('sfx_medusa_wrist',.46)],cooldownMs:0},
 motion_jewel:{voices:[voice('sfx_medusa_jewel',.40)],cooldownMs:160},
 motion_tail:{voices:[voice('sfx_medusa_tail',.40)],cooldownMs:0},
 motion_bite:{voices:[voice('sfx_snake_snap',.30)],cooldownMs:100},
 motion_bite_soft:{voices:[voice('sfx_snake_snap',.19,1.08)],cooldownMs:100},
 motion_smug:{voices:[voice('vo_medusa_hmm',.58,1.04)],cooldownMs:3500},
 motion_annoyed:{voices:[voice('vo_medusa_annoyed',.65)],cooldownMs:1000},
 motion_gasp:{voices:[voice('vo_medusa_gasp',.65)],cooldownMs:1000},
 motion_laugh:{voices:[voice('vo_medusa_laugh',.70),voice('sfx_snakes_laugh',.35)],cooldownMs:1500},
 motion_cast:{voices:[voice('vo_medusa_cast',castingMix.voice,castingMix.voiceRate),voice('sfx_snakes_hiss',castingMix.hiss,castingMix.hissRate)],cooldownMs:0},
 motion_glasses_slide:{voices:[voice('sfx_glasses_slide',.9)],cooldownMs:100},
 motion_glasses_on:{voices:[voice('sfx_glasses_on',.8)],cooldownMs:100},
} as const;
export type CharacterSoundMark=keyof typeof characterSoundDesign;
export const isCharacterSoundMark=(name:string):name is CharacterSoundMark=>Object.hasOwn(characterSoundDesign,name);
export const resolveCharacterSound=(mark:CharacterSoundMark,variant=0):CharacterVoice[]=>characterSoundDesign[mark].voices.map(v=>({...v,cue:mark==='motion_laugh'&&v.cue==='vo_medusa_laugh'&&variant%2?'vo_medusa_laugh_2':v.cue}));
