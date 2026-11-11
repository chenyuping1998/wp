<script lang="ts">
	import { BUY_ICON } from '../../game/buyIcon';
	/**
	 * The bet bar's controls as small inline SVGs for the rules page's controls
	 * guide, so what the player reads matches what is on the bar. The bar is v3
	 * (ui/MummyBar.svelte, after Mummy Mayhem): the yellow buy tile, then one
	 * dark console holding the menu bars, the BALANCE readout, the BET box with
	 * its level track, the ▲/▼ chevrons, Spin, and Auto Spin over Turbo. The
	 * shapes are copies of its drawing code — the crescent / bolt / chevron
	 * maths, the menu panel's glyph rows. Ported from Mummy Mayhem's BarIcon
	 * (2026-11-09) and extended for the rows Hypno's guide lists one by one.
	 */
	type Kind =
		| 'buy'
		| 'menu'
		| 'info'
		| 'paytable'
		| 'settings'
		| 'sfx'
		| 'music'
		| 'readout'
		| 'bet'
		| 'step'
		| 'spin'
		| 'auto'
		| 'turbo';
	const { kind, label = '' }: { kind: Kind; label?: string } = $props();

	const GOLD = '#e8b854';
	const INK = '#2a2620';
	const CONSOLE = '#1d5650';
	const BOX = '#123a36';
	const BAR_FONT = '"Nunito", "Arial Rounded MT Bold", "Segoe UI", Arial, sans-serif';

	// one refresh arrow: hairline tail thickening to a broad head (MummyBar crescent)
	const crescent = (r: number, a0: number, a1: number, wMax: number) => {
		const N = 28;
		const outer: string[] = [];
		const inner: string[] = [];
		for (let i = 0; i <= N; i++) {
			const k = i / N;
			const a = a0 + (a1 - a0) * k;
			const w = wMax * (0.07 + 0.93 * Math.pow(k, 0.6));
			outer.push(`${(Math.cos(a) * (r + w / 2)).toFixed(2)},${(Math.sin(a) * (r + w / 2)).toFixed(2)}`);
			inner.unshift(`${(Math.cos(a) * (r - w / 2)).toFixed(2)},${(Math.sin(a) * (r - w / 2)).toFixed(2)}`);
		}
		const span = wMax * 0.92;
		const tipA = a1 - (wMax * 1.45) / r;
		const head = [
			`${(Math.cos(a1) * (r + span)).toFixed(2)},${(Math.sin(a1) * (r + span)).toFixed(2)}`,
			`${(Math.cos(a1) * (r - span)).toFixed(2)},${(Math.sin(a1) * (r - span)).toFixed(2)}`,
			`${(Math.cos(tipA) * r).toFixed(2)},${(Math.sin(tipA) * r).toFixed(2)}`,
		];
		return [[...outer, ...inner].join(' '), head.join(' ')];
	};
	const refresh = (r: number) => [
		...crescent(r, -Math.PI * 0.1, -Math.PI * 0.8, r * 0.5),
		...crescent(r, Math.PI * 0.9, Math.PI * 0.2, r * 0.5),
	];
	const MENU_BARS = [-18, 0, 18];
	const bigArrows = refresh(27);
	const smallArrows = refresh(24);
	const BOLT = [0.12, -1, 0.62, -1, 0.22, -0.18, 0.58, -0.18, -0.32, 1, -0.06, 0.14, -0.44, 0.14];
	const bolt = Array.from({ length: BOLT.length / 2 }, (_, i) => `${BOLT[i * 2] * 26},${BOLT[i * 2 + 1] * 26}`).join(' ');
	// the menu panel's row glyphs (MummyBar menuRows / sliders)
	const GLYPH: Partial<Record<Kind, string>> = { info: 'i', paytable: '≡', settings: '⚙', music: '♪' };
</script>

