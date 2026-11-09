<script lang="ts">
	import { BUY_ICON } from '../../game/buyIcon';
	/**
	 * The bet bar's controls as small inline SVGs for the rules page's controls
	 * guide, so what the player reads matches what is on the bar. The bar is
	 * v4 (ui/SplitBar.svelte, template wp/tools/ui-bar-v4); the shapes below are
	 * copies of its drawing code — the crescent / bolt / chevron maths, the
	 * round glass menu button, the stacked steppers, the readout plates and the
	 * menu panel's glyph rows. Ported from Volt Monster's BarIcon (2026-11-09)
	 * and extended for the rows Hypno's guide lists one by one.
	 */
	type Kind =
		| 'buy'
		| 'menu'
		| 'info'
		| 'paytable'
		| 'settings'
		| 'sfx'
		| 'music'
		| 'plate'
		| 'step'
		| 'spin'
		| 'auto'
		| 'turbo';
	const { kind, label = '', levelLine = false }: { kind: Kind; label?: string; levelLine?: boolean } = $props();

	const GOLD = '#ecc254';
	const INK = '#0a0804';
	// the bar's glass (PLATE 0x172329 at 0.78 over the scene), opaque here
	const GLASS = '#1d2a31';
	const GLASS_EDGE = '#2b3a42';
	const BAR_FONT = '"Nunito", "Arial Rounded MT Bold", "Segoe UI", Arial, sans-serif';

	// one refresh arrow: hairline tail thickening to a broad head (SplitBar crescent)
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
	const bigArrows = refresh(27);
	const smallArrows = refresh(24);
	const BOLT = [0.12, -1, 0.62, -1, 0.22, -0.18, 0.58, -0.18, -0.32, 1, -0.06, 0.14, -0.44, 0.14];
	const bolt = Array.from({ length: BOLT.length / 2 }, (_, i) => `${BOLT[i * 2] * 26},${BOLT[i * 2 + 1] * 26}`).join(' ');
	// the menu panel's row glyphs (SplitBar menuRows / sliders)
	const GLYPH: Partial<Record<Kind, string>> = { info: 'i', paytable: '≡', settings: '⚙', music: '♪' };
</script>

<!-- a readout plate is twice as wide as it is tall, everything else square -->
<svg viewBox={kind === 'plate' ? '-60 -30 120 60' : '-50 -50 100 100'} aria-hidden="true" class="bar-icon">
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
		<!-- round glass button, three bars -->
		<circle r="44" fill={GLASS} stroke={GLASS_EDGE} stroke-width="2" />
		{#each [-16, 0, 16] as y (y)}
			<rect x="-24" y={y - 3.5} width="48" height="7" rx="3.5" fill="#e8e8e8" />
		{/each}
	{:else if kind === 'sfx'}
		<!-- the effects-volume row: a drawn loudspeaker, as the bar draws it -->
		<rect x="-46" y="-46" width="92" height="92" rx="14" fill={GLASS} stroke={GLASS_EDGE} stroke-width="2" />
		<g transform="scale(2.1)" fill="#fff" stroke="#fff">
			<polygon points="-11,-4 -6,-4 0,-10 0,10 -6,4 -11,4" stroke="none" />
			<path d="M 6.02 -3.75 A 5.5 5.5 0 0 1 6.02 3.75" fill="none" stroke-width="2.4" stroke-linecap="round" />
			<path d="M 9.32 -6.82 A 10 10 0 0 1 9.32 6.82" fill="none" stroke-width="2.4" stroke-linecap="round" />
		</g>
	{:else if GLYPH[kind]}
		<!-- a row of the menu panel: its glyph on the panel's glass -->
		<rect x="-46" y="-46" width="92" height="92" rx="14" fill={GLASS} stroke={GLASS_EDGE} stroke-width="2" />
		<text x="0" y="3" text-anchor="middle" dominant-baseline="middle" font-family={BAR_FONT} font-weight="800" font-size={kind === 'sfx' ? 40 : 52} fill="#fff">{GLYPH[kind]}</text>
	{:else if kind === 'plate'}
		<!-- a readout plate (BALANCE / WIN / BET): dark glass, gold caption -->
		<rect x="-57" y="-27" width="114" height="54" rx="10" fill={GLASS} stroke={GLASS_EDGE} stroke-width="2" />
		<text x="0" y={levelLine ? -4 : 1} text-anchor="middle" dominant-baseline="middle" font-family={BAR_FONT} font-weight="900" font-size="24" fill={GOLD}>{label}</text>
		{#if levelLine}
			<!-- the bet's level line along the plate's foot -->
			<rect x="-44" y="13" width="88" height="4" rx="2" fill="#ffffff44" />
			<rect x="-44" y="13" width="36" height="4" rx="2" fill={GOLD} />
		{/if}
	{:else if kind === 'step'}
		<!-- ▲ over ▼, each on its own small glass plate -->
		{#each [-1, 1] as dir (dir)}
			<g transform={`translate(0 ${dir * 24})`}>
				<rect x="-30" y="-20" width="60" height="40" rx="10" fill={GLASS} stroke={GLASS_EDGE} stroke-width="2" />
				<path d={dir < 0 ? 'M-12 5 L0 -6 L12 5' : 'M-12 -5 L0 6 L12 -5'} fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
			</g>
		{/each}
	{:else}
		<circle r="45" fill="#fff" stroke={INK} stroke-width="6" />
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
