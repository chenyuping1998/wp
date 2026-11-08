<script lang="ts">
	import { BUY_ICON } from '../../game/buyIcon';
	/**
	 * The v3 bet bar's controls as small inline SVGs, for the rules page's
	 * controls guide — so what the player reads matches what is on the bar
	 * (MummyBar.svelte draws the same shapes on the canvas; the geometry below is
	 * a copy of its crescent / bolt / chevron / pyramid maths).
	 */
	type Kind = 'buy' | 'menu' | 'bet' | 'spin' | 'auto' | 'turbo';
	const { kind }: { kind: Kind } = $props();

	const GOLD = '#ecc254';
	const INK = '#0a0804';
	const CONSOLE = '#172329';

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
</script>

<svg viewBox="-50 -50 100 100" aria-hidden="true" class="bar-icon">
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
		<rect x="-46" y="-46" width="92" height="92" rx="16" fill={CONSOLE} />
		{#each MENU_BARS as y (y)}
			<rect x="-24" y={y - 4} width="48" height="8" rx="4" fill="#e8e8e8" />
		{/each}
	{:else if kind === 'bet'}
		<rect x="-46" y="-46" width="92" height="92" rx="16" fill={CONSOLE} />
		<path d="M-14 -10 L0 -24 L14 -10" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
		<path d="M-14 10 L0 24 L14 10" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
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
