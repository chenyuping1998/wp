<script lang="ts">
	import { pearlInfo } from '../../game/pearlInfo';
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
	const {eventEmitter}=getContextEventEmitter<EmitterEventModal>();
	const social=$derived(stateUrlDerived.social());
	const modes=$derived(stateMetaDerived.betModeMetaList().filter(mode=>mode.type==='buy'));
	const art=(file:string)=>`${base}/assets/sprites/${file}`;
	const affordable=(cost:number)=>stateBet.betAmount>0&&stateBet.balanceAmount>=stateBet.betAmount*cost;
	// EXTRA BET (math mode `ante`): an 'activate' mode — it stays on until turned off.
	const ante=$derived(stateMetaDerived.betModeMetaList().find(mode=>mode.type==='activate'));
	const anteOn=$derived(stateBet.activeBetModeKey.toUpperCase()==='ANTE');
	const toggleAnte=()=>{
		eventEmitter.broadcast({type:'soundPressGeneral'});
		if(anteOn){stateBet.activeBetModeKey='BASE';stateModal.modal=null;return;}
		if(!ante)return;
		stateBonus.selectedBetModeKey=ante.mode;
		eventEmitter.broadcast({type:'buyBonusConfirm'});
	};
	const choose=(mode:string,cost:number)=>{
		if(!affordable(cost))return;
		stateBonus.selectedBetModeKey=mode;
		eventEmitter.broadcast({type:'soundPressGeneral'});
		eventEmitter.broadcast({type:'buyBonusConfirm'});
	};
</script>

