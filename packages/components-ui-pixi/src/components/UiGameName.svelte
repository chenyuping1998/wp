<script lang="ts">
	import { SvelteDate } from 'svelte/reactivity';

	import { Text, REM } from 'pixi-svelte';
	import { WHITE } from 'constants-shared/colors';
	import { uiTheme } from '../theme.svelte';

	type Props = {
		name: string;
	};

	const props: Props = $props();
	const reactiveDate = new SvelteDate();
	const clock = $derived(
		reactiveDate.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: 'numeric',
			hour12: false,
		}),
	);
	const textProps = {
		style: {
			fontFamily: uiTheme.fontFamily,
			fontSize: REM * 1.5,
			fontWeight: uiTheme.fontWeight,
			lineHeight: REM * 2,
			fill: WHITE,
		},
	} as const;

	let clockSizes = $state({ width: 0, height: 0 });
	// The name sits after the clock. It was placed off `onresize` alone, which
	// can report nothing — and then the name was drawn straight over the clock
	// ("19:00GO BANANAS BOAT", Stake review 2026-10-04, Mobile S). Measured
	// as well, and the larger of the two used, so it cannot overlap whichever
	// arrives first; where onresize works the two agree and nothing moves.
	// (the browser's own canvas measure: this package does not depend on
	// pixi.js at runtime)
	let measureCtx: CanvasRenderingContext2D | null = null;
	const measure = (text: string) => {
		if (typeof document === 'undefined') return 0;
		measureCtx ??= document.createElement('canvas').getContext('2d');
		if (!measureCtx) return 0;
		const st = textProps.style;
		measureCtx.font = `${st.fontWeight ?? 'normal'} ${st.fontSize}px ${st.fontFamily}`;
		return measureCtx.measureText(text).width;
	};
	const clockWidth = $derived(Math.max(clockSizes.width, measure(clock)));

	$effect(() => {
		const interval = setInterval(() => {
			reactiveDate.setTime(Date.now());
		}, 1000);

		return () => {
			clearInterval(interval);
		};
	});
</script>

<Text text={clock} onresize={(value) => (clockSizes = value)} {...textProps} />
<Text text={props.name} x={clockWidth + 5} {...textProps} />
