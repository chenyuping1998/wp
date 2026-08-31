<script lang="ts">
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';

	import { stateBet } from 'state-shared';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import UiLabel from './UiLabel.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';
	import { uiTheme } from '../theme.svelte';

	type Props = {
		stacked?: boolean;
		// Draw the framed plate behind the readout. On by default so every existing
		// layout is unchanged; the compact bottom bar turns it off, because there the
		// whole strip is one frame and a plate per readout is a box inside a box.
		tiled?: boolean;
		// the cell this readout must stay inside — see UiLabel
		maxWidth?: number;
	};

	const props: Props = $props();
	const winBookEventAmountTween = new Tween(stateBet.winBookEventAmount);
	const label = $derived(i18nDerived.win());
	const value = $derived(bookEventAmountToCurrencyString(winBookEventAmountTween.current));

	$effect(() => {
		winBookEventAmountTween.set(stateBet.winBookEventAmount);
	});

	// win reaction: flash the panel green→bright the moment a new win lands, then
	// ease back — a position-safe colour pulse so the bar answers a hit
	const WIN_BASE = $derived(uiTheme.winAccent);
	let flash = $state(0);
	let prevWin = 0;
	$effect(() => {
		const w = stateBet.winBookEventAmount;
		if (w > prevWin) flash = 1;
		prevWin = w;
	});
	onMount(() => {
		let raf = 0;
		const tick = () => {
			if (flash > 0.001) flash *= 0.9;
			else flash = 0;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
	const lerpHex = (a: number, b: number, t: number) => {
		const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
		const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
		const r = Math.round(ar + (br - ar) * t);
		const g = Math.round(ag + (bg - ag) * t);
		const bl = Math.round(ab + (bb - ab) * t);
		return (r << 16) | (g << 8) | bl;
	};
	const accent = $derived(
		flash < 0.02
			? WIN_BASE
			: {
					border: lerpHex(WIN_BASE.border, 0xffffff, flash * 0.75),
					label: lerpHex(WIN_BASE.label, 0xffffff, flash * 0.75),
				},
	);
</script>

<UiLabel tiled={props.tiled ?? true} {label} {value} stacked={props.stacked} {accent} maxWidth={props.maxWidth} />
