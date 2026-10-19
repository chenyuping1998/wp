// Tea-house acting: the master presents a cup; the apprentice answers with
// light footwork. Weight shifts are led from the hip so robe seams stay joined.
import { LAUGH } from './laugh_motion_v9.mjs';
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
    // Big win: draw cup inward, step forward and offer it to the board.
    put(anims.cheer, 'root', { translate: xy([[0,0,0],[0.16,-8,0],[0.4,-19,3],[0.65,-6,8],[0.9,21,1],[1.18,23,0],[1.42,8,0],[1.7,0,0]]) });
    put(anims.cheer, 'hip', { translate: xy([[0,0,0],[0.16,-9,-9],[0.4,-12,11],[0.65,5,-6],[0.9,13,16],[1.18,5,-4],[1.7,0,0]]) });
    put(anims.cheer, 'torso', { rotate: rot([[0,0],[0.16,-4],[0.4,-6],[0.65,2],[0.9,6],[1.18,3],[1.7,0]]) });
    put(anims.cheer, 'armL', { rotate: rot([[0,0],[0.2,-9],[0.44,-20],[0.68,-13],[0.94,-29],[1.22,-15],[1.7,0]]) });
    put(anims.cheer, 'armL_fore', { rotate: rot([[0,0],[0.26,4],[0.52,10],[0.75,5],[1.02,12],[1.28,5],[1.7,0]]) });
    put(anims.cheer, 'armR', { rotate: rot([[0,0],[0.2,8],[0.44,16],[0.68,9],[0.94,23],[1.22,11],[1.7,0]]) });
    // The cup hand answers every laugh beat; the shoulder remains on the
    // original weighted path through the robe and collar.
    put(anims.chestbeat, 'armL_fore', { rotate: teaPulse(7) });
  } else {
    put(anims.idle, 'hip', { translate: xy([[0,0,0],[1.5,-7,2],[3,0,0],[4.5,7,2],[6,0,0]]) });
    put(anims.idle, 'torso', { rotate: rot([[0,0],[1.5,-2.5],[3,0],[4.5,2.5],[6,0]]) });
    put(anims.nod, 'armL', { rotate: rot([[0,0],[0.14,-7],[0.4,-15],[0.65,-5],[0.9,0]]) });
    // The apprentice pivots and offers the freshly poured tea.
    put(anims.cheer, 'root', { translate: xy([[0,0,0],[0.16,-20,0],[0.4,-44,8],[0.66,-15,18],[0.92,48,1],[1.18,50,0],[1.4,17,0],[1.6,0,0]]) });
    put(anims.cheer, 'hip', { translate: xy([[0,0,0],[0.16,-10,-8],[0.4,-15,14],[0.66,5,-6],[0.92,14,16],[1.18,6,-4],[1.6,0,0]]) });
    put(anims.cheer, 'torso', { rotate: rot([[0,0],[0.16,-3],[0.4,-5],[0.66,3],[0.92,6],[1.18,3],[1.6,0]]) });
    put(anims.cheer, 'armL', { rotate: rot([[0,0],[0.2,-9],[0.44,-21],[0.7,-15],[0.96,-27],[1.22,-12],[1.6,0]]) });
    put(anims.cheer, 'armL_fore', { rotate: rot([[0,0],[0.27,3],[0.52,9],[0.76,4],[1.02,11],[1.27,4],[1.6,0]]) });
    put(anims.cheer, 'armR', { rotate: rot([[0,0],[0.2,7],[0.44,13],[0.7,8],[0.96,16],[1.22,7],[1.6,0]]) });
    put(anims.chestbeat, 'armL_fore', { rotate: teaPulse(6) });
  }
};
