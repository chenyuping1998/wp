<script lang="ts">
	/**
	 * Greys the BET caption and its chevron while the stake cannot be changed: a
	 * round is running and the bet menu will not open, so the readout must not
	 * look pressable. Both are drawn in uiTheme.betAccent.label by the shared
	 * readout, so this swaps that one colour — nothing in wp/packages changes.
	 * Draws nothing itself.
	 */
	import { onMount } from 'svelte';
	import { uiTheme } from 'components-ui-pixi';
	import { stateReplay } from 'state-shared';

	import { getContext } from '../game/context';

	// what the disabled steppers turn to
	const LOCKED = 0x67645c;
	const context = getContext();
	// Portrait uses cream stone plaques; desktop uses the dark teal console.
	const original={labelFill:uiTheme.labelFill,balanceLabelFill:uiTheme.balanceLabelFill,valueFill:uiTheme.valueFill,valueStroke:uiTheme.valueStroke,valueShadow:uiTheme.valueShadow};
	const normal = uiTheme.betAccent.label,normalWin=uiTheme.winAccent.label;
	const locked = $derived(!stateReplay.enabled && !context.stateXstateDerived.isIdle());

	$effect(() => {
		const portrait=context.stateLayoutDerived.layoutType()==='portrait';
		const palette=portrait?{labelFill:0x173a40,balanceLabelFill:0x173a40,valueFill:0x102f36,valueStroke:0xfff6df,valueShadow:0xd6c28e}:original;
		if((Object.keys(palette) as (keyof typeof original)[]).some(key=>uiTheme[key]!==palette[key]))Object.assign(uiTheme,palette);
		const win=portrait?0x86451c:normalWin;
		if(uiTheme.winAccent.label!==win)uiTheme.winAccent={...uiTheme.winAccent,label:win};
		const label = locked ? LOCKED : portrait?0x173a40:normal;
		if (uiTheme.betAccent.label !== label) uiTheme.betAccent = { ...uiTheme.betAccent, label };
	});

	onMount(() => () => {
		uiTheme.betAccent = { ...uiTheme.betAccent, label: normal };
		uiTheme.winAccent={...uiTheme.winAccent,label:normalWin};
		Object.assign(uiTheme,original);
	});
</script>