<!-- the BALANCE readout is twice as wide as it is tall, everything else square -->
<svg viewBox={kind === 'readout' ? '-60 -30 120 60' : '-50 -50 100 100'} aria-hidden="true" class="bar-icon">
	{#if kind === 'buy'}
		<rect x="-46" y="-46" width="92" height="92" rx="14" fill={GOLD} stroke={INK} stroke-width="5" />
		<!-- the theme glyph (game/buyIcon.ts), at the bar's 0.72-of-tile size -->
		<g transform="scale(0.66)">
			{#each BUY_ICON as sh, i (i)}
				{#if 'c' in sh}
					<circle cx={sh.c[0]} cy={sh.c[1]} r={sh.c[2]} fill={sh.fill === 'ink' ? INK : GOLD} />
				{:else if 's' in sh}
					<path d={sh.s} fill="none" stroke={sh.fill === 'ink' ? INK : GOLD} stroke-width={sh.w} stroke-linecap="round" stroke-linejoin="round" />
				{:else}
					<path d={sh.d} fill={sh.fill === 'ink' ? INK : GOLD} />
				{/if}
			{/each}
		</g>
	{:else if kind === 'menu'}
		<!-- the three bars at the console's left end -->
		<rect x="-46" y="-46" width="92" height="92" rx="16" fill={CONSOLE} />
		{#each MENU_BARS as y (y)}
			<rect x="-24" y={y - 4} width="48" height="8" rx="4" fill="#e8e8e8" />
		{/each}
	{:else if kind === 'sfx'}
		<!-- the effects-volume row: a drawn loudspeaker, as the bar draws it -->
		<rect x="-46" y="-46" width="92" height="92" rx="16" fill={CONSOLE} />
		<g transform="scale(2.1)" fill="#fdf6e3" stroke="#fdf6e3">
			<polygon points="-11,-4 -6,-4 0,-10 0,10 -6,4 -11,4" stroke="none" />
			<path d="M 6.02 -3.75 A 5.5 5.5 0 0 1 6.02 3.75" fill="none" stroke-width="2.4" stroke-linecap="round" />
			<path d="M 9.32 -6.82 A 10 10 0 0 1 9.32 6.82" fill="none" stroke-width="2.4" stroke-linecap="round" />
		</g>
	{:else if GLYPH[kind]}
		<!-- a row of the menu panel: its glyph on the console's colour -->
		<rect x="-46" y="-46" width="92" height="92" rx="16" fill={CONSOLE} />
		<text x="0" y="3" text-anchor="middle" dominant-baseline="middle" font-family={BAR_FONT} font-weight="800" font-size="52" fill="#fdf6e3">{GLYPH[kind]}</text>
	{:else if kind === 'readout'}
		<!-- BALANCE on the console: gold label over a white amount -->
		<rect x="-57" y="-27" width="114" height="54" rx="10" fill={CONSOLE} />
		<text x="-44" y="-8" dominant-baseline="middle" font-family={BAR_FONT} font-weight="800" font-size="17" fill={GOLD}>{label}</text>
		<rect x="-44" y="5" width="72" height="10" rx="5" fill="#fdf6e3" />
	{:else if kind === 'bet'}
		<!-- the BET box on the console: label, amount, level track along its foot -->
		<rect x="-46" y="-46" width="92" height="92" rx="16" fill={CONSOLE} />
		<rect x="-38" y="-28" width="76" height="56" rx="6" fill={BOX} />
		<text x="0" y="-12" text-anchor="middle" dominant-baseline="middle" font-family={BAR_FONT} font-weight="800" font-size={label.length > 4 ? 13 : 18} fill={GOLD}>{label}</text>
		<rect x="-22" y="2" width="44" height="9" rx="4.5" fill="#fdf6e3" />
		<rect x="-38" y="21" width="76" height="5" rx="2.5" fill="#2a2a2a" />
		<rect x="-38" y="21" width="30" height="5" rx="2.5" fill="#fdf6e3" />
	{:else if kind === 'step'}
		<!-- ▲ over ▼, white chevrons on the console -->
		<rect x="-46" y="-46" width="92" height="92" rx="16" fill={CONSOLE} />
		<path d="M-14 -10 L0 -24 L14 -10" fill="none" stroke="#fdf6e3" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
		<path d="M-14 10 L0 24 L14 10" fill="none" stroke="#fdf6e3" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
	{:else}
		<circle r="45" fill="#fdf6e3" stroke={INK} stroke-width="6" />
		{#if kind === 'spin'}
			{#each bigArrows as pts, i (i)}<polygon points={pts} fill={INK} />{/each}
		{:else if kind === 'auto'}
			{#each smallArrows as pts, i (i)}<polygon points={pts} fill={INK} />{/each}
			<polygon points="-6,-10 11,0 -6,10" fill={INK} />
		{:else}
			<polygon points={bolt} fill={INK} />
		{/if}
	{/if}
</svg>

<style>
	.bar-icon {
		width: 100%;
		height: 100%;
		display: block;
	}
</style>
