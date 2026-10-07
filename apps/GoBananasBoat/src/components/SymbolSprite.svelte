<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { stateBet } from 'state-shared';

	import { getSymbolInfo } from '../game/utils';
	import { SYMBOL_SIZE } from '../game/constants';
	import { MESH_LANDS, MESH_IDLES, AMP_MAX } from '../game/meshWin';
	import { idleCells } from '../game/idleDirector';
	import SymbolMeshWin from './SymbolMeshWin.svelte';
	import CoinLand from './CoinLand.svelte';

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
		/** the maths' symbol id: the high pays, the Scatter and the Wild land
		 *  through their mesh (game/meshWin/lands.ts) rather than the squash */
		symbolName?: string;
		/** a visible, settled board cell: it may do an idle act */
		idleable?: boolean;
		oncomplete?: () => void;
	};

	const props: Props = $props();

	const width = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.width);
	const height = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.height);
	const blur = $derived(Math.max(0, Math.min(1, props.blur ?? 0)));

	// landing squash: hammer down, rebound, settle (~240ms). Amplitude scales with
	// `impact`, timings do not — a lighter symbol should look lighter, not slower,
	// and keeping the duration fixed means every reel still settles together.
	const sx = new Tween(1);
	const sy = new Tween(1);
	let squashing = false;
	// Set when this sprite is torn down. The squash is an async chain of Tween
	// promises, and those promises still resolve after the component is gone —
	// so without this the chain reported "landing finished" from a presentation
	// that had already been replaced. See the guard at the end of runSquash.
	let destroyed = false;
	$effect(() => () => {
		destroyed = true;
	});
	// THE LANDING, ACTED. For the symbols with a mesh landing the steel panel
	// stays put and the subject takes the weight (lands.ts says what each does),
	// instead of the whole tile — panel and all — being squashed like a sticker.
	//
	// The act runs ~480ms, longer than the squash; "landed" is still reported at
	// 240ms, exactly when the squash reported it, so the reel's stop sequence is
	// unchanged and the act simply finishes over the settled board. It gives way
	// the moment the reel spins again (the blur takes over), and a new act on the
	// same cell replaces the old one.
	const LANDED_MS = 240;
	let meshLand = $state<{ id: number; speed: number; amp: number } | null>(null);
	let meshLandId = 0;
	let meshLandTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => () => clearTimeout(meshLandTimer));
	const runMeshLand = async (spec: (typeof MESH_LANDS)[string]) => {
		if (squashing) return;
		squashing = true;
		const speed = stateBet.isTurbo ? 2 : 1;
		const amp = Math.max(0, Math.min(AMP_MAX, props.impact ?? 1));
		meshLand = { id: ++meshLandId, speed, amp };
		clearTimeout(meshLandTimer);
		const mine = meshLandId;
		meshLandTimer = setTimeout(() => {
			if (meshLand?.id === mine) meshLand = null;
		}, spec.durationMs / speed + 40);
		await new Promise((resolve) => setTimeout(resolve, LANDED_MS));
		squashing = false;
		// the same guard as the squash below, for the same reason
		if (destroyed) return;
		props.oncomplete?.();
	};

	// THE IDLE ACT (game/meshWin/idles.ts). While this cell stands still and its
	// symbol has one, it is on the idle director's register; the director calls
	// `play` when it is this cell's turn. It stays registered while it acts (it
	// just says it is busy), so an act does not reset the board's quiet clock.
	let idleAct = $state<{ id: number } | null>(null);
	let idleId = 0;
	let idleTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		const name = props.symbolName;
		const spec = name ? MESH_IDLES[name] : undefined;
		const still = !!props.idleable && blur <= 0.01 && !props.landing && !meshLand;
		if (!spec || !still || !name) {
			idleAct = null;
			return;
		}
		const off = idleCells.add({
			name,
			play: () => {
				if (idleAct || meshLand || destroyed) return false;
				const mine = ++idleId;
				idleAct = { id: mine };
				clearTimeout(idleTimer);
				idleTimer = setTimeout(() => {
					if (idleAct?.id === mine) idleAct = null;
				}, spec.durationMs + 60);
				return true;
			},
		});
		return () => {
			off();
			clearTimeout(idleTimer);
		};
	});

	// THE PRIZE COIN LANDS LIKE A COIN (CoinLand, 2026-10-03): it hits its plate
	// and wobbles round its rim until it lies flat, instead of the whole tile
	// squashing. Same contract as the mesh landing: "landed" at LANDED_MS.
	const COIN_LAND_MS = 600;
	let coinLand = $state<{ id: number; speed: number; amp: number } | null>(null);
	let coinLandId = 0;
	let coinLandTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => () => clearTimeout(coinLandTimer));
	const runCoinLand = async () => {
		if (squashing) return;
		squashing = true;
		const speed = stateBet.isTurbo ? 2 : 1;
		coinLand = { id: ++coinLandId, speed, amp: Math.max(0.4, Math.min(AMP_MAX, props.impact ?? 1)) };
		clearTimeout(coinLandTimer);
		const mine = coinLandId;
		coinLandTimer = setTimeout(() => {
			if (coinLand?.id === mine) coinLand = null;
		}, COIN_LAND_MS / speed + 40);
		await new Promise((resolve) => setTimeout(resolve, LANDED_MS));
		squashing = false;
		if (destroyed) return;
		props.oncomplete?.();
	};

	const runSquash = async () => {
		if (props.symbolName === 'P') return runCoinLand();
		const meshSpec = props.symbolName ? MESH_LANDS[props.symbolName] : undefined;
		if (meshSpec) return runMeshLand(meshSpec);
		if (squashing) return;
		squashing = true;
		// Ceiling is 1.5, not 1: the point of the tier is that Scatter and Wild hit
		// HARDER than a high-pay, and they are passed 1.25 / 1.2. Clamping at 1
		// would have flattened them back to the default and silently undone this.
		const k = Math.max(0, Math.min(1.5, props.impact ?? 1));
		const at = (v: number) => 1 + (v - 1) * k;
		sx.set(at(1.12), { duration: 70, easing: cubicOut });
		await sy.set(at(0.82), { duration: 70, easing: cubicOut });
		sx.set(at(0.97), { duration: 90, easing: cubicOut });
		await sy.set(at(1.06), { duration: 90, easing: cubicOut });
		sx.set(1, { duration: 80, easing: cubicOut });
		await sy.set(1, { duration: 80, easing: cubicOut });
		squashing = false;
		// THE completion that was lighting one reel and then killing it.
		//
		// 'win' renders a Spine, every other state renders this sprite, so a symbol
		// going land → win unmounts this component mid-squash. The chain above kept
		// running to its end and called oncomplete anyway; by then the symbol was in
		// 'win', so Board.boardWithAnimateSymbols took that call as "the win spine
		// finished", moved the symbol straight to postWinStatic, and the spine was
		// destroyed on roughly the frame it started. The symbol stayed dark while
		// the rest of the line lit up.
		//
		// It landed on reel 1 far more often than anywhere else because the grenade
		// reaches reel 1 first — a few frames into the volley, the one moment still
		// inside this 240ms window.
		//
		// ReelSymbol tried to guard this by comparing the current symbolState with a
		// {@const} snapshot, but {@const} is reactive: by the time the stale call
		// arrived, the snapshot had been recomputed to 'win' too and the comparison
		// always passed. Cancelling at the source is not subject to that.
		if (destroyed) return;
		props.oncomplete?.();
	};

	$effect(() => {
		props.symbolInfo;
		if (props.landing) {
			runSquash();
		} else {
			props.oncomplete?.();
		}
	});
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

{#if meshLand && blur <= 0.01 && props.symbolName}
	{#key meshLand.id}
		<SymbolMeshWin
			land
			symbolName={props.symbolName}
			{width}
			{height}
			speed={meshLand.speed}
			amp={meshLand.amp}
		/>
	{/key}
{:else if coinLand && blur <= 0.01}
	{#key coinLand.id}
		<Container x={props.x ?? 0} y={props.y ?? 0}>
			<CoinLand {width} {height} amp={coinLand.amp} speed={coinLand.speed} />
		</Container>
	{/key}
{:else if idleAct && blur <= 0.01 && props.symbolName}
	{#key idleAct.id}
		<SymbolMeshWin idle symbolName={props.symbolName} {width} {height} />
	{/key}
{:else}
	<Sprite
		x={props.x}
		y={props.y}
		anchor={0.5}
		key={props.symbolInfo.assetKey}
		width={width * sx.current}
		height={blur > 0.01 ? height * (1 + 0.3 * blur) : height * sy.current}
		alpha={1 - 0.15 * blur}
	/>
{/if}
