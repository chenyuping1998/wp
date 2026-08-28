<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';
	import {
		getSymbolRig,
		partFrame,
		partKey,
		resolvePivot,
		hasIdleVariant,
		glowAlpha,
	} from '../game/symbolParts';
	import { isBlinking } from '../game/blinkClock';
	import { getSwayRig, swayFrame } from '../game/idleSway';
	import { poseKeyAt, smearAt } from '../game/posePlan';
	import { HOLD_MS } from '../game/symbolWinMotion';
	import { PARTS_MANIFEST } from '../game/partsManifest';

	/**
	 * The symbol's art, drawn either as the single flat sprite it has always been
	 * or — where the art has been delivered cut into layers — as a stack of parts
	 * with their own transforms.
	 *
	 * Every place that used to write `<Sprite key={symbolInfo.assetKey} …/>` goes
	 * through here instead, so the rigged and unrigged paths cannot drift: the
	 * win animation, the landing and the resting board all get the same geometry,
	 * the same size ratios and the same additive overlay treatment.
	 *
	 * A symbol with no rig renders EXACTLY what it rendered before — one sprite,
	 * one draw call — so rigging one symbol costs nothing anywhere else.
	 */
	type Props = {
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		/** board symbol name (H4, S, …); selects the rig */
		symbolName?: string;
		/** which motion the parts should run, if any */
		mode?: 'win' | 'land' | 'none';
		/** milliseconds into that motion */
		t?: number;
		/**
		 * Draw the art as an additive copy in this tint instead of normally — the
		 * white impact flash and the neon-tube bloom both come through here so a
		 * rigged symbol's flash follows its parts instead of ghosting the
		 * un-rigged pose over the top of them.
		 */
		overlayTint?: number;
		overlayAlpha?: number;
		/** multiplies the drawn size, for callers that scale the art itself */
		scale?: number;
		/**
		 * Which cell this is. Only used to give the symbol its own blink rhythm —
		 * without it a cell simply never blinks, which is the right fallback for
		 * the places that draw a symbol outside the reels (the pay table, the
		 * intro).
		 */
		cell?: { reel: number; row: number };
		/** this win is a big one: unlocks the rarer face */
		big?: boolean;
		/**
		 * Time on the shared idle clock, ms. Supplying it lets the two CHARACTER
		 * symbols sway while the board is settled (game/idleSway.ts) — they draw
		 * their part stack at rest instead of the flat sprite. Omitting it is the
		 * old behaviour for every symbol: one draw call and no motion but the
		 * ambient breath.
		 */
		swayT?: number;
	};

	const props: Props = $props();

	const width = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.width * (props.scale ?? 1));
	const height = $derived(SYMBOL_SIZE * props.symbolInfo.sizeRatios.height * (props.scale ?? 1));
	// Rigged only where the parts are actually doing something. At rest — the
	// spinning strip and the settled board, which is the overwhelming majority of
	// frames — a rigged symbol draws its ORIGINAL flat sprite: one draw call
	// instead of four per cell, and pixel-identical, because check_parts.py
	// requires the stack to match the artist's assembled _full.png (H4 measures
	// IoU 1.00). The stack only appears for the beats that need it.
	// A blink needs the part stack while the board is at rest, but only for the
	// ~110ms it lasts. `blinkTick` is driven by a shared clock rather than a timer
	// per cell: twenty cells each running their own interval is twenty wakeups a
	// second to show nothing.
	let blinkTick = $state(0);
	const idleRig = $derived(getSymbolRig(props.symbolName ?? ''));
	const canBlink = $derived(!!props.cell && hasIdleVariant(idleRig));
	$effect(() => {
		if (!canBlink) return;
		const id = setInterval(() => (blinkTick = performance.now()), 90);
		return () => clearInterval(id);
	});
	const blinking = $derived(
		canBlink && props.cell ? isBlinking(props.cell.reel, props.cell.row, blinkTick) : false,
	);

	// The two people sway on a settled board; everything else keeps drawing its
	// single flat sprite. Gated on `cell` as well as on the clock so the pay
	// table and the intro — which draw symbols outside the reels — are untouched.
	const sway = $derived(
		props.mode === 'none' && props.swayT !== undefined && props.cell
			? getSwayRig(props.symbolName ?? '')
			: null,
	);

	const rig = $derived(
		poseKey
			? null
			: (props.mode && props.mode !== 'none') || blinking || sway
				? getSymbolRig(props.symbolName ?? '')
				: null,
	);
	// ── the pose sheet ─────────────────────────────────────────────────────────
	//
	// Three more DRAWINGS of this symbol, played as a timeline through the win
	// hold (game/posePlan.ts). When one is up it REPLACES the art entirely — flat
	// sprite and rigged stack alike — because a pose changes the silhouette, and
	// the parts stack is exactly the thing that cannot.
	//
	// Only h1 and h2 have sheets; every other symbol returns null here and renders
	// precisely what it rendered before.
	const poseKey = $derived(
		mode === 'win' ? poseKeyAt(props.symbolName ?? '', props.t ?? 0, HOLD_MS) : null,
	);
	// A cut between two drawings is a cut; a cut with one stretched frame either
	// side is a movement. Horizontal only — the stretch is along the direction the
	// character is moving, which is what a smear frame is.
	const smear = $derived(poseKey ? smearAt(props.t ?? 0, HOLD_MS) : 0);

	const overlay = $derived((props.overlayAlpha ?? 0) > 0.01);
	// The symbol's own light, on only while it is paying. Skipped entirely when
	// this instance is drawing the flash or bloom copy — a light drawn three times
	// over itself is just a white blob.
	const glow = $derived(
		mode === 'win' && !overlay ? (getSymbolRig(props.symbolName ?? '')?.glow ?? null) : null,
	);
	const mode = $derived(props.mode ?? 'none');

	// Sizes are multiples of the symbol's own draw size, not pixels: the car is
	// 470px of art across and the J is 205, and one pixel value cannot be right
	// for both. 1.045 is a hair over 2px of edge on a 118px cell.
	const EDGE_COLOR = 0x12071f;
	const SHADOW_SCALE = 1.07;
	const SHADOW_OFFSET = { x: 3, y: 9 };
	const RIM_COLOR = 0xfff6e8;

	// The royals get the heavier treatment, and it is not decoration.
	//
	// They are the most common symbols on the grid and they are the thinnest art
	// in the game: four flat letter shapes with a glow. In the reference build
	// they are the LOUDEST thing on the board — chunky gradient letters with a
	// thick light rim inside a dark border, which is what makes them read as
	// extruded plastic instead of as coloured type. The premiums are already
	// illustrations with their own painted outlines, so they need a border to
	// separate them from the panel and nothing more.
	const RIM_SYMBOLS = ['L1', 'L2', 'L3', 'L4'];
	const hasRim = $derived(RIM_SYMBOLS.includes(props.symbolName ?? ''));
	const EDGE_SCALE = $derived(hasRim ? 1.105 : 1.05);
	const RIM_SCALE = 1.055;

	// Parts are authored on the same square canvas as the flat symbol, so a part
	// is drawn at the symbol's full size and lands in place by its own transparent
	// margins. Its pivot comes from the measured bbox (partsManifest.ts): the
	// container sits ON the pivot and the sprite is pushed back by the same
	// amount, which is what makes a rotation happen about the handle's mounting
	// point rather than about the middle of the cell.
	const geometry = $derived(
		(rig?.parts ?? []).map((part) => {
			const metrics = PARTS_MANIFEST[(props.symbolName ?? '').toLowerCase()]?.[part.name];
			const [px, py] = resolvePivot(metrics?.bbox, part.pivot);
			// Win/land motion and idle sway are the same kind of thing — an offset
			// on top of the part's resting pose — so they compose by addition, the
			// same way part motion already composes with whole-symbol motion.
			// They never run together in practice (sway is rest-only), but adding
			// rather than branching means a future beat that overlaps them does not
			// need this line rewritten.
			const motion = mode === 'none' ? null : partFrame(part, mode, props.t ?? 0);
			const drift = sway ? swayFrame(sway, part.name, props.swayT ?? 0) : null;
			const frame =
				motion || drift
					? {
							dx: (motion?.dx ?? 0) + (drift?.dx ?? 0),
							dy: (motion?.dy ?? 0) + (drift?.dy ?? 0),
							rotation: (motion?.rotation ?? 0) + (drift?.rotation ?? 0),
							scaleX: motion?.scaleX ?? 1,
							scaleY: (motion?.scaleY ?? 1) * (drift?.scaleY ?? 1),
						}
					: null;
			const key = partKey(part, { mode, big: props.big, blinking });
			return { part, px, py, frame, key };
		}),
	);
