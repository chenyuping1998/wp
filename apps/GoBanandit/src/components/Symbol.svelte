<script lang="ts">
	import { Container, Graphics, Text } from 'pixi-svelte';

	import SymbolSpine from './SymbolSpine.svelte';
	import SymbolSprite from './SymbolSprite.svelte';
	import SymbolWinAnim from './SymbolWinAnim.svelte';
	import SymbolMeshWin from './SymbolMeshWin.svelte';
	import { MESH_LANDS } from '../game/meshWin';
	import { getSymbolInfo } from '../game/utils';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';
	import { NUMBER_FONT } from '../game/fonts';
	import { SYMBOL_SIZE } from '../game/constants';

	type Props = {
		x?: number;
		y?: number;
		reelIndex?: number;
		state: SymbolState;
		rawSymbol: RawSymbol;
		oncomplete?: () => void;
		loop?: boolean;
		// forwarded to SymbolSprite: reel speed 0..1, and how hard this symbol
		// lands (see ReelSymbol, which knows both the reel motion and the tier)
		blur?: number;
		impact?: number;
	};

	const props: Props = $props();
	const context = getContext();
	const symbolInfo = $derived(getSymbolInfo({ rawSymbol: props.rawSymbol, state: props.state }));
	const isSprite = $derived(symbolInfo.type === 'sprite');
	const isWin = $derived(props.state === 'win');
	// Symbols whose win is a deforming mesh (game/meshWin/*), the GoBananubis
	// method. The rest keep GB100's win moves (SymbolWinAnim) until they get one.
	// The inherited mesh wins contain miner-specific layers. Flat ink symbols
	// use the shared motion until their own print-style win rigs are authored.
	const isMeshWin = $derived(false);
	const lowLetter = $derived(({ L1: 'A', L2: 'K', L3: 'Q', L4: 'J', L5: '10' } as Record<string, string>)[props.rawSymbol.name]);
	// The dynamite's landing is a mesh too (meshWin/landB.ts): the bundle hits
	// and squashes, the fuse whips and fizzes. SymbolMeshWin plays any spec;
	// this one reports the land complete instead of a win.
	const isMeshLand = $derived(props.state === 'land' && props.rawSymbol.name in MESH_LANDS);

</script>

{#snippet body(oncomplete: (() => void) | undefined)}
	{#if isMeshLand}
		<SymbolMeshWin
			{symbolInfo}
			symbolName={props.rawSymbol.name}
			spec={MESH_LANDS[props.rawSymbol.name]}
			showWinFrame={false}
			x={0}
			y={0}
			{oncomplete}
		/>
	{:else if isMeshWin}
		<SymbolMeshWin
			{symbolInfo}
			symbolName={props.rawSymbol.name}
			reel={props.reelIndex}
			showWinFrame={props.rawSymbol.name !== 'S'}
			x={0}
			y={0}
			{oncomplete}
		/>
	{:else if isSprite && isWin}
		<!-- Win state for sprite symbols: GB100's per-symbol win move -->
		<SymbolWinAnim {symbolInfo} symbolName={props.rawSymbol.name} letter={lowLetter} x={0} y={0} {oncomplete} />
	{:else if isSprite}
		<SymbolSprite
			{symbolInfo}
			x={0}
			y={0}
			blur={props.state === 'spin' ? (props.blur ?? 1) : 0}
			landing={props.state === 'land'}
			impact={props.impact}
			letter={lowLetter}
			{oncomplete}
		/>
	{:else}
		<SymbolSpine
			loop={props.loop}
			{symbolInfo}
			x={0}
			y={0}
			listener={{
				complete: oncomplete,
				event: (_, event) => {
					if (event.data?.name === 'wildExplode') {
						context.eventEmitter?.broadcast({ type: 'soundOnce', name: 'sfx_wild_explode' });
					}
				},
			}}
		/>
	{/if}
{/snippet}

<Container x={props.x ?? 0} y={props.y ?? 0}>
	{@render body(props.oncomplete)}
</Container>

{#if props.rawSymbol.prize}
	<!--
		Banana Sack value. The maths sends it in BET MULTIPLES (5 = 5x bet), not in
		book units, so it prints as-is. BanditCollect shows the collected total
		as money once a Bandit takes it.

		A printed STAMP on the sack, not loose type: the value was 34px ink with a
		paper rim on a paper sack, and at reel size it read as part of the drawing
		(user: 袋子的倍數太不明顯). A banana-yellow disc (yellow is reserved for
		the collect mechanic) with an ink rim and an offset ink shadow; the big
		values change plate so a 10x+ sack is spotted before it is read.
	-->
	{@const prize = props.rawSymbol.prize}
	{@const plate = prize >= 100 ? 0x1e1b1a : prize >= 10 ? 0xd24a2c : 0xf4c21b}
	{@const ink = prize >= 100 ? 0xf4c21b : prize >= 10 ? 0xf2e8d0 : 0x1e1b1a}
	{@const label = `${prize}×`}
	{@const r = SYMBOL_SIZE * 0.25}
	<Container x={props.x ?? 0} y={(props.y ?? 0) - SYMBOL_SIZE * 0.1}>
		<Graphics
			draw={(g) => {
				g.clear();
				g.circle(4, 4, r).fill(0x1e1b1a);
				g.circle(0, 0, r).fill(plate).stroke({ width: 4, color: 0x1e1b1a });
				g.circle(0, 0, r - 7).stroke({ width: 2, color: ink, alpha: 0.6 });
			}}
		/>
		<Text
			anchor={0.5}
			y={2}
			text={label}
			style={{
				fontFamily: NUMBER_FONT,
				fontSize: label.length > 3 ? 30 : label.length > 2 ? 38 : 46,
				fill: ink,
				fontWeight: '400',
			}}
		/>
	</Container>
{/if}