{#if stateModal.modal?.name==='buyBonus'}
	<Popup zIndex={zIndex.modal} onclose={()=>stateModal.modal=null}>
		<div class="hm-feature">
			<header class="marquee">
				<svg class="lights" viewBox="0 0 900 14" aria-hidden="true">{#each Array.from({length:24},(_,i)=>i) as i}<circle cx={12+i*38} cy="7" r="4"/>{/each}</svg>
				<div class="heading"><span class="eyebrow">HYPNO MONKEY</span><h2>{social?'FEATURES':'BUY BONUS'}</h2><p>CHOOSE YOUR SHOW</p></div>
				<div class="amount"><span>{social?'PLAY AMOUNT':'BET AMOUNT'}</span><BetMenuAmountToggle/></div>
			</header>
			<div class="tickets">
				{#each modes as mode (mode.mode)}
					{@const superMode=mode.mode==='SUPER_BONUS'}
					{@const cfg=superMode?config.betModes.super_bonus:config.betModes.bonus}
					{@const values=superMode?pearlInfo.superValues:pearlInfo.freeValues}
					{@const min=Math.min(...values)}
					{@const max=Math.max(...values)}
					{@const canBuy=affordable(mode.costMultiplier)}
					<section class="ticket" class:super={superMode}>
						<div class="scene" style:background-image={`url('${art(superMode?'hypnoBackground/bg_free.jpg':'hypnoBackground/bg_base.jpg')}')`}>
							<div class="spotlight"></div>
							<img class="assistant" src={art('hypnoBuy/assistant.png')} alt=""/>
							<div class="hero-watch"><img src={art(`hypnoWatches/watch-${superMode?'t5':'t1'}.png`)} alt=""/><strong>×{min}</strong></div>
							<span class="show-tag">{superMode?'THE GOLDEN SHOW':'THE HYPNO SHOW'}</span>
							<div class="spin-stub"><strong>{config.freeSpins.spins}</strong><span>FREE SPINS</span></div>
						</div>
						<div class="ticket-body">
							<h3>{superMode?'SUPER FREE SPINS':'FREE SPINS'}</h3>
							<div class="watch-range">WATCH VALUES <strong>×{min} – ×{max}</strong></div>
							<div class="formula" aria-label="Watch multipliers add together"><span>×{min}</span><i>+</i><span>×{superMode?25:5}</span><i>=</i><b>×{min+(superMode?25:5)}</b></div>
							<p>Winning watches add to a running total.<br/>{superMode?`Every watch is ×${min} or more.`:'The total stays for the whole feature.'}</p>
							<div class="ticket-divider"><span></span><b>{mode.costMultiplier}× {social?'AMOUNT':'BET'}</b><span></span></div>
							<button class="enter" disabled={!canBuy} onclick={()=>choose(mode.mode,mode.costMultiplier)}><span>{social?'PLAY FEATURE':'BUY FEATURE'}</span><strong>{numberToCurrencyString(stateBet.betAmount*mode.costMultiplier)}</strong></button>
							<div class="card-foot"><span>{(cfg.rtp*100).toFixed(2)}% RTP</span><span>{canBuy?'CONFIRM ON NEXT SCREEN':'INSUFFICIENT BALANCE'}</span></div>
						</div>
					</section>
				{/each}
			</div>
			{#if ante}
				<section class="extra" class:on={anteOn}>
					<div class="extra-text"><h3>{ante.text.betAmountLabel || ante.text.title}</h3><p>{ante.text.description}</p></div>
					<div class="extra-cost"><b>{ante.costMultiplier}× {social?'AMOUNT':'BET'}</b><span>{(config.betModes.ante.rtp*100).toFixed(2)}% RTP</span></div>
					<button class="extra-toggle" onclick={toggleAnte}>{anteOn?'TURN OFF':'TURN ON'}</button>
				</section>
			{/if}
			<footer>MAX WIN <strong>{config.betModes.base.max_win.toLocaleString()}×</strong><span>WINNING WATCHES MULTIPLY THE SPIN</span></footer>
		</div>
	</Popup>
{/if}

<style>
	.extra{display:grid;grid-template-columns:1fr auto auto;gap:16px;align-items:center;margin:0 26px 14px;padding:12px 16px;border:2px solid #63342a;border-radius:11px;background:#fff4da;box-shadow:0 4px 0 #cfa971}
	.extra.on{border-color:#2f7d5b;background:#e6f4ea}
	.extra h3{margin:0;font:18px var(--gb-display-font);color:#821527}.extra p{margin:3px 0 0;font-size:12px}
	.extra-cost{display:flex;flex-direction:column;align-items:flex-end;font-size:11px}.extra-cost b{font:15px var(--gb-display-font)}
	.extra-toggle{min-width:118px;padding:10px 14px;border:2px solid #351a21;border-radius:9px;background:#821527;color:#ffedc2;font:14px var(--gb-display-font);cursor:pointer}
	.extra.on .extra-toggle{background:#2f7d5b}
	@media (max-width:640px){.extra{grid-template-columns:1fr;text-align:center}.extra-cost{align-items:center}}
	.hm-feature{--ink:#351a21;--gold:#efb940;width:min(900px,calc(100vw - 44px));max-height:calc(100dvh - 62px);overflow:auto;box-sizing:border-box;border:3px solid var(--gold);border-radius:18px;background:#f4e5c5;color:var(--ink);box-shadow:0 8px 0 #351a21;font-family:var(--gb-body-font);position:relative;z-index:100}
	.marquee{position:relative;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:26px 30px 16px;background:#821527;border-bottom:4px solid var(--gold);color:#ffedc2}
	.lights{position:absolute;left:14px;right:14px;top:5px;width:calc(100% - 28px);height:12px;fill:#ffdc7a}
	.heading .eyebrow{font:11px var(--gb-display-font);letter-spacing:.18em}.heading h2{margin:3px 0;color:#ffdf83!important;font-size:30px!important;line-height:1}.heading p{margin:5px 0 0;font-size:10px;letter-spacing:.18em}
	.amount{display:flex;flex-direction:column;gap:5px;align-items:center;font-size:10px;letter-spacing:.1em;padding:9px 14px;border:1px solid #c99746;border-radius:9px;background:#5a1424}
	.amount :global(.amount){font:20px var(--gb-display-font);letter-spacing:0}.amount :global(.toggle-wrap){gap:10px}
	.tickets{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:22px 26px 16px}.ticket{min-width:0;border:2px solid #63342a;border-radius:11px;background:#fff4da;overflow:hidden;box-shadow:0 4px 0 #cfa971}.ticket.super{border-color:#9b6724}
	.scene{height:185px;background-size:cover;background-position:center;position:relative;overflow:hidden;border-bottom:3px solid #e8b94c;background-color:#533057}
	.scene:before{content:'';position:absolute;inset:0;background:#2e1836;opacity:.20}.super .scene:before{opacity:.36}
	.spotlight{position:absolute;left:2%;top:-5%;width:70%;height:130%;background:#ffdf82;opacity:.28;clip-path:polygon(42% 0,58% 0,100% 100%,0 100%)}
	.assistant{position:absolute;height:280px;width:auto;right:5%;top:7px;filter:drop-shadow(3px 3px 0 #351a2166)}
	.hero-watch{position:absolute;left:10%;top:28px;width:125px;height:133px;animation:watch-sway 4s ease-in-out infinite;transform-origin:50% 10%}.hero-watch img{width:100%;height:100%;object-fit:contain}.hero-watch strong{position:absolute;left:0;right:0;top:55%;transform:translateY(-50%);text-align:center;font:30px/1 var(--gb-display-font);color:#5b3218}
	.super .hero-watch{animation-delay:-1.3s}.show-tag{position:absolute;top:10px;left:10px;font:9px var(--gb-display-font);letter-spacing:.1em;color:#fff3cf;background:#5e1630;padding:5px 9px;border-radius:4px}.super .show-tag{background:#533571}
	.spin-stub{position:absolute;right:9px;bottom:9px;display:flex;align-items:center;gap:6px;background:#ffda75;border:2px solid #7e4b23;border-radius:6px;padding:3px 9px;box-shadow:2px 2px 0 #351a2155}.spin-stub strong{font:28px var(--gb-display-font)}.spin-stub span{font:9px var(--gb-display-font);max-width:38px;line-height:1.4}
	.ticket-body{padding:15px 19px 10px}.ticket h3{color:#831c32!important;font-size:22px!important;line-height:1.15;margin:0 0 8px;text-align:center}.super h3{color:#62377b!important}
	.watch-range{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;background:#f4e2b6;border-radius:5px;font-size:10px;font-weight:bold}.watch-range strong{font:17px var(--gb-display-font);white-space:nowrap}
	.formula{display:flex;align-items:center;justify-content:center;gap:8px;margin:13px 0 9px}.formula span,.formula b{display:grid;place-items:center;min-width:42px;height:31px;background:#efd59c;border:1px solid #b68b4b;border-radius:6px;font:18px var(--gb-display-font)}.formula b{background:#8a2034;color:#fff0c0;border-color:#571526}.super .formula b{background:#63377d}.formula i{font-size:13px;font-style:normal;color:#8e6b4e}
	.ticket p{font-size:12px;line-height:1.5;text-align:center;margin:0 0 12px;min-height:36px}.ticket-divider{display:flex;align-items:center;gap:8px;margin:10px -19px 12px;padding:8px 19px;border-top:1px dashed #b89056;border-bottom:1px dashed #b89056;font-size:11px}.ticket-divider span{flex:1;border-top:1px solid #d5b987}.ticket-divider b{white-space:nowrap}
	.enter{width:100%;border:2px solid #531627;border-radius:8px;background:#94243b;color:#ffedbd;padding:9px 12px;cursor:pointer;box-shadow:0 3px 0 #531627;display:flex;align-items:center;justify-content:space-between;gap:10px;transition:background .15s,transform .15s;font-family:var(--gb-display-font)}.enter span{font-size:12px}.enter strong{font-size:21px;white-space:nowrap;font-weight:400}.super .enter{background:#663984;border-color:#402050;box-shadow:0 3px 0 #402050}.enter:hover:enabled{background:#b53647}.super .enter:hover:enabled{background:#855096}.enter:active:enabled{transform:translateY(2px);box-shadow:none}.enter:disabled{background:#b6a68d;color:#5a5147;border-color:#8a7b67;box-shadow:0 3px 0 #8a7b67;cursor:default}
	.card-foot{display:flex;justify-content:space-between;gap:8px;margin-top:9px;font-size:8px;font-weight:bold;letter-spacing:.03em;color:#785e4c}.hm-feature footer{padding:0 26px 15px;display:flex;gap:7px;align-items:center;font-size:10px}.hm-feature footer strong{font:15px var(--gb-display-font)}.hm-feature footer span{margin-left:auto;font-size:8px;letter-spacing:.06em}
	@keyframes watch-sway{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
	@media(max-width:600px){.hm-feature{width:calc(100vw - 30px);max-height:calc(100dvh - 55px)}.marquee{padding:23px 14px 13px;gap:10px}.heading h2{font-size:24px!important}.heading .eyebrow{font-size:9px}.heading p{font-size:8px}.amount{padding:6px;letter-spacing:0}.amount :global(.amount){font-size:16px}.amount :global(.toggle-wrap){gap:4px}.tickets{grid-template-columns:1fr;padding:15px;gap:17px}.scene{height:160px}.assistant{height:245px;right:10%}.hero-watch{left:12%;top:18px;width:112px;height:120px}.ticket-body{padding:13px 17px 11px}.ticket h3{font-size:21px!important}.ticket-divider{margin-left:-17px;margin-right:-17px;padding-left:17px;padding-right:17px}.hm-feature footer{padding:0 15px 14px;flex-wrap:wrap}.hm-feature footer span{width:100%;margin:0}.card-foot{font-size:9px}}
	@media(max-height:500px) and (min-width:601px){.marquee{padding-top:17px;padding-bottom:9px}.heading h2{font-size:22px!important}.tickets{padding:12px;gap:12px}.scene{height:90px}.assistant{height:160px;top:0}.hero-watch{height:83px;width:83px;top:3px}.hero-watch strong{font-size:23px}.spin-stub strong{font-size:20px}.ticket-body{padding:9px 12px}.ticket h3{font-size:17px!important}.formula{margin:7px 0}.ticket p{font-size:11px;margin-bottom:6px}.ticket-divider{margin:6px -12px;padding:5px 12px}.enter{padding:6px 9px}.enter strong{font-size:17px}.card-foot{font-size:7px}.hm-feature footer{padding-bottom:9px}}
	@media(prefers-reduced-motion:reduce){.hero-watch{animation:none}}
	@media(max-height:420px){.hm-feature{max-height:calc(100dvh - 40px)}.marquee{padding:9px 12px;gap:8px}.lights,.heading .eyebrow,.heading p{display:none}.heading h2{font-size:18px!important}.amount{padding:3px 5px;gap:1px;font-size:8px}.amount :global(.amount){font-size:14px}.tickets{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:8px}.scene,.formula,.ticket p,.watch-range,.ticket-divider,.card-foot{display:none}.ticket-body{padding:8px}.ticket h3{font-size:13px!important;margin-bottom:6px}.enter{flex-direction:column;gap:3px;padding:5px}.enter span{font-size:9px}.enter strong{font-size:15px}.hm-feature footer{padding:0 10px 7px;font-size:9px}.hm-feature footer strong{font-size:11px}.hm-feature footer span{display:none}}
</style>
