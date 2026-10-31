<script lang="ts">
	/**
	 * The backgrounds' light and air, alive (Stake review 2026-10-24: "the
	 * background is too static").
	 *
	 * Nothing painted MOVES here — the lanterns stayed still at the user's
	 * request (2026-10-16). What moves is what light and air do in a lab:
	 *
	 *   flame   lanterns, candles, the furnace mouth: their own brightest pixels
	 *           (design/build_bg_light.py) added back over the plate with a
	 *           flickering alpha, and a lantern throws a warm pool on its wall
	 *   green   elixirs and crystals breathe — slowly, each on its own clock
	 *   fog     soft banks drift through where the painting already has fog
	 *   glints  (vault) a star pops on a coin now and then
 *   steam   a valve or the still lets off a short hiss of steam every few
 *           seconds, which rises, spreads and is gone — then nothing
	 *
	 * A win stirs it: the flames gutter up and the crystals surge once.
	 *
	 * requestAnimationFrame, not setInterval: the review checker flags interval
	 * animation (see PuttMonkey's Background.svelte).
	 */
	import { Container, Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { presentation } from '../game/presentation.svelte';
	import { BG_FOG, BG_LIGHTS, BG_STEAM, COIN_GLINTS } from '../game/bgLight';

	type Props = {
		scene: 'base' | 'feature' | 'vault';
		/** the background sprite's box this frame */
		x: number;
		y: number;
		width: number;
		height: number;
	};
	const props: Props = $props();
	const context = getContext();

	const W = 1920;
	const H = 1080;

	const t = $derived(presentation.clock);
	let winAt = -1e9;
	context.eventEmitter.subscribeOnMount({
		winLinesShow: () => {
			winAt = t;
		},
	});



	const sx = $derived(props.width / W);
	const sy = $derived(props.height / H);
	const box = (r: [number, number, number, number]) => ({
		x: props.x + r[0] * sx,
		y: props.y + r[1] * sy,
		width: (r[2] - r[0]) * sx,
		height: (r[3] - r[1]) * sy,
	});

	/** a win's stir: up fast, a slow 1.6s release */
	const stir = $derived.by(() => {
		const d = t - winAt;
		return Math.max(presentation.energy, d < 0 || d > 1.8 ? 0 : Math.min(1, d / 0.15) * Math.exp(-d / 0.6));
	});

	// a flame: two unrelated rates and a rare gutter, never a clean pulse
	const flame = (seed: number) => {
		const a = Math.sin(t * 8.1 + seed * 5.3) * 0.5 + Math.sin(t * 13.7 + seed * 11.1) * 0.3 + Math.sin(t * 2.3 + seed) * 0.2;
		const gutter = Math.max(0, Math.sin(t * 0.71 + seed * 2.9) - 0.9) * 7;
		return Math.max(0, 0.42 + 0.2 * a - 0.28 * gutter + 0.35 * stir);
	};
	const breathe = (seed: number, period: number, lo: number, hi: number) =>
		lo + (hi - lo) * (0.5 - 0.5 * Math.cos((t * Math.PI * 2) / period + seed * 2.4)) + 0.4 * stir;

	const lights = $derived(BG_LIGHTS[props.scene]);

	// fog: each bank is two sprites crossfading on a 18s life, drifting right
	// and up a little, so no bank is ever seen to start or end
	const FOG_LIFE = 18;
	const fogState = (bank: [number, number, number, number], i: number, half: number) => {
		const p = (t / FOG_LIFE + i * 0.37 + half * 0.5) % 1;
		const [bx, by, bw, bh] = bank;
		return {
			key: `bgFog${(i + half) % 3}`,
			x: props.x + (bx + bw / 2 + (p - 0.5) * bw * 0.35) * sx,
			y: props.y + (by + bh / 2 - p * bh * 0.18) * sy,
			width: bw * 1.25 * sx,
			height: bh * 1.25 * sy,
			alpha: Math.sin(p * Math.PI) ** 1.5 * (props.scene === 'feature' ? 0.2 : 0.26),
		};
	};

	// steam: each vent puffs three wisps 140ms apart, once a period
	const STEAM_LIFE = 1.5;
	const steam = (v: number[], k: number) => {
		const [vx, vy, dx, dy, period, phase] = v;
		const u = ((t + phase) % period) / STEAM_LIFE - k * 0.09;
		if (u <= 0 || u >= 1) return null;
		const ease = 1 - (1 - u) ** 2;
		const size = 34 + 150 * ease;
		return {
			x: props.x + (vx + dx * ease) * sx,
			y: props.y + (vy + dy * ease) * sy,
			width: size * sx,
			height: size * 0.62 * sy,
			alpha: 0.42 * Math.min(1, u / 0.1) * (1 - u) ** 1.4,
			key: `bgFog${k}`,
		};
	};

	// glints: three slots, each popping on a different coin every ~1.6s
	const glint = (slot: number) => {
		const period = 1.6 + slot * 0.37;
		const n = Math.floor(t / period + slot * 0.41);
		const p = (t / period + slot * 0.41) % 1;
		const at = COIN_GLINTS[(n * 7 + slot * 11) % COIN_GLINTS.length];
		// a short pop at the start of the slot's cycle, then nothing
		const life = Math.min(1, p / 0.28);
		const s = p < 0.28 ? Math.sin(life * Math.PI) : 0;
		return { x: props.x + at[0] * sx, y: props.y + at[1] * sy, s, rot: n * 0.7 };
	};
</script>

<Container>
	{#if props.scene !== 'vault'}
		{#each BG_FOG[props.scene] as bank, i (i)}
			{#each [0, 1] as half (half)}
				{@const f = fogState(bank, i, half)}
				<Sprite key={f.key} anchor={0.5} x={f.x} y={f.y} width={f.width} height={f.height} tint={0x46e0a6} blendMode="add" alpha={f.alpha} />
			{/each}
		{/each}
	{/if}

	{#each lights as light, i (light.key)}
		{@const b = box(light.rect)}
		{#if light.kind === 'flame'}
			{@const a = flame(i * 1.7)}
			{#if light.key.includes('lantern')}
				<!-- the pool of light the lantern throws on its wall -->
				<Sprite
					key="fxGlow"
					anchor={0.5}
					x={b.x + b.width / 2}
					y={b.y + b.height * 0.48}
					width={b.width * 3.4}
					height={b.width * 3.4}
					tint={0xffa53c}
					blendMode="add"
					alpha={0.16 + 0.12 * a}
				/>
			{/if}
			<Sprite key={light.key} {...b} blendMode="add" alpha={a} />
		{:else if props.scene === 'feature'}
			<Sprite key={light.key} {...b} blendMode="add" alpha={breathe(i * 3.1, 4.6, 0.08, 0.42)} />
		{:else}
			<Sprite key={light.key} {...b} blendMode="add" alpha={breathe(i, 3.2 + (i % 3) * 0.9, 0.1, 0.5)} />
		{/if}
	{/each}

	{#each BG_STEAM[props.scene] as vent, i (i)}
		{#each [0, 1, 2] as k (k)}
			{@const w = steam(vent, k)}
			{#if w}
				<Sprite key={w.key} anchor={0.5} x={w.x} y={w.y} width={w.width} height={w.height} tint={0xdbe8de} alpha={w.alpha} />
			{/if}
		{/each}
	{/each}

	{#if props.scene === 'vault'}
		{#each [0, 1, 2] as slot (slot)}
			{@const g = glint(slot)}
			{#if g.s > 0.01}
				<Sprite key="bgGlint" anchor={0.5} x={g.x} y={g.y} width={46 * sx * g.s} height={46 * sy * g.s} rotation={g.rot} blendMode="add" alpha={g.s} />
			{/if}
		{/each}
	{/if}
</Container>
