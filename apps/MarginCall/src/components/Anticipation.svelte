<script lang="ts">
	import { Graphics, Sprite } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import type { Reel } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE } from '../game/constants';
	import { stateGame } from '../game/stateGame.svelte';
	import { getSymbolX } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';

	type Props = {
		reel: Reel;
		oncomplete: () => void;
	};

	const props: Props = $props();
	const context = getContext();

	// The reel is under review.
	//
	// This used to be a frame whose opacity rose and fell on a sine and nothing
	// else - no part of it ever moved, which is what makes a tease read as a
	// static overlay rather than as tension. Everything here travels: a scan band
	// runs the column, the chevrons close in and reset, data ticks fall past the
	// rails, and the corner brackets breathe against the scan rather than with it.
	//
	// The palette is the terminal's own amber warning, not the gold this was
	// inherited in. Gold belongs to the game this component came from.
	const AMBER = 0xf7a83a;
	const HOT = 0xffd88a;
	const BEAR = 0xff5566;

	// The board is 3 rows in the basegame and 5 in the feature, so its height has
	// to be read live rather than baked in at module load.
	const boardHeight = $derived(SYMBOL_SIZE * stateGame.rows);
	const x = $derived(getSymbolX(props.reel.reelIndex));
	const LEFT = $derived(x - SYMBOL_SIZE / 2);

	// Later reels are tenser. A tease that reaches reel 5 has more riding on it
	// than one that starts on reel 3, and the scan should be visibly faster.
	const urgency = $derived(Math.min(1, props.reel.reelIndex / 4));
	const scanPeriod = $derived(820 - 260 * urgency);

	let clock = $state(0);
	let finished = $state(false);

	// Deterministic tick field. Seeded off the reel index so adjacent teasing
	// reels do not fall in lockstep, but the same reel always looks the same.
	const TICKS = $derived.by(() => {
		let seed = 97 + props.reel.reelIndex * 613;
		const rand = () => {
			seed = (seed * 1103515245 + 12345) % 2147483648;
			return seed / 2147483648;
		};
		return Array.from({ length: 9 }, () => ({
			side: rand() < 0.5 ? 0 : 1,
			offset: rand(),
			speed: 0.55 + rand() * 0.85,
			len: 8 + rand() * 16,
		}));
	});

	onMount(() => {
		// rAF, not a 24ms interval: this is the one moment in a spin the player is
		// staring at, and a scan band stepping at 41fps is visible as stepping.
		let raf = 0;
		const start = performance.now();
		const tick = (now: number) => {
			clock = now - start;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	$effect(() => {
		// Stop immediately when the reel stops, so the tease does not outlive the
		// thing it was teasing.
		if (!finished && props.reel.reelState.motion === 'stopped') {
			finished = true;
			props.oncomplete();
		}
	});

	/** 0..1, the scan band's position down the column */
	const scanP = $derived((clock % scanPeriod) / scanPeriod);
	/** breathing, deliberately on a different period from the scan */
	const pulse = $derived(0.5 + 0.5 * Math.sin(clock / 190));
	/** chevrons close in over 520ms then snap back out */
	const chevP = $derived((clock % 520) / 520);
</script>

<BoardContainer>
	<Graphics
		draw={(g) => {
			const h = boardHeight;
			const w = SYMBOL_SIZE;
			g.clear();

			// ── wash over the teasing column ─────────────────────────────────
			g.roundRect(LEFT + 3, 3, w - 6, h - 6, 12);
			g.fill({ color: AMBER, alpha: 0.07 + 0.09 * pulse });

			// ── the scan band, travelling top to bottom ──────────────────────
			// The thing that actually moves. Drawn as three stacked bands so it
			// has a bright core and a falloff instead of a hard edge.
			const scanY = -SYMBOL_SIZE * 0.5 + scanP * (h + SYMBOL_SIZE);
			for (const [half, alpha] of [
				[SYMBOL_SIZE * 0.55, 0.05],
				[SYMBOL_SIZE * 0.26, 0.1],
				[SYMBOL_SIZE * 0.07, 0.28],
			] as [number, number][]) {
				const top = Math.max(2, scanY - half);
				const bottom = Math.min(h - 2, scanY + half);
				if (bottom <= top) continue;
				g.rect(LEFT + 4, top, w - 8, bottom - top);
				g.fill({ color: HOT, alpha: alpha * (0.7 + 0.3 * urgency) });
			}
			// the leading edge itself
			if (scanY > 2 && scanY < h - 2) {
				g.moveTo(LEFT + 5, scanY);
				g.lineTo(LEFT + w - 5, scanY);
				g.stroke({ width: 2, color: 0xffffff, alpha: 0.5 });
			}

			// ── data ticks falling past the rails ────────────────────────────
			for (const t of TICKS) {
				const y = ((t.offset + (clock / 1000) * t.speed * 0.6) % 1) * (h + t.len) - t.len;
				const tx = LEFT + (t.side ? w - 7 : 7);
				g.moveTo(tx, y);
				g.lineTo(tx, y + t.len);
			}
			g.stroke({ width: 2, color: AMBER, alpha: 0.3 + 0.2 * pulse });

			// ── column frame: three nested strokes, lit metal ────────────────
			g.roundRect(LEFT + 2, 2, w - 4, h - 4, 13);
			g.stroke({ width: 6, color: AMBER, alpha: 0.3 + 0.32 * pulse });
			g.roundRect(LEFT + 6, 6, w - 12, h - 12, 10);
			g.stroke({ width: 2.5, color: HOT, alpha: 0.4 + 0.38 * pulse });

			// ── corner brackets, ticking inward against the scan ─────────────
			const inset = 9 + 5 * (1 - pulse);
			const arm = w * 0.24;
			for (const [cx, cy, sx, sy] of [
				[LEFT + inset, inset, 1, 1],
				[LEFT + w - inset, inset, -1, 1],
				[LEFT + inset, h - inset, 1, -1],
				[LEFT + w - inset, h - inset, -1, -1],
			] as [number, number, number, number][]) {
				g.moveTo(cx, cy + sy * arm);
				g.lineTo(cx, cy);
				g.lineTo(cx + sx * arm, cy);
			}
			g.stroke({ width: 3, color: 0xffffff, alpha: 0.35 + 0.35 * pulse });

			// ── cell ticks, so the column reads as slots rather than a tube ──
			for (let row = 1; row < h / SYMBOL_SIZE; row++) {
				const y = row * SYMBOL_SIZE;
				g.moveTo(LEFT + 14, y);
				g.lineTo(LEFT + w - 14, y);
			}
			g.stroke({ width: 1.5, color: HOT, alpha: 0.12 + 0.16 * pulse });

			// ── chevrons converging on the column, top and bottom ────────────
			// They travel: three of them, staggered, each sliding in and fading
			// as it arrives. A static arrow is furniture; a moving one is a
			// countdown.
			for (let i = 0; i < 3; i++) {
				const p = (chevP + i / 3) % 1;
				const travel = 34 * (1 - p);
				const alpha = 0.75 * Math.sin(p * Math.PI) ** 0.6;
				if (alpha < 0.02) continue;
				const wing = w * 0.13;
				for (const dir of [-1, 1]) {
					const baseY = dir < 0 ? -10 - travel : h + 10 + travel;
					const tipY = baseY + dir * 11;
					g.moveTo(x - wing, baseY);
					g.lineTo(x, tipY);
					g.lineTo(x + wing, baseY);
				}
				g.stroke({ width: 4, color: urgency > 0.7 ? BEAR : AMBER, alpha, cap: 'round', join: 'round' });
			}
		}}
	/>

	<!-- additive glow hugging each rail, counter-phase to the scan so the column
	     is never uniformly bright -->
	{#each [0, boardHeight] as railY, i (railY)}
		<Sprite
			key="fxGlow"
			anchor={0.5}
			{x}
			y={railY}
			width={SYMBOL_SIZE * 1.35}
			height={SYMBOL_SIZE * 0.7}
			tint={AMBER}
			blendMode="add"
			alpha={0.16 + 0.26 * (i === 0 ? 1 - scanP : scanP)}
		/>
	{/each}

	<!-- the scan's own bloom, riding down the column -->
	<Sprite
		key="fxGlow"
		anchor={0.5}
		{x}
		y={-SYMBOL_SIZE * 0.5 + scanP * (boardHeight + SYMBOL_SIZE)}
		width={SYMBOL_SIZE * 1.5}
		height={SYMBOL_SIZE * 0.8}
		tint={HOT}
		blendMode="add"
		alpha={0.2 + 0.16 * urgency}
	/>
</BoardContainer>
