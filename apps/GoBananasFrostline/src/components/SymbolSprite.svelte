<script lang="ts">
	import { Sprite } from 'pixi-svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	import { stateBetDerived } from 'state-shared';

	import { getSymbolInfo } from '../game/utils';
	import { SYMBOL_SIZE } from '../game/constants';
	import { MESH_LANDS, MESH_IDLES, MESH_TEASES, AMP_MAX, TEASE_HOME_MS, teaseWeight } from '../game/meshWin';
	import { stateGame } from '../game/stateGame.svelte';
	import { idleCells } from '../game/idleDirector';
	import SymbolMeshWin from './SymbolMeshWin.svelte';

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
		/** the symbol's id, for its mesh landing (game/meshWin/lands.ts) */
		symbolName?: string;
		/** may it do an idle act between spins (ReelSymbol: a visible row, simply
		 *  sitting there) */
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
	// THE LANDING, ACTED (game/meshWin/lands.ts, from Go Bananas Boat). For a
	// symbol with a mesh landing the slate plate stays put and the subject takes
	// the weight, instead of the whole tile — plate and all — being squashed like
	// a sticker.
	//
	// The act runs LAND_MS (480), longer than the squash; "landed" is still
	// reported at 240ms, exactly when the squash reported it, so the reel's stop
	// sequence does not move and the act simply finishes over the settled board.
	// It gives way the moment the reel spins again (the blur takes over), and a
	// new act on the same cell replaces the old one.
	const LANDED_MS = 240;
	let meshLand = $state<{ id: number; amp: number } | null>(null);
	let meshLandId = 0;
	let meshLandTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => () => clearTimeout(meshLandTimer));
	const runMeshLand = async (spec: (typeof MESH_LANDS)[string]) => {
		if (squashing) return;
		squashing = true;
		const amp = Math.max(0, Math.min(AMP_MAX, props.impact ?? 1));
		meshLand = { id: ++meshLandId, amp };
		clearTimeout(meshLandTimer);
		const mine = meshLandId;
		meshLandTimer = setTimeout(
			() => {
				if (meshLand?.id === mine) meshLand = null;
			},
			spec.durationMs / stateBetDerived.timeScale() + 40,
		);
		await new Promise((resolve) => setTimeout(resolve, LANDED_MS));
		squashing = false;
		// the same guard as the squash below, for the same reason
		if (destroyed) return;
		props.oncomplete?.();
	};

	// THE IDLE ACT (game/meshWin/idles.ts, from Go Bananas Boat). While this cell
	// stands still and its symbol has one, it is on the idle director's register;
	// the director calls `play` when it is this cell's turn. It stays registered
	// while it acts (it just says it is busy), so an act does not reset the
	// board's quiet clock. Spinning, landing, or a landing act still running all
	// take it off.
	let idleAct = $state<{ id: number } | null>(null);
	let idleId = 0;
	let idleTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		const name = props.symbolName;
		const spec = name ? MESH_IDLES[name] : undefined;
		const still = !!props.idleable && blur <= 0.01 && !props.landing && !meshLand && !teasing;
		if (!spec || !still || !name) {
			idleAct = null;
			return;
		}
		const off = idleCells.add({
			name,
			play: () => {
				if (idleAct || meshLand || teasing || destroyed) return false;
				const mine = ++idleId;
				idleAct = { id: mine };
				clearTimeout(idleTimer);
				idleTimer = setTimeout(() => {
					if (idleAct?.id === mine) idleAct = null;
				}, spec.durationMs / stateBetDerived.timeScale() + 60);
				return true;
			},
		});
		return () => {
			off();
			clearTimeout(idleTimer);
		};
	});

	// THE TEASE (game/meshWin/teases.ts, from GoBananubis). A Scatter already
	// down sways on its cell while any reel is still under the anticipation —
	// harder with each Scatter — and when the last one stops it settles back
	// onto the drawing and hands the cell to the sprite again. Anything else the
	// cell does (a spin, a landing) takes it away at once.
	const teaseOn = $derived(
		!!props.symbolName &&
			!!MESH_TEASES[props.symbolName] &&
			!!props.idleable &&
			blur <= 0.01 &&
			!props.landing &&
			!meshLand &&
			stateGame.board.some((reel) => reel.reelState.anticipating),
	);
	const teaseK = $derived(teaseWeight(stateGame.scatterCounter));
	let teasing = $state<{ id: number } | null>(null);
	let teaseId = 0;
	$effect(() => {
		if (teaseOn) {
			if (!teasing) teasing = { id: ++teaseId };
			return;
		}
		if (!teasing) return;
		const cut = !props.idleable || blur > 0.01 || props.landing || !!meshLand;
		if (cut) {
			teasing = null;
			return;
		}
		// reels stopped: let it blend home, then give the cell back (a timer,
		// so a hidden tab cannot leave it on the cell)
		const mine = teasing.id;
		const home = setTimeout(() => {
			if (teasing?.id === mine) teasing = null;
		}, TEASE_HOME_MS + 60);
		return () => clearTimeout(home);
	});

	const runSquash = async () => {
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
			amp={meshLand.amp}
			symbolInfo={props.symbolInfo}
			symbolName={props.symbolName}
			x={props.x}
			y={props.y}
		/>
	{/key}
{:else if teasing && blur <= 0.01 && props.symbolName}
	{#key teasing.id}
		<SymbolMeshWin
			tease
			{teaseOn}
			{teaseK}
			symbolInfo={props.symbolInfo}
			symbolName={props.symbolName}
			x={props.x}
			y={props.y}
		/>
	{/key}
{:else if idleAct && blur <= 0.01 && props.symbolName}
	{#key idleAct.id}
		<SymbolMeshWin idle symbolInfo={props.symbolInfo} symbolName={props.symbolName} x={props.x} y={props.y} />
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
