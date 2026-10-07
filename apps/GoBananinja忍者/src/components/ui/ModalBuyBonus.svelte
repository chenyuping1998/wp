<script lang="ts">
	// Boat/Boom's four-card feature menu, themed as ninja scrolls and lacquer.
	// Selection still goes through the shared confirmation dialog.
	import { Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateModal, stateMetaDerived, stateBet, stateUrlDerived } from 'state-shared';
	import { stateBonus } from 'components-ui-html/src/stateBonus.svelte';
	import BetMenuAmountToggle from 'components-ui-html/src/components/BetMenuAmountToggle.svelte';
	import { getContextEventEmitter } from 'utils-event-emitter';
	import type { EmitterEventModal } from 'components-ui-html/src/types';
	import { numberToCurrencyString } from 'utils-shared/amount';
	import { base } from '$app/paths';
	import config from '../../game/config';

	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();
	const art = (name: string) => `${base}/assets/sprites/goBananasUi/buy_scene_${name}.png`;
	type Card = { title: string; subtitle: string; tag: string; image: string; accent: string; blades: number; points: string[] };
	const CARDS: Record<string, Card> = {
		HOLDANDSPIN: { title: 'HOLD AND SPIN', subtitle: '3 RESPINS', tag: 'COIN TRIAL', image: art('holdandspin'), accent: '#82c9af', blades: 0, points: ['Coins stick on the board', 'Every Coin resets 3 respins'] },
		BONUS100: { title: 'FREE SPINS', subtitle: '1 REEL PRE-SPLIT', tag: 'SHADOW I', image: art('bonus100'), accent: '#e7c87f', blades: 1, points: [`${config.betModes.bonus100.spins} free spins`, 'Start with one split reel'] },
		BONUS200: { title: 'SUPER FREE SPINS', subtitle: '2 REELS PRE-SPLIT', tag: 'SHADOW II', image: art('bonus200'), accent: '#e8a164', blades: 2, points: [`${config.betModes.bonus200.spins} free spins`, 'More blades can land'] },
		BONUS300: { title: 'MAX FREE SPINS', subtitle: '3 REELS PRE-SPLIT', tag: 'SHADOW III', image: art('bonus300'), accent: '#ef7369', blades: 3, points: [`${config.betModes.bonus300.spins} free spins`, 'Highest blade frequency'] },
	};
	const modes = $derived(stateMetaDerived.betModeMetaList().filter((mode) => mode.type === 'buy'));
	const social = $derived(stateUrlDerived.social());
	const close = () => (stateModal.modal = null);
	const choose = (mode: string) => {
		stateBonus.selectedBetModeKey = mode;
		eventEmitter.broadcast({ type: 'buyBonusConfirm' });
	};
</script>

