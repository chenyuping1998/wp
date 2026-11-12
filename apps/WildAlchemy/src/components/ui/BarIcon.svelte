<script lang="ts">
	/**
	 * The bet bar's controls as small inline SVGs for the rules page's controls
	 * guide, so what the player reads matches what is on the bar (house-rules D2
	 * item 9). The bar is v3 (ui/MummyBar.svelte): the parchment buy tile with the
	 * flask, then one sepia console holding the menu bars, BALANCE, the BET box
	 * with its level track, the chevrons, the Spin roundel, and Auto Spin over
	 * Turbo. The shapes are copies of the bar's drawing code (crescent, bolt,
	 * chevron, flask); the menu panel's rows use the same HUD icons the panel does.
	 * After Dragon Tide's BarIcon (wp-dragon 80395e5e), dressed for Wild Alchemy.
	 */
	import assets from '../../game/assets';
	import { BUY_ICON, type BuyIconFill } from '../../game/buyIcon';

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

	// game/palette.ts, as the bar uses it
	const INK = '#3b2a1a';
	const CONSOLE = '#2a1d12';
	const RULE = '#c8973a';
	const GOLD = '#c8973a';
	const VERDIGRIS = '#3f8a6e';
	const BONE = '#f1ead8';
	const PARCHMENT = '#e8d9b5';
	const WINE = '#a53e2b';
	const BOX = '#1e140b';
	const TRACK = '#4d3a26';
	const FONT = '"Saira", "Arial Narrow", Arial, sans-serif';
	const FILL: Record<BuyIconFill, string> = { ink: INK, tile: PARCHMENT, accent: VERDIGRIS };

	// the HUD's drawn icons the menu panel shows, through the asset registry so a
	// renamed file fails the build's asset guard rather than leaving a hole here
	const registry = assets as unknown as Record<string, { src?: string } | undefined>;
	const SPRITE: Partial<Record<Kind, string>> = {
		info: registry.waIconInfo?.src ?? '',
		paytable: registry.waIconPayTable?.src ?? '',
		settings: registry.waIconSettings?.src ?? '',
		sfx: registry.waIconSoundOn?.src ?? '',
	};
	const ROUNDEL = registry.waUiSpin?.src ?? '';

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
	// the roundel's well is 0.58 of its radius; the mark fills about half of it
	const spinArrows = refresh(16);
	const smallArrows = refresh(22);
	const BOLT = [0.12, -1, 0.62, -1, 0.22, -0.18, 0.58, -0.18, -0.32, 1, -0.06, 0.14, -0.44, 0.14];
	const bolt = Array.from({ length: BOLT.length / 2 }, (_, i) => `${BOLT[i * 2] * 26},${BOLT[i * 2 + 1] * 26}`).join(' ');
</script>

