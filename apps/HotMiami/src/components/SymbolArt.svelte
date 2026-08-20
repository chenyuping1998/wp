<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';
	import { getSymbolRig, partFrame, resolvePivot } from '../game/symbolParts';
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
	const rig = $derived(props.mode && props.mode !== 'none' ? getSymbolRig(props.symbolName ?? '') : null);
	const overlay = $derived((props.overlayAlpha ?? 0) > 0.01);
	const mode = $derived(props.mode ?? 'none');

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
			const frame = mode === 'none' ? null : partFrame(part, mode, props.t ?? 0);
			return { part, px, py, frame };
		}),
	);
</script>

{#if rig}
	{#each geometry as { part, px, py, frame } (part.name)}
		<Container
			x={(px + (frame?.dx ?? 0)) * width}
			y={(py + (frame?.dy ?? 0)) * height}
			rotation={frame?.rotation ?? 0}
			scale={{ x: frame?.scaleX ?? 1, y: frame?.scaleY ?? 1 }}
		>
			<Sprite
				anchor={0.5}
				key={part.key}
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
		key={props.symbolInfo.assetKey}
		{width}
		{height}
		tint={overlay ? props.overlayTint : undefined}
		alpha={overlay ? props.overlayAlpha : 1}
		blendMode={overlay ? 'add' : undefined}
	/>
{/if}
