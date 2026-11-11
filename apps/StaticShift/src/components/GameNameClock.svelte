<script lang="ts">
	// The clock and game name top-left, in the game's own inks.
	//
	// The shared UiGameName draws them in white, which on this game's cream
	// paper sky (the base game, and the whole top of the portrait layout) was
	// close to invisible. Ink with a paper rim reads on the cream sky AND on the
	// free game's dark green — same clock, same placement as the shared one.
	import { SvelteDate } from 'svelte/reactivity';
	import { Text, REM } from 'pixi-svelte';
	import { uiTheme } from 'components-ui-pixi';
	import { getContext } from '../game/context';

	type Props = { name: string };
	const props: Props = $props();
	const context = getContext();
	// In a small landscape pop-out (400×225) this fixed-size line reached past
	// the frame's top-left corner onto its nameplate bar (2026-11-05 frame art
	// is taller). The clock stays; the name goes, like the top-right logo below
	// 760px (Game.svelte). Portrait keeps both: the line sits above the cast.
	const showName = $derived(
		context.stateLayoutDerived.layoutType() === 'portrait' || context.stateLayoutDerived.canvasSizes().width >= 760,
	);

	const reactiveDate = new SvelteDate();
	const clock = $derived(
		reactiveDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: false }),
	);
	const style = {
		fontFamily: '"Archivo", sans-serif',
		fontSize: REM * 1.2,
		fontWeight: uiTheme.fontWeight,
		lineHeight: REM * 2,
		fill: 0x15191f,
		stroke: { color: 0xe5e2d6, width: 3, join: 'round' },
	} as const;

	let clockSizes = $state({ width: 0, height: 0 });
	$effect(() => {
		// once a second is all a minute clock needs; not an animation
		const id = setInterval(() => reactiveDate.setTime(Date.now()), 1000);
		return () => clearInterval(id);
	});
</script>

<Text text={clock} onresize={(value) => (clockSizes = value)} {style} />
{#if showName}<Text text={props.name} x={clockSizes.width + 16} {style} />{/if}
