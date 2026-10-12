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

	type Props = { name: string };
	const props: Props = $props();

	const reactiveDate = new SvelteDate();
	const clock = $derived(
		reactiveDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: false }),
	);
	const style = {
		fontFamily: uiTheme.fontFamily,
		fontSize: REM * 1.5,
		fontWeight: uiTheme.fontWeight,
		lineHeight: REM * 2,
		fill: 0x1e1b1a,
		stroke: { color: 0xefeadc, width: 5, join: 'round' },
	} as const;

	let clockSizes = $state({ width: 0, height: 0 });
	$effect(() => {
		// once a second is all a minute clock needs; not an animation
		const id = setInterval(() => reactiveDate.setTime(Date.now()), 1000);
		return () => clearInterval(id);
	});
</script>

<Text text={clock} onresize={(value) => (clockSizes = value)} {style} />
<Text text={props.name} x={clockSizes.width + 5} {style} />