<!-- the BALANCE readout is twice as wide as it is tall, everything else square -->
<svg viewBox={kind === 'readout' ? '-60 -30 120 60' : '-50 -50 100 100'} aria-hidden="true" class="bar-icon">
	{#if kind === 'buy'}
		<rect x="-46" y="-46" width="92" height="92" rx="13" fill={PARCHMENT} stroke={INK} stroke-width="4" />
		<rect x="-40" y="-40" width="80" height="80" rx="8" fill="none" stroke={WINE} stroke-width="2" />
		<!-- the flask (game/buyIcon.ts), at the bar's 0.72-of-tile size -->
		<g transform="scale(0.68)">
			{#each BUY_ICON as sh, i (i)}
				{#if 'c' in sh}
					<circle cx={sh.c[0]} cy={sh.c[1]} r={sh.c[2]} fill={FILL[sh.fill]} />
				{:else if 's' in sh}
					<path d={sh.s} fill="none" stroke={FILL[sh.fill]} stroke-width={sh.w} stroke-linecap="round" stroke-linejoin="round" />
				{:else}
					<path d={sh.d} fill={FILL[sh.fill]} />
				{/if}
			{/each}
		</g>
	{:else if kind === 'menu'}
		<!-- the three bars at the console's left end -->
		<rect x="-46" y="-46" width="92" height="92" rx="14" fill={CONSOLE} stroke={RULE} stroke-width="2.5" />
		{#each MENU_BARS as y (y)}
			<rect x="-24" y={y - 4} width="48" height="8" rx="4" fill={BONE} />
		{/each}
	{:else if SPRITE[kind]}
		<!-- a row of the menu panel: the HUD icon it shows, on the panel's sepia -->
		<rect x="-46" y="-46" width="92" height="92" rx="14" fill={CONSOLE} stroke={RULE} stroke-width="2.5" />
		<image href={SPRITE[kind]} x="-32" y="-32" width="64" height="64" />
	{:else if kind === 'music'}
		<!-- the music row's quaver, bone with a sepia outline like the HUD icons -->
		<rect x="-46" y="-46" width="92" height="92" rx="14" fill={CONSOLE} stroke={RULE} stroke-width="2.5" />
		<g transform="scale(2.1)" stroke-linecap="round" stroke-linejoin="round">
			<ellipse cx="-4" cy="7" rx="6.3" ry="5.1" fill={INK} />
			<path d="M0.6 7 L0.6 -10 Q6 -6 8 -1" fill="none" stroke={INK} stroke-width="5.2" />
			<ellipse cx="-4" cy="7" rx="5" ry="3.8" fill={BONE} />
			<path d="M0.6 7 L0.6 -10 Q6 -6 8 -1" fill="none" stroke={BONE} stroke-width="2.6" />
		</g>
	{:else if kind === 'readout'}
		<!-- BALANCE on the console: ochre caption over a bone amount -->
		<rect x="-57" y="-27" width="114" height="54" rx="9" fill={CONSOLE} stroke={RULE} stroke-width="2" />
		<text x="-46" y="-8" dominant-baseline="middle" font-family={FONT} font-weight="700" font-size={label.length > 9 ? 12 : 16} fill={GOLD}>{label}</text>
		<rect x="-46" y="5" width="72" height="10" rx="5" fill={BONE} />
	{:else if kind === 'bet'}
		<!-- the BET box on the console: caption, amount, level track along its foot -->
		<rect x="-46" y="-46" width="92" height="92" rx="14" fill={CONSOLE} stroke={RULE} stroke-width="2.5" />
		<rect x="-38" y="-28" width="76" height="56" rx="6" fill={BOX} stroke={VERDIGRIS} stroke-width="1.5" />
		<text x="0" y="-12" text-anchor="middle" dominant-baseline="middle" font-family={FONT} font-weight="700" font-size={label.length > 6 ? 11 : label.length > 4 ? 13 : 17} fill={GOLD}>{label}</text>
		<rect x="-22" y="2" width="44" height="9" rx="4.5" fill={BONE} />
		<rect x="-35" y="20" width="70" height="5" rx="2.5" fill={TRACK} />
		<rect x="-35" y="20" width="28" height="5" rx="2.5" fill={BONE} />
	{:else if kind === 'step'}
		<!-- up over down, bone chevrons on the console -->
		<rect x="-46" y="-46" width="92" height="92" rx="14" fill={CONSOLE} stroke={RULE} stroke-width="2.5" />
		<path d="M-14 -10 L0 -24 L14 -10" fill="none" stroke={BONE} stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
		<path d="M-14 10 L0 24 L14 10" fill="none" stroke={BONE} stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
	{:else if kind === 'spin'}
		<!-- the illuminated roundel (wildAlchemyHud/spin_plate.png) with the bone mark in its well -->
		<image href={ROUNDEL} x="-50" y="-50" width="100" height="100" />
		{#each spinArrows as pts, i (i)}<polygon points={pts} fill={BONE} />{/each}
	{:else}
		<circle r="44" fill={BONE} stroke={INK} stroke-width="6" />
		{#if kind === 'auto'}
			{#each smallArrows as pts, i (i)}<polygon points={pts} fill={INK} />{/each}
			<polygon points="-5.5,-9 10,0 -5.5,9" fill={INK} />
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
