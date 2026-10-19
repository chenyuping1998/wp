import { LAUGH } from './laugh_motion_v9.mjs';
// Diner-specific acting. The chef presents an order; the server rolls into
// frame and calls the table. Body weight leads, hands trail their shoulders.
const rot = (keys) => keys.map(([time, value]) => ({ time, value }));
const xy = (keys) => keys.map(([time, x, y]) => ({ time, x, y }));
const put = (clip, bone, timelines) => Object.assign(clip.bones[bone] ??= {}, timelines);
const beats = Array.from({ length: LAUGH.beats }, (_, i) => (LAUGH.startMs + i * LAUGH.gapMs) / 1000);
const settle = LAUGH.endMs / 1000;

export const applyThemeCast = (anims, cast) => {
  if (cast === 'mg') {
    // The chef checks the griddle and works at counter height.
    put(anims.idle, 'hip', { translate: xy([[0,0,0],[1.2,-7,-3],[2.4,0,0],[3.6,7,-3],[4.8,0,0]]) });
    put(anims.idle, 'torso', { rotate: rot([[0,0],[1.2,-3],[2.4,0],[3.6,3],[4.8,0]]) });
    put(anims.idle, 'armR', { rotate: rot([[0,0],[0.6,-5],[1.2,-12],[1.8,-4],[2.4,0],[3,-5],[3.6,-12],[4.2,-4],[4.8,0]]) });
    put(anims.idle, 'armR_fore', { rotate: rot([[0,0],[0.7,3],[1.3,8],[1.9,3],[2.4,0],[3.1,3],[3.7,8],[4.3,3],[4.8,0]]) });
    // Order ready: shoulder, palm and head arrive at different beats.
    put(anims.nod, 'hip', { translate: xy([[0,0,0],[0.14,-6,-6],[0.34,2,7],[0.58,0,-2],[0.8,0,0]]) });
    put(anims.nod, 'armL', { rotate: rot([[0,0],[0.16,-7],[0.36,-18],[0.57,-9],[0.8,0]]) });
    put(anims.nod, 'armL_fore', { rotate: rot([[0,0],[0.23,4],[0.43,10],[0.64,4],[0.8,0]]) });
    // Big win: pull the order close, step out and serve it proudly.
    put(anims.cheer, 'root', { translate: xy([[0,0,0],[0.16,-18,0],[0.38,-42,8],[0.62,-15,20],[0.88,52,2],[1.17,56,0],[1.42,18,0],[1.7,0,0]]) });
    put(anims.cheer, 'hip', { translate: xy([[0,0,0],[0.16,-11,-11],[0.38,-16,13],[0.62,8,-6],[0.88,17,18],[1.17,10,-4],[1.7,0,0]]) });
    put(anims.cheer, 'torso', { rotate: rot([[0,0],[0.16,-4],[0.38,-7],[0.62,3],[0.88,7],[1.17,5],[1.7,0]]) });
    put(anims.cheer, 'armL', { rotate: rot([[0,0],[0.17,10],[0.38,-15],[0.62,-29],[0.88,-36],[1.17,-27],[1.7,0]]) });
    put(anims.cheer, 'armL_fore', { rotate: rot([[0,0],[0.25,-4],[0.46,7],[0.7,11],[0.96,10],[1.25,5],[1.7,0]]) });
    put(anims.cheer, 'armR', { rotate: rot([[0,0],[0.17,-15],[0.38,-24],[0.62,18],[0.88,38],[1.17,30],[1.7,0]]) });
    // Keep the dark forearm root tucked under the white cuff as the shoulder
    // opens. The old forearm track lagged behind this theme-specific arm pose.
    put(anims.cheer, 'armR_fore', { rotate: rot([[0,0],[0.17,-2],[0.38,-4],[0.62,-1],[0.88,0],[1.17,1],[1.7,0]]) });
    put(anims.cheer, 'head', { rotate: rot([[0,0],[0.38,-5],[0.88,7],[1.17,5],[1.7,0]]) });
    // Ten kitchen-bell-sized accents, alternating hands instead of shaking the neck.
    put(anims.chestbeat, 'hip', { translate: xy([[0,0,0],[0.3,0,-8],...beats.flatMap((t,i)=>[[t,i%2?-6:6,6],[t+0.15,i%2?-4:4,-4]]),[settle,0,0]]) });
    put(anims.chestbeat, 'torso', { rotate: rot([[0,0],...beats.flatMap((t,i)=>[[t,i%2?2.2:-2.2],[t+0.15,i%2?0.8:-0.8]]),[settle,0]]) });
    put(anims.chestbeat, 'armL', { rotate: rot([[0,0],...beats.flatMap((t,i)=>[[t,i%2?-7:-19],[t+0.15,i%2?-3:-8]]),[settle,0]]) });
    put(anims.chestbeat, 'armR', { rotate: rot([[0,0],...beats.flatMap((t,i)=>[[t,i%2?19:7],[t+0.15,i%2?8:3]]),[settle,0]]) });
  } else {
    // Waitress on skates: gliding weight, upper body stays composed.
    put(anims.idle, 'hip', { translate: xy([[0,0,0],[1.5,-10,1],[3,0,0],[4.5,10,1],[6,0,0]]) });
    put(anims.idle, 'torso', { rotate: rot([[0,0],[1.5,-3],[3,0],[4.5,3],[6,0]]) });
    put(anims.idle, 'armL', { rotate: rot([[0,0],[1.5,-9],[3,0],[4.5,-6],[6,0]]) });
    put(anims.nod, 'hip', { translate: xy([[0,0,0],[0.15,-5,-3],[0.4,5,6],[0.9,0,0]]) });
    put(anims.nod, 'armL', { rotate: rot([[0,0],[0.15,-8],[0.4,-18],[0.65,-7],[0.9,0]]) });
    // A two-step skate stop, then an open invitation toward the winning reels.
    put(anims.cheer, 'root', { translate: xy([[0,0,0],[0.16,-30,0],[0.4,-62,7],[0.66,-18,15],[0.92,68,2],[1.18,72,0],[1.4,24,0],[1.6,0,0]]) });
    put(anims.cheer, 'hip', { translate: xy([[0,0,0],[0.16,-14,-7],[0.4,-20,12],[0.66,6,-7],[0.92,18,14],[1.18,8,-4],[1.6,0,0]]) });
    put(anims.cheer, 'torso', { rotate: rot([[0,0],[0.16,-4],[0.4,-6],[0.66,3],[0.92,6],[1.18,3],[1.6,0]]) });
    put(anims.cheer, 'armL', { rotate: rot([[0,0],[0.2,-10],[0.44,-24],[0.7,-18],[0.96,-32],[1.22,-16],[1.6,0]]) });
    put(anims.cheer, 'armL_fore', { rotate: rot([[0,0],[0.27,4],[0.52,11],[0.76,5],[1.04,13],[1.29,5],[1.6,0]]) });
    put(anims.cheer, 'armR', { rotate: rot([[0,0],[0.2,10],[0.44,20],[0.7,12],[0.96,30],[1.22,14],[1.6,0]]) });
    put(anims.chestbeat, 'hip', { translate: xy([[0,0,0],[0.3,0,-7],...beats.flatMap((t,i)=>[[t,i%2?-8:8,6],[t+0.15,i%2?-4:4,-4]]),[settle,0,0]]) });
    put(anims.chestbeat, 'armL', { rotate: rot([[0,0],...beats.flatMap((t,i)=>[[t,i%2?-9:-20],[t+0.15,i%2?-4:-9]]),[settle,0]]) });
    put(anims.chestbeat, 'armR_fore', { rotate: rot([[0,0],...beats.flatMap((t,i)=>[[t,i%2?3:8],[t+0.15,i%2?1:3]]),[settle,0]]) });
    put(anims.chestbeat, 'torso', { rotate: rot([[0,0],...beats.flatMap((t,i)=>[[t,i%2?3:-3],[t+0.15,i%2?1:-1]]),[settle,0]]) });
  }
};
