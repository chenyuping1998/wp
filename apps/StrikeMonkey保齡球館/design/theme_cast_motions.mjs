import { LAUGH } from './laugh_motion_v9.mjs';
// Bowling acting: planted feet and torso lead, arms follow within the painted
// shoulder overlap. Every clip returns to setup for the next cross-fade.
const rot = (keys) => keys.map(([time, value]) => ({ time, value }));
const xy = (keys) => keys.map(([time, x, y]) => ({ time, x, y }));
const put = (clip, bone, timelines) => Object.assign(clip.bones[bone] ??= {}, timelines);
const beats = Array.from({ length: LAUGH.beats }, (_, i) => (LAUGH.startMs + i * LAUGH.gapMs) / 1000);
const settle = LAUGH.endMs / 1000;

export const applyThemeCast = (anims, cast) => {
  if (cast === 'mg') {
    // Sights the lane, rolls his shoulders and shifts onto the lead foot.
    put(anims.idle, 'hip', { translate: xy([[0,0,0],[0.6,-6,-2],[1.2,-9,2],[1.8,-4,0],[2.4,0,0],[3,5,-2],[3.6,8,2],[4.2,4,0],[4.8,0,0]]) });
    put(anims.idle, 'torso', { rotate: rot([[0,0],[1.2,-3.5],[2.4,0],[3.6,3.5],[4.8,0]]) });
    put(anims.idle, 'armR', { rotate: rot([[0,0],[0.6,-6],[1.2,-12],[1.8,-4],[2.4,0],[3,-6],[3.6,-12],[4.2,-4],[4.8,0]]) });
    put(anims.idle, 'armR_fore', { rotate: rot([[0,0],[0.7,4],[1.3,7],[1.9,3],[2.4,0],[3.1,4],[3.7,7],[4.3,3],[4.8,0]]) });
    // Small win: spot a pin, quick satisfied fist curl.
    put(anims.nod, 'hip', { translate: xy([[0,0,0],[0.14,-5,-5],[0.34,2,8],[0.55,0,-3],[0.8,0,0]]) });
    put(anims.nod, 'armR', { rotate: rot([[0,0],[0.14,-8],[0.34,14],[0.55,6],[0.8,0]]) });
    put(anims.nod, 'armR_fore', { rotate: rot([[0,0],[0.21,4],[0.42,-8],[0.62,-3],[0.8,0]]) });
    // Strike: anticipation, crossing step, release, held follow-through.
    put(anims.cheer, 'root', { translate: xy([[0,0,0],[0.15,-20,0],[0.35,-48,6],[0.56,-22,22],[0.78,58,1],[1.07,62,0],[1.38,24,0],[1.7,0,0]]) });
    put(anims.cheer, 'hip', { translate: xy([[0,0,0],[0.15,-10,-12],[0.35,-15,6],[0.56,4,24],[0.78,15,-7],[1.07,13,-4],[1.38,2,2],[1.7,0,0]]) });
    put(anims.cheer, 'torso', { rotate: rot([[0,0],[0.15,-5],[0.35,-7],[0.56,5],[0.78,8],[1.07,5],[1.38,1],[1.7,0]]) });
    put(anims.cheer, 'armR', { rotate: rot([[0,0],[0.15,-20],[0.35,-25],[0.56,32],[0.78,48],[1.07,43],[1.38,13],[1.7,0]]) });
    put(anims.cheer, 'armR_fore', { rotate: rot([[0,0],[0.23,9],[0.43,15],[0.64,-13],[0.86,-17],[1.15,-12],[1.46,-3],[1.7,0]]) });
    put(anims.cheer, 'armL', { rotate: rot([[0,0],[0.35,9],[0.56,-10],[0.78,-16],[1.1,-10],[1.7,0]]) });
    put(anims.cheer, 'head', { rotate: rot([[0,0],[0.35,-5],[0.78,7],[1.15,5],[1.7,0]]) });
    // Top tiers: alternating victory pumps across all ten voiced impact beats.
    put(anims.chestbeat, 'hip', { translate: xy([[0,0,0],[0.3,0,-9],...beats.flatMap((t,i)=>[[t,i%2?-8:8,7],[t+0.15,i%2?-5:5,-5]]),[settle,0,0]]) });
    put(anims.chestbeat, 'torso', { rotate: rot([[0,0],...beats.flatMap((t,i)=>[[t,i%2?1.5:-1.5],[t+0.15,i%2?0.7:-0.7]]),[settle,0]]) });
    put(anims.chestbeat, 'armR', { rotate: rot([[0,0],...beats.flatMap((t,i)=>[[t,i%2?7:31],[t+0.15,i%2?3:12]]),[settle,0]]) });
    put(anims.chestbeat, 'armL', { rotate: rot([[0,0],...beats.flatMap((t,i)=>[[t,i%2?-27:-7],[t+0.15,i%2?-11:-3]]),[settle,0]]) });
  } else {
    // Lane attendant presents the pin deck and checks the score overhead.
    put(anims.idle, 'hip', { translate: xy([[0,0,0],[1.5,-8,2],[3,0,0],[4.5,8,2],[6,0,0]]) });
    put(anims.idle, 'torso', { rotate: rot([[0,0],[1.5,-3],[3,0],[4.5,3],[6,0]]) });
    put(anims.idle, 'armL', { rotate: rot([[0,0],[0.7,-6],[1.5,-14],[2.3,-6],[3,0],[3.7,-6],[4.5,-14],[5.3,-6],[6,0]]) });
    put(anims.nod, 'armL', { rotate: rot([[0,0],[0.14,-7],[0.36,-16],[0.62,-5],[0.9,0]]) });
    // Score call: two planted steps and open-palmed presentation.
    put(anims.cheer, 'root', { translate: xy([[0,0,0],[0.16,-24,0],[0.38,-52,9],[0.62,-18,19],[0.88,55,2],[1.14,58,0],[1.4,20,0],[1.6,0,0]]) });
    put(anims.cheer, 'hip', { translate: xy([[0,0,0],[0.16,-11,-10],[0.38,-16,17],[0.62,8,-8],[0.88,15,18],[1.14,8,-5],[1.6,0,0]]) });
    put(anims.cheer, 'torso', { rotate: rot([[0,0],[0.16,-4],[0.38,-6],[0.62,4],[0.88,7],[1.14,4],[1.6,0]]) });
    put(anims.cheer, 'armL', { rotate: rot([[0,0],[0.2,-9],[0.42,-20],[0.68,-13],[0.92,-23],[1.2,-10],[1.6,0]]) });
    put(anims.cheer, 'armL_fore', { rotate: rot([[0,0],[0.28,5],[0.52,12],[0.76,6],[1.01,14],[1.27,5],[1.6,0]]) });
    put(anims.cheer, 'armR', { rotate: rot([[0,0],[0.2,7],[0.42,13],[0.68,9],[0.92,18],[1.2,8],[1.6,0]]) });
    put(anims.cheer, 'head', { rotate: rot([[0,0],[0.38,-5],[0.88,6],[1.2,4],[1.6,0]]) });
    put(anims.chestbeat, 'hip', { translate: xy([[0,0,0],[0.3,0,-7],...beats.flatMap((t,i)=>[[t,i%2?-5:5,5],[t+0.15,i%2?-3:3,-4]]),[settle,0,0]]) });
    put(anims.chestbeat, 'armL', { rotate: rot([[0,0],...beats.flatMap((t,i)=>[[t,i%2?-8:-20],[t+0.15,i%2?-3:-9]]),[settle,0]]) });
    put(anims.chestbeat, 'armR_fore', { rotate: rot([[0,0],...beats.flatMap((t,i)=>[[t,i%2?2:7],[t+0.15,i%2?1:3]]),[settle,0]]) });
    put(anims.chestbeat, 'torso', { rotate: rot([[0,0],...beats.flatMap((t,i)=>[[t,i%2?0.9:-0.9],[t+0.15,i%2?0.4:-0.4]]),[settle,0]]) });
  }
  // Keep both feet grounded during the upper-body celebration.
  for (const key of anims.cheer.bones.root.translate) key.x *= 0.36;
  // Let the acting read bigger through shoulders and torso, while the feet
  // retain their planted travel and the painted joints stay overlapped.
  const widen = (clip, bone, gain) => {
    for (const key of anims[clip].bones[bone]?.rotate ?? []) key.value *= gain;
  };
  for (const arm of ['armL', 'armR']) {
    widen('idle', arm, 1.08);
    widen('nod', arm, 1.12);
    widen('cheer', arm, cast === 'mg' ? 1.2 : 1.14);
    widen('chestbeat', arm, 1.16);
  }
  for (const fore of ['armL_fore', 'armR_fore']) {
    widen('cheer', fore, 1.12);
    widen('chestbeat', fore, 1.12);
  }
  widen('cheer', 'torso', cast === 'mg' ? 1.18 : 1.12);
  widen('cheer', 'head', 1.08);
  widen('chestbeat', 'torso', 1.18);
};
