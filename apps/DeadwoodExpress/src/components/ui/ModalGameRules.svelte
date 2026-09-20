<script lang="ts">
import { Popup } from 'components-shared';
import { stateModal } from 'state-shared';
import { zIndex } from 'constants-shared/zIndex';
import config from '../../game/config';
import { FEATURE_TIERS } from '../../game/featureTiers';
import { getSocialTerms } from '../../game/socialTerms';
const T=getSocialTerms();
</script>
{#if stateModal.modal?.name === 'gameRules'}
<Popup zIndex={zIndex.modal} onclose={()=>stateModal.modal=null}>
<article><h2>DEADWOOD EXPRESS</h2>
<h3>THE JOURNEY</h3><p>{config.numReels} reels, {config.numRows[0]} rows and {Object.keys(config.paylines).length} fixed {T.paylines}. Matching symbols form wins from the leftmost reel. Only the highest win on each line is awarded. Wild substitutes for every symbol except Scatter and has its own symbol value.</p>
<h3>STEAM PRESSURE</h3><p>During free spins, every spin with at least one winning line turns the multiplier wheel exactly once. The new multiplier immediately applies to every line win on that spin, including all-Wild lines. The selected multiplier replaces the previous value. It can increase or stay equal, never decrease, and remains until the feature ends. A spin without a line win does not turn the wheel and does not reset the multiplier. Retriggers preserve it.</p>
{#each FEATURE_TIERS as tier}<h3>{tier.title}</h3><p>{tier.summary}</p><p>{T.cost}: {config.betModes[tier.key].cost}× {T.bet}.</p>{/each}
<h3>CONTROLS</h3><p>Press Spin or the space bar to start. Press Stop to shorten reel motion. Turbo shortens animations. Auto Spin repeats rounds using the chosen settings. The menu contains sound, settings and the symbol table.</p>
<h3>LIMITS</h3><p>Maximum round win: {config.betModes.base.max_win.toLocaleString()}× {T.totalBet}. RTP: {(config.rtp*100).toFixed(2)}%. Individual results vary.</p>
<p>Malfunction voids all {T.pays} and plays.</p><p>© Engine</p>
</article></Popup>
{/if}
<style>article{position:relative;z-index:3;max-width:720px;max-height:78vh;overflow:auto;padding:32px;color:#e5e7d8;background:#102522;border:1px solid #af8c55;font:16px/1.7 Saira,sans-serif}h2,h3{font-family:Georgia;color:#ddbd80;letter-spacing:2px}h3{margin-top:26px;font-size:19px}</style>