</script>

<!--
	WEIGHT: a shadow and an edge, drawn under whichever art follows.

	The reference build the user pointed at (MadLab's Nights of Miami — same
	5x4/14-line shape, same engine, and it passed the review this game has now
	failed three times) draws every symbol with a hard drop shadow and a heavy
	border, and its royals with a bright rim inside that border. Ours were flat
	art dropped straight onto a flat purple panel. The difference does not read
	as a different style: theirs are objects sitting on a board, ours are
	stickers printed on it.

	Done as two extra draws of the SYMBOL'S OWN TEXTURE rather than as baked
	art, for three reasons that all turned out to matter:

	  · the art already fills its 512 canvas (h2/h3/h4 run to within 20px of the
	    edge), so a baked outline would be clipped flat across the flamingo's
	    beak and the boombox's handle;
	  · scaling a tinted copy gives an outline PROPORTIONAL to the symbol, so
	    one number is right for a wide car and a narrow letter;
	  · it applies to the rigged path for free. The parts stack replaces the flat
	    art during a win, which is exactly when the symbol is biggest — a baked
	    edge would vanish at that moment, or would have to be baked into every
	    part and would then draw a seam around each one.

	The silhouette used is always the flat symbol, so it stays put while parts
	move on top of it. That is also how it should behave: the shadow belongs to
	the symbol's footprint, not to its head turning.

	Not drawn for the flash/bloom copies (`overlay`) — those are additive passes
	of the same art, and a black shadow added to a white flash is a grey smear.
