<script lang="ts">

	import SymbolSpine from './SymbolSpine.svelte';
	import SymbolSprite from './SymbolSprite.svelte';
	import SymbolWinAnim from './SymbolWinAnim.svelte';
	import SymbolMeshWin from './SymbolMeshWin.svelte';
	import { MESH_WINS, MESH_LANDS } from '../game/meshWin';
	import { getSymbolInfo } from '../game/utils';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { getContext } from '../game/context';
	import { stateGameDerived } from '../game/stateGame.svelte';
	import { SYMBOL_SIZE, isBigPrize, BIG_PRIZE_FILL, BIG_PRIZE_STROKE } from '../game/constants';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import GoldText from './GoldText.svelte';
	import { Container, Graphics } from 'pixi-svelte';
	import { coinFace } from '../game/meshWin/pCoin';
	import { drawMultiplierBadge, BADGE_W, BADGE_H } from '../game/multiplierBadge';

	type Props = {
		x?: number;
		y?: number;
		state: SymbolState;
		rawSymbol: RawSymbol;
		oncomplete?: () => void;
		loop?: boolean;
		// forwarded to SymbolSprite: reel speed 0..1, and how hard this symbol
		// lands (see ReelSymbol, which knows both the reel motion and the tier)
		blur?: number;
		impact?: number;
		/** the reel this cell is on, for effects that cascade across a line */
		reel?: number;
	};

	const props: Props = $props();
	const context = getContext();
	const symbolInfo = $derived(getSymbolInfo({ rawSymbol: props.rawSymbol, state: props.state }));
	const isSprite = $derived(symbolInfo.type === 'sprite');
	const isWin = $derived(props.state === 'win');
	// Symbols whose win is a deforming mesh instead of the Spine clip — every
	// symbol that can win (game/meshWin/*): the high pays, the letters, the Wild
	// and the Scatter.
	const isMeshWin = $derived(isWin && props.rawSymbol.name in MESH_WINS);
	// ...and their LANDING too, every spin: each lands its own way (a leg, a
	// lid, an ear) instead of the whole tile squashing (meshRig.landPose)
	// (and the tablet's and the coin's, which never win: MESH_LANDS)
	const isMeshLand = $derived(props.state === 'land' && props.rawSymbol.name in MESH_LANDS);

	// THE TEASE: a Scatter already down while the spin is still undecided sways
	// on its cell (meshWin/sScatter `tease`) until the last reel stops, then
	// settles back onto the drawing and hands the cell to the sprite again.
	// Harder with each Scatter: 2 -> 0.85, 3 -> 1.05, 4+ -> 1.25.
	const teaseOn = $derived(
		props.state === 'static' &&
			!!MESH_LANDS[props.rawSymbol.name]?.tease &&
			stateGameDerived.scatterTease(),
	);
	const teaseWeight = $derived(Math.min(1.25, 0.45 + 0.2 * stateGameDerived.scatterLandIndex()));
	let teasing = $state(false);
	$effect(() => {
		if (teaseOn) teasing = true;
	});
	// anything else the cell does (a win, the next spin) takes it over at once
	$effect(() => {
		if (props.state !== 'static') teasing = false;
	});

	// The superspin coin's value rides the coin's face as it rings down on
	// landing (meshWin/pCoin: the mesh and this read the same `coinFace`). A
	// frame clock only while it lands; the face is back at rest either way when
	// the landing ends or is cut short.
	const REST_FACE = { across: 1, angle: 0 };
	let face = $state(REST_FACE);
	$effect(() => {
		if (props.state !== 'land' || props.rawSymbol.name !== 'P') return;
		const k = props.impact ?? 1;
		const started = performance.now();
		let raf = 0;
		const step = () => {
			const t = performance.now() - started;
			face = t < 600 ? coinFace(t, k) : REST_FACE;
			if (t < 600) raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
		return () => {
			cancelAnimationFrame(raf);
			face = REST_FACE;
		};
	});
</script>

{#if isMeshWin}
	<SymbolMeshWin
		{symbolInfo}
		symbolName={props.rawSymbol.name}
		reel={props.reel}
		showWinFrame={!['S', 'M'].includes(props.rawSymbol.name)}
		x={props.x}
		y={props.y}
		oncomplete={props.oncomplete}
	/>
{:else if isMeshLand}
	<SymbolMeshWin
		{symbolInfo}
		beat="land"
		impact={props.impact}
		symbolName={props.rawSymbol.name}
		x={props.x}
		y={props.y}
		oncomplete={props.oncomplete}
	/>
{:else if teasing && props.state === 'static'}
	<SymbolMeshWin
		{symbolInfo}
		beat="tease"
		active={teaseOn}
		impact={teaseWeight}
		symbolName={props.rawSymbol.name}
		x={props.x}
		y={props.y}
		oncomplete={() => (teasing = false)}
	/>
{:else if isSprite && isWin}
	<!-- Win state for sprite symbols: programmatic scale+glow animation -->
	<SymbolWinAnim {symbolInfo} x={props.x} y={props.y} oncomplete={props.oncomplete} />
{:else if isSprite}
	<SymbolSprite
		{symbolInfo}
		x={props.x}
		y={props.y}
		blur={props.state === 'spin' ? (props.blur ?? 1) : 0}
		landing={props.state === 'land'}
		impact={props.impact}
		oncomplete={props.oncomplete}
	/>
{:else}
	<SymbolSpine
		loop={props.loop}
		{symbolInfo}
		x={props.x}
		y={props.y}
		showWinFrame={props.state === 'win' && !['S', 'M'].includes(props.rawSymbol.name)}
		listener={{
			complete: props.oncomplete,
			event: (_, event) => {
				if (event.data?.name === 'wildExplode') {
					context.eventEmitter?.broadcast({ type: 'soundOnce', name: 'sfx_wild_explode' });
				}
			},
		}}
	/>
{/if}

<!--
	A HELD TABLET's multiplier, 2x-50x, drawn on the cell itself.

	It used to live on a badge beside the expanded wild's reel, and that component
	is gone: the multiplier moved onto the tablets, and a tablet is a single cell
	rather than a whole reel, so there is nowhere else for the number to be. Drawn
	the same way the hold-and-spin coin value is drawn below, for the same reason
	— the value belongs to the cell and has to move with it.

	Only held cells carry the attribute. Nothing else in this game sets it: the
	maths registers "multiplier" with an EMPTY symbol list, so no symbol gets one
	from its name and a plain board has none anywhere.

	It re-draws every free spin. No transition is applied on purpose — the value
	genuinely jumps, and easing between two unrelated numbers would read as a
	count rather than a re-roll.
-->
{#if props.rawSymbol.multiplier}
	<!-- the cartouche it is carved into, the same one the re-roll spins inside
	     (game/multiplierBadge.ts) — drawn here too so the value does not change
	     furniture the moment the roll hands it back to the board -->
	<Graphics
		draw={(g) => {
			g.clear();
			drawMultiplierBadge(g, {
				x: props.x ?? 0,
				y: (props.y ?? 0) + SYMBOL_SIZE * 0.3,
				width: SYMBOL_SIZE * BADGE_W,
				height: SYMBOL_SIZE * BADGE_H,
				lit: true,
			});
		}}
	/>
	<GoldText
		x={props.x ?? 0}
		y={(props.y ?? 0) + SYMBOL_SIZE * 0.3}
		text={`${props.rawSymbol.multiplier}X`}
		fontSize={26}
		maxWidth={SYMBOL_SIZE * 0.72}
	/>
{/if}

{#if props.rawSymbol.prize}
	<!--
		Superspin coin value. This is the copy drawn on the reel as a coin lands;
		StickyPrizes draws the held ones. Both have to grade identically or a coin
		would change colour the instant it sticks — the previous pass only updated
		StickyPrizes, so high-value coins landed in plain gold and only turned
		amber a beat later.
	-->
	<Container
		x={props.x ?? 0}
		y={props.y ?? 0}
		scale={{ x: face.across, y: 1 }}
		rotation={(face.angle * Math.PI) / 180}
	>
		<GoldText
			x={0}
			y={0}
			text={bookEventAmountToCurrencyString(props.rawSymbol.prize)}
			fontSize={28}
			maxWidth={SYMBOL_SIZE * 0.86}
			fill={isBigPrize(props.rawSymbol.prize) ? BIG_PRIZE_FILL : undefined}
			stroke={isBigPrize(props.rawSymbol.prize) ? BIG_PRIZE_STROKE : undefined}
		/>
	</Container>
{/if}
