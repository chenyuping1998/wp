<script lang="ts" generics="T extends string | number">
	import { getContext } from '../../game/context';
	const props = $props<{label:string;value:T;options:Readonly<T[]>;onchange:(value:T)=>void;format?:(value:T)=>string}>();
	const context=getContext();
</script>

<div class="medusa-choice-grid" role="group" aria-label={props.label}>
	{#each props.options as option (option)}
		<button type="button" class:selected={option===props.value} aria-pressed={option===props.value}
			onclick={()=>{props.onchange(option);context.eventEmitter.broadcast({type:'soundInterface',cue:'tab'});}}>
			<span>{props.format?.(option)??String(option)}</span>
			{#if option===props.value}<span class="check" aria-hidden="true">✓</span>{/if}
		</button>
	{/each}
</div>

<style>
	.medusa-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;width:min(420px,75vw);padding:5px;box-sizing:border-box}
	button{position:relative;min-height:44px;padding:8px 22px;border:2px solid #567b7b;border-radius:9px;background:#173a40;color:#fffaf0;font:700 17px var(--gb-body-font, sans-serif);cursor:pointer;box-shadow:0 3px 0 #0b242a;transition:background .12s,border-color .12s,box-shadow .12s,transform .12s}
	button:hover,button:focus-visible{background:#265e62;border-color:#ffe08a;box-shadow:0 0 0 2px #ffe08a66,0 3px 0 #0b242a;outline:none;transform:translateY(-1px)}
	button.selected{background:#ffd66b;color:#102f36;border-color:#fff2bc;box-shadow:0 0 0 2px #b77e28,0 0 16px #eabf5666,0 3px 0 #88621e}
	button:active{transform:translateY(2px)}
	.check{position:absolute;right:6px;top:4px;font-size:13px;color:#173a40}
	@media(max-width:370px){button{font-size:15px;padding:8px 14px}.medusa-choice-grid{gap:8px;width:78vw}}
	@media(max-height:480px){.medusa-choice-grid{grid-template-columns:repeat(4,minmax(0,1fr));width:min(540px,80vw)}}
</style>
