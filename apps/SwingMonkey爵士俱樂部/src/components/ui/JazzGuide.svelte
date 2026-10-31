<script lang="ts">
	import assets from '../../game/assets';
	import config from '../../game/config';
	import { getSocialTerms } from '../../game/socialTerms';
	const props: { rtp?: string; maxWin?: string; onjump?: (id: string) => void } = $props();
	const T = getSocialTerms();
	const ways = config.numRows.reduce((n: number, rows: number) => n * rows, 1);
	const sections = [ { id: 'play', label: 'How to play' }, { id: 'records', label: 'Records' }, { id: 'free', label: 'Free Spins' }, { id: 'scatter', label: 'Scatter' }, { id: 'controls', label: 'Controls' } ];
	const steps = [
		{ key: 'gbH1', name: 'Find your rhythm', text: `Match symbols on 3 or more adjacent reels from reel 1. Any row counts toward the ${ways.toLocaleString()} ${T.ways}.` },
		{ key: 'gbW', name: 'Let the band collect', text: 'Every Bandleader collects every Record on the board. More Bandleaders mean more collections.' },
		{ key: 'gbS', name: 'Take the next set', text: `3, 4 or 5 Golden Mics award ${Object.values(config.scatterSpins).join(', ')} Free Spins respectively.` },
	] as const;
</script>

{#if props.rtp && props.maxWin}
	<header class="jazz-masthead">
		<p class="eyebrow">THE CLUB PLAYBOOK</p>
		<h2 style="color: #241b17 !important"><span>SWING</span> MONKEY</h2>
		<p class="strap">Meet the band. Learn the rhythm.</p>
		<img src={assets.gbW.src} alt="" aria-hidden="true" />
	</header>
	<dl class="jazz-stats">
		<div><dt>Reels</dt><dd>{config.numReels}×{config.numRows[0]}</dd></div>
		<div><dt>{T.ways}</dt><dd>{ways.toLocaleString()}</dd></div>
		<div><dt>RTP</dt><dd>{props.rtp}</dd></div>
		<div><dt>Max win</dt><dd>{props.maxWin}</dd></div>
	</dl>
	<nav aria-label="Game information sections" class="jazz-nav">
		{#each sections as section, i}<button type="button" onclick={() => props.onjump?.(section.id)}><span>{i + 1}</span>{section.label}</button>{/each}
	</nav>
{/if}
<section class="jazz-quick" aria-label="Quick guide">
	<p class="eyebrow">THREE NOTES TO KNOW</p>
	<ol>{#each steps as step, i}<li>
		<div class="jazz-art"><span>{String(i + 1).padStart(2, '0')}</span><img src={assets[step.key].src} alt="" /></div>
		<div><h3 style="color: #8e2530 !important">{step.name}</h3><p>{step.text}</p></div>
	</li>{/each}</ol>
</section>

<style>
	.jazz-masthead { position: relative; padding: .4rem 5.8rem .7rem 0; text-align: left; color: #251c18; }
	.eyebrow { margin: 0 0 .4rem; font: 700 .65rem var(--gb-body-font, sans-serif); letter-spacing: .2em; color: #9c2630; }
	h2 { margin: .2rem 0; font: 400 clamp(1.55rem, 6vw, 2.4rem)/1.12 var(--gb-display-font, serif); color: #241b17; letter-spacing: -.02em; transform: rotate(-2deg); transform-origin: left; text-shadow: 2px 2px 0 #fff8e9; background: none; }
	h2 span { color: #b62c35; }
	.strap { margin: .55rem 0 0; font: italic 600 .82rem var(--gb-body-font, sans-serif); }
	.jazz-masthead > img { position: absolute; right: .2rem; top: 0; width: 5.3rem; height: 5.3rem; object-fit: contain; transform: rotate(8deg); }
	.jazz-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .35rem; margin: .3rem 0 .8rem; padding: .7rem 0; border-block: 2px solid #33261e; }
	.jazz-stats div { min-width: 0; display: flex; flex-direction: column-reverse; gap: .15rem; text-align: center; }
	dt { font-size: .61rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: #655047; }
	dd { margin: 0; font: 400 clamp(.8rem, 3.2vw, 1.1rem) var(--gb-display-font, serif); color: #ad2933; white-space: nowrap; }
	.jazz-nav { display: flex; flex-wrap: wrap; gap: .4rem; margin: .3rem 0 1.2rem; }
	button { display: inline-flex; align-items: center; gap: .4rem; border: 1px solid #c8b899; border-radius: 2rem; padding: .28rem .65rem .28rem .28rem; background: #fff8e9; color: #34251e; font: 700 .72rem var(--gb-body-font, sans-serif); cursor: pointer; }
	button span { display: grid; place-items: center; width: 1.3rem; height: 1.3rem; border-radius: 50%; color: #fff8e9; background: #ad2933; font: 400 .7rem var(--gb-display-font, serif); }
	button:hover, button:focus-visible { outline: 2px solid #ad2933; outline-offset: 2px; }
	.jazz-quick { padding: .8rem 0; border-top: 1px solid #b9a98e; text-align: left; }
	ol { list-style: none; padding: 0; margin: 0; }
	li { display: grid; grid-template-columns: 76px minmax(0, 1fr); align-items: center; gap: .8rem; padding: .65rem 0; }
	li + li { border-top: 1px dashed #c9b99d; }
	.jazz-art { position: relative; }
	.jazz-art img { display: block; width: 70px; height: 70px; object-fit: contain; }
	.jazz-art span { position: absolute; left: -2px; top: -3px; color: #ad2933; font: 400 .65rem var(--gb-display-font, serif); }
	h3 { margin: 0 0 .3rem; font: 400 1rem var(--gb-display-font, serif); color: #8e2530; }
	li p { margin: 0; font: 400 .8rem/1.55 var(--gb-body-font, sans-serif); color: #44362b; }
	@media (max-width: 400px) { .jazz-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .7rem; } li { grid-template-columns: 58px minmax(0, 1fr); gap: .55rem; } .jazz-art img { width: 55px; height: 60px; } .jazz-masthead { padding-right: 4.7rem; } .jazz-masthead > img { width: 4.5rem; height: 4.5rem; } }
</style>
