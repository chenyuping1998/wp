<script lang="ts" module>
	import { buildRig, type Rig } from '../game/meshWin/meshRig';
	import type { MeshWinSpec } from '../game/meshWin';

	// one rig per spec for every copy on the board — it depends only on the drawing
	const rigs = new Map<string, Rig>();
	const rigFor = (spec: MeshWinSpec) => {
		let rig = rigs.get(spec.symbol);
		if (!rig) rigs.set(spec.symbol, (rig = buildRig(spec.rig)));
		return rig;
	};
</script>

<script lang="ts">
	/**
	 * A winning symbol's act: the PAINTING leaps off its card (Jade Teahouse,
	 * 2026-10-09, 「讓圖案本身動起來」).
	 *
	 * Every Jade symbol is a cut-out painting drawn over a separate paper card
	 * (Symbol.svelte draws the card, and keeps drawing it). So the card never
	 * moves; this draws, on top of it, in the 256px canvas of the art:
	 *   shadow   a soft silhouette ON THE CARD, spreading and darkening as the
	 *            subject rises; it follows the subject sideways, never up
	 *   subject  the painting (or the royal's letter) through a deforming mesh
	 * The acting lives in game/meshWin/*.ts; this only feeds pixi the pose.
	 *
	 * The royals' letters are pixi Text on their label. The mesh's texture is
	 * rendered from a Text with the very same style and box, so the letter that
	 * leaps is pixel for pixel the one that was there.
	 *
	 * No light: a screenprint has none (ART_BRIEF.md §0).
	 */
	import { Mesh, MeshGeometry, Sprite, Container, Rectangle, Text, Texture } from 'pixi.js';
	import { Graphics, getContextApp, getContextParent } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBetDerived } from 'state-shared';
	import { onMount } from 'svelte';

	import { SYMBOL_SIZE } from '../game/constants';
	import { GAME_FONT } from '../game/fonts';
	import { getSymbolInfo } from '../game/utils';
	import { CANVAS, skin } from '../game/meshWin/meshRig';
	import { MESH_WINS } from '../game/meshWin';
	import ImpactDust from './ImpactDust.svelte';

	type Props = {
		x?: number;
		y?: number;
		symbolName: string;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		/** a spec to play instead of the symbol's win (an idle act, a landing) */
		spec?: MeshWinSpec;
		/** the royal's letter, when the symbol is one */
		letter?: string;
		/** play at normal speed whatever the bet speed — the landings: the reels
		 *  must settle together, as the sprite squash always did */
		fixedSpeed?: boolean;
		/** which reel the cell is on */
		reel?: number;
		/** the pay frame round the cell (every winning symbol but the Scatter) */
		showWinFrame?: boolean;
		oncomplete?: () => void;
	};

	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();
	const spec = props.spec ?? MESH_WINS[props.symbolName];

	const SHADOW_ALPHA = 0.35, SHADOW_SPREAD = 0.12, SHADOW_DROP = 3;
	// SymbolWinAnim's frame: an ink-red keyline under a paper one
	const FRAME = 0xefeadc, KEYLINE = 0xb87b60;

	const fit = (SYMBOL_SIZE * props.symbolInfo.sizeRatios.height) / CANVAS;

	const drawFrame = (g: PixiGraphics) => {
		g.clear();
		const w = SYMBOL_SIZE * props.symbolInfo.sizeRatios.width;
		const h = SYMBOL_SIZE * props.symbolInfo.sizeRatios.height;
		const inset = SYMBOL_SIZE * 0.02;
		g.roundRect(-w / 2 + inset + 2, -h / 2 + inset + 2, w - inset * 2, h - inset * 2, SYMBOL_SIZE * 0.05).stroke({ width: 2, color: KEYLINE });
		g.roundRect(-w / 2 + inset, -h / 2 + inset, w - inset * 2, h - inset * 2, SYMBOL_SIZE * 0.05).stroke({ width: 2, color: FRAME });
	};
	let dust = $state(false);

	// the letters' textures, one per letter for the whole session
	const letterTextures = (globalThis as { __jadeLetters?: Map<string, Texture> }).__jadeLetters ??= new Map();
	const letterTexture = (letter: string): Texture | undefined => {
		if (letter === 'Q') return app.stateApp.loadedAssets?.gbQGlyph as Texture | undefined;
		const cached = letterTextures.get(letter);
		if (cached) return cached;
		const renderer = app.stateApp.pixiApplication?.renderer;
		if (!renderer) return undefined;
		// the same Text Symbol.svelte typesets, in the same 140px box
		const box = SYMBOL_SIZE * props.symbolInfo.sizeRatios.height;
		const holder = new Container();
		const text = new Text({
			text: letter,
			anchor: 0.5,
			style: { fontFamily: GAME_FONT, fontWeight: '400', fontSize: letter.length > 1 ? 51 : 62, fill: 0x1e1b1a },
		});
		text.position.set(box / 2, box / 2);
		holder.addChild(text);
		const texture = renderer.generateTexture({
			target: holder,
			frame: new Rectangle(0, 0, box, box),
			resolution: (CANVAS * 2) / box,
			antialias: true,
		});
		holder.destroy({ children: true });
		letterTextures.set(letter, texture);
		return texture;
	};

	const root = new Container();

	onMount(() => {
		const speed = props.fixedSpeed ? 1 : stateBetDerived.timeScale();
		const started = performance.now();
		root.label = `meshWin ${spec.symbol} reel ${props.reel ?? '?'}`;
		// completion and the landing are on TIMERS, not the frame loop: rAF stops
		// in a hidden tab, and the board awaits the completion to move on
		const done = setTimeout(() => props.oncomplete?.(), spec.durationMs / speed);
		const land = setTimeout(() => (dust = !props.spec), spec.landMs / speed);
		const clearTimers = () => {
			clearTimeout(done);
			clearTimeout(land);
		};

		const assets = app.stateApp.loadedAssets ?? {};
		const subjectTex = props.letter ? letterTexture(props.letter) : (assets[spec.sprite ?? spec.key] as Texture | undefined);
		const shadowTex = assets[`${spec.key}Shadow`] as Texture | undefined;
		if (!subjectTex) {
			console.error(`SymbolMeshWin: ${spec.key} subject not loaded`);
			return clearTimers;
		}

		const rig = rigFor(spec);
		const positions = new Float32Array(rig.rest);
		const geometry = new MeshGeometry({ positions, uvs: rig.uvs, indices: rig.indices });

		const shadow = shadowTex ? new Sprite(shadowTex) : null;
		if (shadow) shadow.alpha = 0;
		const subject = new Mesh({ geometry, texture: subjectTex });

		const content = new Container();
		content.position.set(-CANVAS / 2, -CANVAS / 2);
		if (shadow) content.addChild(shadow);
		content.addChild(subject);
		root.addChild(content);
		root.scale.set(fit);
		root.position.set(props.x ?? 0, props.y ?? 0);
		// on top of the card Symbol.svelte draws in the same container
		parent.parent.addChild(root);

		const tick = () => {
			const t = Math.max(0, performance.now() - started) * speed;
			const pose = spec.pose(rig, t);
			skin(rig, pose, spec.feetY, positions);
			geometry.getBuffer('aPosition').update();
			root.scale.set(fit * pose.plateHit);

			if (shadow) {
				const air = pose.air;
				const spread = 1 + SHADOW_SPREAD * air;
				shadow.alpha = SHADOW_ALPHA * air;
				shadow.scale.set((CANVAS / shadow.texture.width) * spread);
				shadow.position.set(
					CANVAS / 2 - (CANVAS * spread) / 2 + pose.rigid.dx,
					spec.feetY - spec.feetY * spread + SHADOW_DROP * air,
				);
			}
		};
		tick();
		const ticker = app.stateApp.pixiApplication?.ticker;
		ticker?.add(tick);

		return () => {
			clearTimers();
			ticker?.remove(tick);
			root.removeFromParent();
			// textures belong to the asset loader (or the letter cache); the
			// geometry is ours
			root.destroy({ children: true });
			geometry.destroy();
		};
	});
</script>

{#if props.showWinFrame ?? true}
	<!-- the pay frame round the cell: still, like the card under it -->
	<Graphics draw={drawFrame} x={props.x ?? 0} y={props.y ?? 0} />
{/if}

{#if dust}
	<!-- the landing, at the subject's feet -->
	<ImpactDust
		x={props.x ?? 0}
		y={(props.y ?? 0) + (spec.feetY - CANVAS / 2) * fit}
		oncomplete={() => (dust = false)}
	/>
{/if}
