<script lang="ts">
	import { Sprite } from 'pixi-svelte';

	import { getSymbolInfo } from '../game/utils';
	import { SYMBOL_SIZE } from '../game/constants';
	import { LAND_MS, REST, landFrame, type LandFrame } from '../game/landMotion';
	import { idlePhase, idleScale } from '../game/idleBreathe';
	import { idleClock, useIdleClock } from '../game/idleClock.svelte';

	type Props = {
		x?: number;
		y?: number;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		// How fast the reel is travelling, 0..1, driving a cheap motion blur
		// (vertical stretch + ghosts). Continuous rather than a boolean so the
		// blur eases off through the bounce instead of snapping away the instant
		// the reel changes state.
		blur?: number;
		// symbol just landed: impact squash before settling to static
		landing?: boolean;
		// 0..1 — how heavily this symbol hits. Scatter and Wild land hardest, the
		// card royals barely at all, so weight reads as importance rather than
		// every tile bouncing identically.
		impact?: number;
		/** which symbol this is (the landing table is per symbol) */
		symbolName?: string;
		/** where it sits: reel, and the PADDED row — for the idle breath's phase */
		cell?: { reel: number; row: number };
		/** the reel is teasing: lift it out of the board (anticipationFocus) */
		focus?: { scale: number; bloom: number };
		oncomplete?: () => void;
	};

	const props: Props = $props();

	const width = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.width);
	const height = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.height);
	const blur = $derived(Math.max(0, Math.min(1, props.blur ?? 0)));

	// ── landing ────────────────────────────────────────────────────────────────
	//
	// Each symbol lands as the thing it is — the lantern swings, the cart thuds
	// twice, the stone letters drop flat — from game/landMotion.ts, where the
	// gate can prove no two are alike and every one ends at rest. It used to be
	// ONE shared squash for all of them, which is the "everything moves the same"
	// a reviewer meets first. `impact` (the tier) scales every deviation; the
	// timing does not, so every reel still settles together.
	let land = $state<LandFrame>(REST);
	let raf = 0;
	let doneTimer: ReturnType<typeof setTimeout> | undefined;
	// Set when this sprite is torn down. The landing completes on a timer, and a
	// timer still fires after the component is gone — see the guard below.
	let destroyed = false;
	$effect(() => () => {
		destroyed = true;
		cancelAnimationFrame(raf);
		clearTimeout(doneTimer);
	});
	const runLanding = () => {
		cancelAnimationFrame(raf);
		clearTimeout(doneTimer);
		// ceiling 1.5, not 1: Scatter and Wild are passed 1.25 / 1.2 on purpose
		const k = Math.max(0, Math.min(1.5, props.impact ?? 1));
		const name = props.symbolName ?? '';
		const start = performance.now();
		const step = (now: number) => {
			const f = landFrame(name, now - start);
			land = {
				...f,
				sx: 1 + (f.sx - 1) * k,
				sy: 1 + (f.sy - 1) * k,
				rot: f.rot * k,
				dx: f.dx * k,
				dy: f.dy * k,
				bloom: f.bloom * Math.min(1.2, k),
				dust: f.dust * Math.min(1.2, k),
			};
			if (now - start < LAND_MS) raf = requestAnimationFrame(step);
			else land = REST;
		};
		raf = requestAnimationFrame(step);
		// completion on a TIMER, not the frame loop, so it cannot stall in a tab
		// that stops painting
		doneTimer = setTimeout(() => {
			cancelAnimationFrame(raf);
			land = REST;
			// THE completion that was lighting one reel and then killing it.
			//
			// 'win' renders another component, so a symbol going land -> win
			// unmounts this one mid-landing. Reporting "landing finished" after that
			// was taken by Board as "the win finished" and the win was destroyed on
			// roughly the frame it started — a symbol left dark while the rest of
			// the line lit up. Cancelled at the source.
			if (destroyed) return;
			props.oncomplete?.();
		}, LAND_MS);
	};

	$effect(() => {
		props.symbolInfo;
		if (props.landing) {
			runLanding();
		} else {
			props.oncomplete?.();
		}
	});

	// ── idle: the settled board breathes (game/idleBreathe.ts) ────────────────
	//
	// About 1% of scale, each cell on its own phase so the board never pulses as
	// one block. Not while the reel moves (it would fight the blur) and not while
	// landing (the landing owns the symbol for those 240ms).
	const idling = $derived(!props.landing && blur <= 0.01 && !!props.cell);
	const breath = $derived(idling && props.cell ? idleScale(idleClock.t, idlePhase(props.cell.reel, props.cell.row)) : 1);
	$effect(() => {
		if (!idling) return;
		return useIdleClock();
	});

	// the teasing reel's lift (game/anticipationFocus.ts)
	const focusScale = $derived(props.focus?.scale ?? 1);
	const focusBloom = $derived(props.focus?.bloom ?? 0);
	const bloomAlpha = $derived(Math.min(1, land.bloom + focusBloom));
	const bloomTint = $derived(land.bloom > 0 ? land.bloomTint : 0xffffff);
	const k = $derived(breath * focusScale);
</script>

{#if blur > 0.01}
	<!-- ghost trail: same art, offset and faded, sells the motion blur. Offset,
	     opacity and stretch all scale with speed, so the trail shortens and fades
	     as the reel brakes rather than vanishing in one frame. -->
	<Sprite
		x={props.x}
		y={(props.y ?? 0) - height * 0.42 * blur}
		anchor={0.5}
		key={props.symbolInfo.assetKey}
		width={width * 0.96}
		height={height * (1 + 0.18 * blur)}
		alpha={0.22 * blur}
	/>
	<Sprite
		x={props.x}
		y={(props.y ?? 0) + height * 0.42 * blur}
		anchor={0.5}
		key={props.symbolInfo.assetKey}
		width={width * 0.96}
		height={height * (1 + 0.18 * blur)}
		alpha={0.22 * blur}
	/>
{/if}

{#if land.dust > 0.01}
	<!-- dust at the cell's floor, behind the tile, spreading as it fades -->
	{#each [-1, 1] as side (side)}
		<Sprite
			key="fxGlow"
			anchor={0.5}
			x={(props.x ?? 0) + side * width * (0.2 + 0.25 * (1 - land.dust))}
			y={(props.y ?? 0) + height * 0.36}
			width={width * (0.5 + 0.3 * (1 - land.dust))}
			height={height * 0.24}
			tint={land.dustTint}
			alpha={land.dust}
		/>
	{/each}
{/if}

<Sprite
	x={(props.x ?? 0) + land.dx * SYMBOL_SIZE}
	y={(props.y ?? 0) + land.dy * SYMBOL_SIZE}
	anchor={0.5}
	key={props.symbolInfo.assetKey}
	width={width * land.sx * k}
	height={blur > 0.01 ? height * (1 + 0.3 * blur) * focusScale : height * land.sy * k}
	rotation={land.rot}
	alpha={1 - 0.15 * blur}
/>

{#if bloomAlpha > 0.01}
	<!-- an additive copy of the art: the landing's flash, or the tease's lift -->
	<Sprite
		x={(props.x ?? 0) + land.dx * SYMBOL_SIZE}
		y={(props.y ?? 0) + land.dy * SYMBOL_SIZE}
		anchor={0.5}
		key={props.symbolInfo.assetKey}
		width={width * land.sx * k}
		height={blur > 0.01 ? height * (1 + 0.3 * blur) * focusScale : height * land.sy * k}
		rotation={land.rot}
		tint={bloomTint}
		blendMode="add"
		alpha={bloomAlpha * (1 - 0.15 * blur)}
	/>
{/if}
