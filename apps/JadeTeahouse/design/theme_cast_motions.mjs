// Tea-house acting: the master presents a cup; the apprentice answers with
// light footwork. Weight shifts are led from the hip so robe seams stay joined.
import { LAUGH } from './laugh_motion_v9.mjs';
import { cheerBones } from './cheer_motion_v2.mjs';
const rot = (keys) => keys.map(([time, value]) => ({ time, value }));
const xy = (keys) => keys.map(([time, x, y]) => ({ time, x, y }));
const put = (clip, bone, timelines) => Object.assign(clip.bones[bone] ??= {}, timelines);
const beats = Array.from({ length: LAUGH.beats }, (_, i) => (LAUGH.startMs + i * LAUGH.gapMs) / 1000);
const teaPulse = (a) => rot([[0,0], ...beats.flatMap((t,i) => [[t, (i%2 ? -1:1)*a], [t+0.15, (i%2 ? -1:1)*a*.28]]), [LAUGH.endMs/1000,0]]);
export const applyThemeCast = (anims, cast) => {
  if (cast === 'mg') {
    put(anims.idle, 'hip', { translate: xy([[0,0,0],[1.2,-6,-2],[2.4,0,0],[3.6,6,-2],[4.8,0,0]]) });
    put(anims.idle, 'torso', { rotate: rot([[0,0],[1.2,-2.5],[2.4,0],[3.6,2.5],[4.8,0]]) });
    put(anims.idle, 'armL', { rotate: rot([[0,0],[0.6,-5],[1.2,-10],[1.8,-4],[2.4,0],[3,-5],[3.6,-10],[4.2,-4],[4.8,0]]) });
    // A small paying win receives a measured cup-lift.
    put(anims.nod, 'armL', { rotate: rot([[0,0],[0.16,-7],[0.38,-17],[0.58,-8],[0.8,0]]) });
    put(anims.nod, 'hip', { translate: xy([[0,0,0],[0.16,-3,-5],[0.38,2,5],[0.8,0,0]]) });
    // Big win: one gesture — wind up, offer the cup, HOLD, settle (cheer_motion_v2.mjs).
    for (const [bone, tl] of Object.entries(cheerBones('mg'))) put(anims.cheer, bone, tl);
    // The cup hand answers every laugh beat; the shoulder remains on the
    // original weighted path through the robe and collar.
    put(anims.chestbeat, 'armL_fore', { rotate: teaPulse(7) });
  } else {
    put(anims.idle, 'hip', { translate: xy([[0,0,0],[1.5,-7,2],[3,0,0],[4.5,7,2],[6,0,0]]) });
    put(anims.idle, 'torso', { rotate: rot([[0,0],[1.5,-2.5],[3,0],[4.5,2.5],[6,0]]) });
    put(anims.nod, 'armL', { rotate: rot([[0,0],[0.14,-7],[0.4,-15],[0.65,-5],[0.9,0]]) });
    // The apprentice: the same wind-up / offer / hold, lighter (cheer_motion_v2.mjs).
    for (const [bone, tl] of Object.entries(cheerBones('fg'))) put(anims.cheer, bone, tl);
    put(anims.chestbeat, 'armL_fore', { rotate: teaPulse(6) });
  }
};