-->
{#if !overlay}
	<Sprite
		anchor={0.5}
		key={props.symbolInfo.assetKey}
		width={width * SHADOW_SCALE}
		height={height * SHADOW_SCALE}
		x={SHADOW_OFFSET.x}
		y={SHADOW_OFFSET.y}
		tint={0x000000}
		alpha={0.5}
	/>
	<Sprite
		anchor={0.5}
		key={props.symbolInfo.assetKey}
		width={width * EDGE_SCALE}
		height={height * EDGE_SCALE}
		tint={EDGE_COLOR}
	/>
	{#if hasRim}
		<!--
			Royals only. They are neon TUBES: a bright inner edge is what makes a
			letter read as extruded rather than as a coloured shape, and it is the
			single clearest difference between the reference's royals and ours.
			Warm white rather than pure white, which over the pink and violet
			letters goes lilac and looks like a mis-print.
		-->
		<Sprite
			anchor={0.5}
			key={props.symbolInfo.assetKey}
			width={width * RIM_SCALE}
			height={height * RIM_SCALE}
			tint={RIM_COLOR}
		/>
	{/if}
{/if}

{#if rig}
	{#each geometry as { part, px, py, frame, key } (part.name)}
		<Container
			x={(px + (frame?.dx ?? 0)) * width}
			y={(py + (frame?.dy ?? 0)) * height}
			rotation={frame?.rotation ?? 0}
			scale={{ x: frame?.scaleX ?? 1, y: frame?.scaleY ?? 1 }}
		>
			<Sprite
				anchor={0.5}
				{key}
				x={-px * width}
				y={-py * height}
				{width}
				{height}
				tint={overlay ? props.overlayTint : undefined}
				alpha={overlay ? props.overlayAlpha : 1}
				blendMode={overlay ? 'add' : undefined}
			/>
		</Container>
	{/each}
{:else}
	<Sprite
		anchor={0.5}
		key={poseKey ?? props.symbolInfo.assetKey}
		width={width * (1 + 0.16 * smear)}
		height={height * (1 - 0.05 * smear)}
		tint={overlay ? props.overlayTint : undefined}
		alpha={overlay ? props.overlayAlpha : 1}
		blendMode={overlay ? 'add' : undefined}
	/>
{/if}

{#if glow}
	<!--
		The symbol's own light: last, so it sits over the art rather than under it.
		The boombox's equaliser and the car's headlamps are painted into their base
		art as dark shapes — the point of the layer is that they light UP, which
		only reads if it is drawn on top of them.
	-->
	<Sprite
		anchor={0.5}
		key={glow.key}
		{width}
		{height}
		alpha={glowAlpha(glow, props.t ?? 0)}
		blendMode="add"
	/>
{/if}