{#if stateModal.modal?.name === 'buyBonus'}
	<Popup zIndex={zIndex.modal} onclose={close}>
		<div class="menu">
			<header>
				<div class="heading"><h2>{social ? 'FEATURES' : 'BUY FEATURE'}</h2><p>CHOOSE YOUR NINJA TRIAL</p></div>
				<BetMenuAmountToggle />
			</header>
			<div class="cards">
				{#each modes as mode (mode.mode)}
					{@const card = CARDS[mode.mode]}
					{#if card}
						<section class="card" style:--accent={card.accent}>
							<div class="scene" style:background-image={`url('${card.image}')`}>
								<span class="tag">{card.tag}</span>
							</div>
							<div class="body">
								<h3>{card.title}</h3>
								<div class="meter" aria-label={card.subtitle}>
									{#if card.blades === 0}
										{#each [0, 1, 2] as _}<span class="coin" aria-hidden="true">●</span>{/each}
									{:else}
										{#each [0, 1, 2] as index}<span class="blade" class:lit={index < card.blades} aria-hidden="true">⚔</span>{/each}
									{/if}
								</div>
								<div class="subtitle">{card.subtitle}</div>
								<ul>{#each card.points as point}<li>{point}</li>{/each}</ul>
								<div class="cost">{mode.costMultiplier}<small>×</small></div>
								<button class="buy" onclick={() => choose(mode.mode)}>
									{mode.text.button}<span>{numberToCurrencyString(stateBet.betAmount * mode.costMultiplier)}</span>
								</button>
							</div>
						</section>
					{/if}
				{/each}
			</div>
			<div class="foot">All features play at {(config.rtp * 100).toFixed(0)}% RTP · Max win 10,000×</div>
		</div>
	</Popup>
{/if}

<style>
	.menu{position:relative;z-index:3;box-sizing:border-box;width:min(1040px,calc(100dvw - 16px));max-height:calc(100dvh - 16px);overflow:auto;padding:22px 24px 18px;color:#f4e8d0;text-align:center;font-family:var(--gb-body-font,'Segoe UI',sans-serif);background:linear-gradient(160deg,#172833,#08131b);border:3px solid #a7824b;border-radius:14px;box-shadow:0 0 0 4px #071018,0 24px 60px #000d,inset 0 0 40px #0006}
	.menu::before{content:'';position:absolute;inset:9px;border:1px solid #a53941;border-radius:8px;pointer-events:none}
	header{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:10px 26px}
	.menu h2{margin:0;color:#f0d490 !important;font:400 33px var(--gb-display-font,'Titan One');letter-spacing:2px;text-shadow:0 3px #30150e}
	.heading p{margin:2px 0;color:#aab9ba;font-size:12px;letter-spacing:2.4px}
	.cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px;margin-top:16px}
	.card{display:flex;min-width:0;flex-direction:column;overflow:hidden;background:#101e26;border:2px solid var(--accent);border-radius:9px;box-shadow:0 8px 20px #0009;transition:transform .18s,box-shadow .18s}
	@media (hover:hover){.card:hover{transform:translateY(-5px);box-shadow:0 12px 24px #000b,0 0 20px color-mix(in srgb,var(--accent) 35%,transparent)}}
	.scene{position:relative;aspect-ratio:16/10;max-height:172px;background-position:center;background-size:cover;image-rendering:auto}
	.scene::after{content:'';position:absolute;inset:35% 0 0;background:linear-gradient(transparent,#101e26)}
	.tag{position:absolute;z-index:1;top:9px;left:9px;padding:4px 8px;color:#09141b;background:var(--accent);border-radius:3px;font:400 10px var(--gb-display-font,'Titan One');letter-spacing:1px}
	.body{display:flex;flex:1;flex-direction:column;padding:4px 12px 12px}
	.menu h3{display:grid;place-items:center;min-height:43px;margin:0 0 4px;color:var(--accent) !important;font:400 18px/1.1 var(--gb-display-font,'Titan One');letter-spacing:.7px;text-shadow:0 2px #000}
	.meter{display:flex;min-height:29px;justify-content:center;align-items:center;gap:7px}
	.blade{color:#50636a;font:24px/1 'Segoe UI Symbol',sans-serif;filter:grayscale(1)}
	.blade.lit{color:var(--accent);filter:none;text-shadow:0 0 9px var(--accent)}
	.coin{color:var(--accent);font:28px/1 Arial;text-shadow:0 0 0 #8e672a,1px 2px #8e672a}
	.subtitle{margin:4px 0 7px;color:#bbc9c7;font-size:10px;letter-spacing:1.4px}
	ul{margin:0 0 8px;padding:0;list-style:none;text-align:left;color:#d7e0dc;font-size:12.5px;line-height:1.55}
	li::before{content:'◆';margin-right:6px;color:var(--accent);font-size:8px}
	.cost{margin-top:auto;color:var(--accent);font:400 42px var(--gb-display-font,'Titan One');text-shadow:0 2px #000}
	.cost small{font:700 24px 'Segoe UI',sans-serif}
	.buy{position:relative;overflow:hidden;width:100%;margin-top:7px;padding:9px 5px;color:#08151c;background:linear-gradient(#fff5d8,var(--accent) 38%,color-mix(in srgb,var(--accent) 75%,#111));border:1px solid #fff8;border-radius:5px;cursor:pointer;font:400 14px var(--gb-display-font,'Titan One');letter-spacing:.4px;transition:filter .15s,transform .15s}
	.buy span{display:block;margin-top:2px;font:600 11px 'Segoe UI',sans-serif;overflow-wrap:anywhere}
	@media (hover:hover){.buy:hover{filter:brightness(1.18);transform:translateY(-2px)}}
	.buy:active{transform:translateY(1px)}
	.buy:focus-visible{outline:2px solid white;outline-offset:2px}
	.foot{margin-top:12px;color:#9fadae;font-size:11px}
	@media(max-height:820px) and (min-width:521px){.menu{padding:15px 18px 12px}.cards{margin-top:10px}.scene{max-height:135px}.cost{font-size:36px}.foot{margin-top:6px}}
	@media(max-height:560px) and (min-width:521px){.menu h2{font-size:23px}.heading p,.foot,ul{display:none}.scene{max-height:75px}.body{padding:3px 7px 7px}.cost{font-size:29px}.menu h3{min-height:30px;font-size:15px}}
	@media(max-width:860px) and (min-height:641px){.cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
	@media(max-width:520px){.menu{padding:14px 10px}.cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.scene{max-height:95px}.body{padding:3px 7px 8px}.menu h2{font-size:24px}.heading p,.foot,ul{display:none}.menu h3{min-height:36px;font-size:13px}.subtitle{font-size:9px;letter-spacing:.6px}.cost{font-size:28px}.buy{font-size:11px;padding:7px 3px}.buy span{font-size:10px}}
	/* ── THE SMALLEST VIEWS (Stake review 2026-10-04 on Go Bananas Boat: "Popout S").
	   A window a couple of hundred px tall: under 521 wide the cards go two by two
	   with their scenes, which is two screens of menu. Four across instead, with
	   only the name, the price and the button — the rest is in the confirmation. */
	@media(max-height:420px){.menu{padding:8px 10px;max-height:calc(100dvh - 8px)}.menu::before,.heading p,.scene,.meter,.subtitle,ul,.foot{display:none}.menu h2{font-size:18px}.cards{grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:6px}.body{padding:6px}.menu h3{min-height:0;margin:0 0 2px;font-size:12px}.cost{font-size:22px}.cost small{font-size:14px}.buy{margin-top:4px;padding:5px 4px;font-size:11px}.buy span{font-size:10px}}
	@media(prefers-reduced-motion:reduce){.card,.buy{transition:none}}
</style>
