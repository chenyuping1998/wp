<script lang="ts">
import { Popup } from 'components-shared';
import { stateModal } from 'state-shared';
import { zIndex } from 'constants-shared/zIndex';
import config from '../../game/config';
import { FEATURE_TIERS } from '../../game/featureTiers';
import { getSocialTerms } from '../../game/socialTerms';
import assets from '../../game/assets';
const T=getSocialTerms();
const modes = [{key:'base' as const,title:'BASE GAME'}, ...FEATURE_TIERS];
const controls = [
 {src:assets.hmIconAutoSpin.src,label:'Auto Spin',description:'Repeat rounds using the selected settings. Stop Auto Spin to cancel remaining rounds.'},
 {src:assets.hmIconMenu.src,label:'Menu',description:'Open game information and controls.'},
 {src:assets.hmIconSettings.src,label:'Settings',description:'Adjust the available game settings.'},
 {src:assets.hmIconSoundOn.src,label:'Sound',description:'Turn game audio on or off.'},
 {src:assets.hmIconPayTable.src,label:T.payTableCaps,description:'View symbol values and line patterns.'},
 {src:assets.dwBonusButton.src,label:T.buyBonusName,description:'Open the two feature-entry cards.'},
];
</script>
{#if stateModal.modal?.name === 'gameRules'}
<Popup zIndex={zIndex.modal} onclose={()=>stateModal.modal=null}>
<article><h2>DEADWOOD EXPRESS</h2>
<h3>THE JOURNEY</h3><p>{config.numReels} reels, {config.numRows[0]} rows and {Object.keys(config.paylines).length} fixed {T.paylines}. Matching symbols form wins from the leftmost reel. Only the highest win on each line is awarded. Wild substitutes for every symbol except Scatter and has its own symbol value.</p>
<h3>FREE SPINS</h3><p>{config.featureRules.triggerScatters.midnight_passage} Scatters award {config.featureRules.initialSpins} Midnight Passage free spins; {config.featureRules.triggerScatters.phantom_express} or more award Phantom Express. During the feature: {Object.entries(config.featureRules.retriggerAwards).map(([count,spins])=>`${count} Scatters add ${spins} spins`).join('; ')}.</p>
<h3>STEAM PRESSURE</h3><p>During free spins, every spin with at least one winning line turns the multiplier wheel exactly once. The new multiplier immediately applies to every line win on that spin, including all-Wild lines. The selected multiplier replaces the previous value. It can increase or stay equal, never decrease, and remains until the feature ends. A spin without a line win does not turn the wheel and does not reset the multiplier. Retriggers preserve it.</p>
{#each FEATURE_TIERS as tier}<h3>{tier.title}</h3><p>{tier.summary}</p><p>{T.cost}: {config.betModes[tier.key].cost}× {T.bet}.</p>{/each}
<h3>CONTROLS</h3><p>Press Spin or the space bar to start. Press Stop to shorten reel motion. Turbo shortens animations.</p>
<div class="controls">{#each controls as control}<div class="control"><img src={control.src} alt=""/><p><strong>{control.label}</strong><br/>{control.description}</p></div>{/each}</div>
<h3>MODE LIMITS</h3>
{#each modes as mode}<p><strong>{mode.title}</strong> — {T.cost}: {config.betModes[mode.key].cost}× {T.baseBet}; RTP: {(config.betModes[mode.key].rtp*100).toFixed(2)}%; maximum round win: {config.betModes[mode.key].max_win.toLocaleString()}× {T.baseBet}.</p>{/each}
<p>All maximum wins are relative to the base {T.bet}, not the total feature-entry {T.cost}. Reaching the maximum win ends the round immediately, including any remaining free spins. RTP is a theoretical long-term average; individual results vary.</p>
<p>{T.disclaimerOpening}</p><p>TM and © 2026 Engine.</p>
</article></Popup>
{/if}
<style>article{position:relative;z-index:3;max-width:720px;max-height:78vh;overflow:auto;padding:32px;color:#e5e7d8;background:#102522;border:1px solid #af8c55;font:16px/1.7 Saira,sans-serif}h2,h3{font-family:Georgia;color:#ddbd80;letter-spacing:2px}h3{margin-top:26px;font-size:19px}.controls{display:grid;gap:12px}.control{display:flex;align-items:center;gap:16px}.control img{width:48px;height:48px;object-fit:contain}.control p{margin:0}</style>
