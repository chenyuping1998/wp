<script lang="ts">
	import { pearlRules } from '../../game/pearlRules';
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
				<div class="heading"><span class="eyebrow">DRAGON TIDE</span><h2>{social?'FEATURES':'BUY BONUS'}</h2><p>CHOOSE YOUR TIDE</p></div>
				<div class="amount"><span>{social?'PLAY AMOUNT':'BET AMOUNT'}</span><BetMenuAmountToggle/></div>
			</header>
			<div class="tickets">
				{#each modes as mode (mode.mode)}
					{@const superMode=mode.mode==='SUPER_BONUS'}
					{@const cfg=superMode?config.betModes.super_bonus:config.betModes.bonus}
					{@const values=superMode?pearlRules.superValues:pearlRules.values}
					{@const min=Math.min(...values)}
					{@const max=Math.max(...values)}
					{@const canBuy=affordable(mode.costMultiplier)}
					<section class="ticket" class:super={superMode}>
						<div class="scene" style:background-image={`url('${art(superMode?'dragonBackground/bg_free.jpg':'dragonBackground/bg_base.jpg')}')`}>
							<div class="spotlight"></div>
							<img class="assistant" src={art(superMode?'dragonArt/buy_super.png':'dragonArt/buy_fg.png')} alt=""/>
							<div class="hero-pearl"><img src={art(`dragonArt/pearl_${superMode?'t5':'t1'}.png`)} alt=""/><strong>×{min}</strong></div>
							<span class="show-tag">{superMode?'THE DEEP PALACE':'THE DRAGON TIDE'}</span>
							<div class="spin-stub"><strong>{config.freeSpins.spins}</strong><span>FREE SPINS</span></div>
						</div>
						<div class="ticket-body">
							<h3>{superMode?'SUPER FREE SPINS':'FREE SPINS'}</h3>
							<div class="watch-range">PEARL VALUES <strong>×{min} – ×{max}</strong></div>
							<div class="formula" aria-label="Pearl multipliers add together"><span>×{min}</span><i>+</i><span>×{superMode?25:5}</span><i>=</i><b>×{min+(superMode?25:5)}</b></div>
							<p>Pearls on a winning spin add to the TOTAL.<br/>{superMode?`Every pearl is ×${min} or more.`:'The total stays for the whole feature.'}</p>
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
			<footer>MAX WIN <strong>{config.betModes.base.max_win.toLocaleString()}×</strong><span>PEARLS MULTIPLY A WINNING SPIN</span></footer>
		</div>
	</Popup>
{/if}

<style>
	.extra{display:grid;grid-template-columns:1fr auto auto;gap:16px;align-items:center;margin:0 26px 14px;padding:12px 16px;border:2px solid #2f6d66;border-radius:11px;background:#fbf4e3;box-shadow:0 4px 0 #b9cdbf}
	.extra.on{border-color:#2f7d5b;background:#e3f2ea}
	.extra h3{margin:0;font:18px var(--gb-display-font);color:#1d4a44}.extra p{margin:3px 0 0;font-size:12px}
	.extra-cost{display:flex;flex-direction:column;align-items:flex-end;font-size:11px}.extra-cost b{font:15px var(--gb-display-font)}
	.extra-toggle{min-width:118px;padding:10px 14px;border:2px solid #16302d;border-radius:9px;background:#2f6d66;color:#fff2d6;font:14px var(--gb-display-font);cursor:pointer}
	.extra.on .extra-toggle{background:#b07a1e}
	@media (max-width:640px){.extra{grid-template-columns:1fr;text-align:center}.extra-cost{align-items:center}}
	.hm-feature{--ink:#16302d;--gold:#e8b84a;width:min(900px,calc(100vw - 44px));max-height:calc(100dvh - 62px);overflow:auto;box-sizing:border-box;border:3px solid var(--gold);border-radius:18px;background:#f3ecd8;color:var(--ink);box-shadow:0 8px 0 #16302d;font-family:var(--gb-body-font);position:relative;z-index:100}
	.marquee{position:relative;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:20px 30px 16px;background:#24524d;border-bottom:4px solid var(--gold);color:#fff2d6}
	.heading .eyebrow{font:11px var(--gb-display-font);letter-spacing:.18em}.heading h2{margin:3px 0;color:#ffd36a!important;font-size:30px!important;line-height:1}.heading p{margin:5px 0 0;font-size:10px;letter-spacing:.18em}
	.amount{display:flex;flex-direction:column;gap:5px;align-items:center;font-size:10px;letter-spacing:.1em;padding:9px 14px;border:1px solid #c99746;border-radius:9px;background:#16302d}
	.amount :global(.amount){font:20px var(--gb-display-font);letter-spacing:0}.amount :global(.toggle-wrap){gap:10px}
	.tickets{display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:22px 26px 16px}.ticket{min-width:0;border:2px solid #2f6d66;border-radius:11px;background:#fbf4e3;overflow:hidden;box-shadow:0 4px 0 #b9cdbf}.ticket.super{border-color:#b07a1e;box-shadow:0 4px 0 #dcc28a}
	.scene{height:185px;background-size:cover;background-position:center;position:relative;overflow:hidden;border-bottom:3px solid #e8b84a;background-color:#9ccfc4}
	.scene:before{content:'';position:absolute;inset:0;background:#1d4a44;opacity:.12}.super .scene:before{opacity:.2}
	.spotlight{position:absolute;left:2%;top:-5%;width:70%;height:130%;background:#eafffb;opacity:.22;clip-path:polygon(42% 0,58% 0,100% 100%,0 100%)}
	.assistant{position:absolute;height:178px;width:auto;right:5%;bottom:2px;filter:drop-shadow(3px 3px 0 #16302d55)}
	.hero-pearl{position:absolute;left:10%;top:22px;width:133px;height:133px;animation:pearl-bob 4s ease-in-out infinite}.hero-pearl img{width:100%;height:100%;object-fit:contain}.hero-pearl strong{position:absolute;left:0;right:0;top:58.6%;transform:translateY(-50%);text-align:center;font:30px/1 var(--gb-display-font);color:#ffd84a;-webkit-text-stroke:5px #5a1008;paint-order:stroke fill}
	.super .hero-pearl{animation-delay:-1.3s}.show-tag{position:absolute;top:10px;left:10px;font:9px var(--gb-display-font);letter-spacing:.1em;color:#fff2d6;background:#24524d;padding:5px 9px;border-radius:4px}.super .show-tag{background:#8a5a12}
	.spin-stub{position:absolute;left:9px;bottom:9px;display:flex;align-items:center;gap:6px;background:#ffe6a3;border:2px solid #8a5a12;border-radius:6px;padding:3px 9px;box-shadow:2px 2px 0 #16302d55}.spin-stub strong{font:28px var(--gb-display-font)}.spin-stub span{font:9px var(--gb-display-font);max-width:38px;line-height:1.4}
	.ticket-body{padding:15px 19px 10px}.ticket h3{color:#1d4a44!important;font-size:22px!important;line-height:1.15;margin:0 0 8px;text-align:center}.super h3{color:#8a5a12!important}
	.watch-range{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;background:#e3efe6;border-radius:5px;font-size:10px;font-weight:bold}.watch-range strong{font:17px var(--gb-display-font);white-space:nowrap}
	.formula{display:flex;align-items:center;justify-content:center;gap:8px;margin:13px 0 9px}.formula span,.formula b{display:grid;place-items:center;min-width:42px;height:31px;background:#f1e2b8;border:1px solid #b68b4b;border-radius:6px;font:18px var(--gb-display-font)}.formula b{background:#2f6d66;color:#fff2d6;border-color:#16302d}.super .formula b{background:#b07a1e;border-color:#6e4a0c}.formula i{font-size:13px;font-style:normal;color:#5d7a72}
	.ticket p{font-size:12px;line-height:1.5;text-align:center;margin:0 0 12px;min-height:36px}.ticket-divider{display:flex;align-items:center;gap:8px;margin:10px -19px 12px;padding:8px 19px;border-top:1px dashed #9fbdb3;border-bottom:1px dashed #9fbdb3;font-size:11px}.ticket-divider span{flex:1;border-top:1px solid #c6d9d0}.ticket-divider b{white-space:nowrap}
	.enter{width:100%;border:2px solid #16302d;border-radius:8px;background:#2f6d66;color:#fff2d6;padding:9px 12px;cursor:pointer;box-shadow:0 3px 0 #16302d;display:flex;align-items:center;justify-content:space-between;gap:10px;transition:background .15s,transform .15s;font-family:var(--gb-display-font)}.enter span{font-size:12px}.enter strong{font-size:21px;white-space:nowrap;font-weight:400}.super .enter{background:#b07a1e;border-color:#6e4a0c;box-shadow:0 3px 0 #6e4a0c}.enter:hover:enabled{background:#3f8a80}.super .enter:hover:enabled{background:#c99231}.enter:active:enabled{transform:translateY(2px);box-shadow:none}.enter:disabled{background:#b6a68d;color:#5a5147;border-color:#8a7b67;box-shadow:0 3px 0 #8a7b67;cursor:default}
	.card-foot{display:flex;justify-content:space-between;gap:8px;margin-top:9px;font-size:8px;font-weight:bold;letter-spacing:.03em;color:#4d6b64}.hm-feature footer{padding:0 26px 15px;display:flex;gap:7px;align-items:center;font-size:10px}.hm-feature footer strong{font:15px var(--gb-display-font)}.hm-feature footer span{margin-left:auto;font-size:8px;letter-spacing:.06em}
	@keyframes pearl-bob{0%,100%{transform:translateY(-3px)}50%{transform:translateY(3px)}}
	@media(max-width:600px){.hm-feature{width:calc(100vw - 30px);max-height:calc(100dvh - 55px)}.marquee{padding:23px 14px 13px;gap:10px}.heading h2{font-size:24px!important}.heading .eyebrow{font-size:9px}.heading p{font-size:8px}.amount{padding:6px;letter-spacing:0}.amount :global(.amount){font-size:16px}.amount :global(.toggle-wrap){gap:4px}.tickets{grid-template-columns:1fr;padding:15px;gap:17px}.scene{height:160px}.assistant{height:155px;right:8%}.hero-pearl{left:12%;top:16px;width:116px;height:116px}.ticket-body{padding:13px 17px 11px}.ticket h3{font-size:21px!important}.ticket-divider{margin-left:-17px;margin-right:-17px;padding-left:17px;padding-right:17px}.hm-feature footer{padding:0 15px 14px;flex-wrap:wrap}.hm-feature footer span{width:100%;margin:0}.card-foot{font-size:9px}}
	@media(max-height:500px) and (min-width:601px){.marquee{padding-top:17px;padding-bottom:9px}.heading h2{font-size:22px!important}.tickets{padding:12px;gap:12px}.scene{height:90px}.assistant{height:88px;bottom:0}.hero-pearl{height:83px;width:83px;top:3px}.hero-pearl strong{font-size:23px}.spin-stub strong{font-size:20px}.ticket-body{padding:9px 12px}.ticket h3{font-size:17px!important}.formula{margin:7px 0}.ticket p{font-size:11px;margin-bottom:6px}.ticket-divider{margin:6px -12px;padding:5px 12px}.enter{padding:6px 9px}.enter strong{font-size:17px}.card-foot{font-size:7px}.hm-feature footer{padding-bottom:9px}}
	@media(prefers-reduced-motion:reduce){.hero-pearl{animation:none}}
	@media(max-height:420px){.hm-feature{max-height:calc(100dvh - 40px)}.marquee{padding:9px 12px;gap:8px}.heading .eyebrow,.heading p{display:none}.heading h2{font-size:18px!important}.amount{padding:3px 5px;gap:1px;font-size:8px}.amount :global(.amount){font-size:14px}.tickets{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:8px}.scene,.formula,.ticket p,.watch-range,.ticket-divider,.card-foot{display:none}.ticket-body{padding:8px}.ticket h3{font-size:13px!important;margin-bottom:6px}.enter{flex-direction:column;gap:3px;padding:5px}.enter span{font-size:9px}.enter strong{font-size:15px}.hm-feature footer{padding:0 10px 7px;font-size:9px}.hm-feature footer strong{font-size:11px}.hm-feature footer span{display:none}}
</style>
