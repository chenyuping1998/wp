<script lang="ts">
	/**
	 * The top-left clock + game name, in this game's ink.
	 *
	 * Same layout as the shared UiGameName (components-ui-pixi), whose fill is a
	 * hard-coded WHITE: on Wild Alchemy's parchment backdrop white type all but
	 * vanished. Kept in the app so the shared package stays untouched.
	 */
	import { SvelteDate } from 'svelte/reactivity';
	import { Text, REM } from 'pixi-svelte';
	import { uiTheme } from 'components-ui-pixi';

	type Props = { name: string };
	const props: Props = $props();

	/** dark-brown ink of the plates' outlines; a paper-tone edge keeps it legible over a darker patch */
	const INK = 0x3b2414;
	const PAPER_EDGE = 0xf2e4c4;

	const reactiveDate = new SvelteDate();
	const clock = $derived(reactiveDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: false }));
	const textProps = {
		style: {
			fontFamily: uiTheme.fontFamily,
			fontSize: REM * 1.5,
			fontWeight: uiTheme.fontWeight,
			lineHeight: REM * 2,
			fill: INK,
			stroke: { color: PAPER_EDGE, width: 3 },
		},
	} as const;

	let clockSizes = $state({ width: 0, height: 0 });

	$effect(() => {
		const interval = setInterval(() => reactiveDate.setTime(Date.now()), 1000);
		return () => clearInterval(interval);
	});
</script>

<Text text={clock} onresize={(value) => (clockSizes = value)} {...textProps} />
<Text text={props.name} x={clockSizes.width + 5} {...textProps} />
