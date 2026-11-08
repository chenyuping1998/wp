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
  soundBladeHit: ({ finale }) => accent(finale ? .9 : .55),
 });
 onMount(() => {
  let raf = 0, last = performance.now();
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const updatePreference = () => { presentation.reducedMotion = preference.matches; if(preference.matches) presentation.energy = 0; };
  updatePreference();
  preference.addEventListener('change',updatePreference);
  const prior: string[] = [];
  const changed: number[] = [];
  const from: number[] = [];
  const tick = (now: number) => {
   const step = frameStep(now,last,document.hidden); last = now;
   presentation.clock += step;
   if (!presentation.reducedMotion) presentation.ambientClock += step;
   if (!document.hidden) {
    presentation.energy = presentation.reducedMotion ? 0 : pulse(presentation.clock-accentAt,accentStrength);
    context.stateGame.board.forEach((reel,index) => {
     const motion = reel.reelState.motion;
     if (motion !== prior[index]) { from[index]=presentation.reels[index]?.blur??0; prior[index]=motion; changed[index]=presentation.clock; }
     const look = reelLook(motion,(presentation.clock-changed[index])*1000,stateBet.isTurbo,from[index]);
     const next = presentation.reducedMotion ? {blur:0,landing:0,rail:0} : look;
     const current = presentation.reels[index];
     if (!current || current.blur !== next.blur || current.landing !== next.landing || current.rail !== next.rail) presentation.reels[index] = next;
    });
   }
   raf=requestAnimationFrame(tick);
  };
  raf=requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(raf); preference.removeEventListener('change',updatePreference); presentation.energy=0; presentation.reels=presentation.reels.map(() => ({blur:0,landing:0,rail:0})); };
 });
</script>
