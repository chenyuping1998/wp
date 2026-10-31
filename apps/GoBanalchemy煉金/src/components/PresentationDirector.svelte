<script lang="ts">
 import { onMount } from 'svelte';
 import { stateBet } from 'state-shared';
 import { getContext } from '../game/context';
 import { presentation } from '../game/presentation.svelte';
 import { reelLook, pulse, frameStep } from '../game/presentationMotion';
 const context = getContext();
 let accentAt = -1e9;
 let accentStrength = 0;
 const accent = (strength: number) => { accentAt = presentation.clock; accentStrength = strength; };
 context.eventEmitter.subscribeOnMount({
  soundFreeGameBell: () => accent(.8),
  soundWinTier: () => accent(.65),
  soundBlastDetonate: ({ full }) => accent(full ? .9 : .55),
 });
 onMount(() => {
  let raf = 0, last = performance.now();
  const prior: string[] = [];
  const changed: number[] = [];
  const from: number[] = [];
  const tick = (now: number) => {
   presentation.clock += frameStep(now,last,document.hidden); last = now;
   if (!document.hidden) {
    presentation.energy = pulse(presentation.clock-accentAt,accentStrength);
    context.stateGame.board.forEach((reel,index) => {
     const motion = reel.reelState.motion;
     if (motion !== prior[index]) { from[index]=presentation.reels[index]?.blur??0; prior[index]=motion; changed[index]=presentation.clock; }
     presentation.reels[index] = reelLook(motion,(presentation.clock-changed[index])*1000,stateBet.isTurbo,from[index]);
    });
   }
   raf=requestAnimationFrame(tick);
  };
  raf=requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(raf); presentation.energy=0; presentation.reels=presentation.reels.map(() => ({blur:0,landing:0,rail:0})); };
 });
</script>
