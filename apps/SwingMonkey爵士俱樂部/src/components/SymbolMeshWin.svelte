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
	import { Mesh, MeshGeometry, Sprite, Container, Rectangle, Text, Texture, Matrix, Graphics as InkGraphics } from 'pixi.js';
	import { Graphics, getContextApp, getContextParent } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBetDerived } from 'state-shared';
	import { onMount } from 'svelte';

	import { SYMBOL_SIZE } from '../game/constants';
	import { GAME_FONT } from '../game/fonts';
	import { getSymbolInfo } from '../game/utils';
	import { CANVAS, skin } from '../game/meshWin/meshRig';
	import { MESH_WINS } from '../game/meshWin';
	import { JAZZ_HITS, noteProgress } from '../game/meshWin/phrase';
	import { drawInstrumentAccents } from '../game/meshWin/instrumentAccents';
	import { writePerformanceAffine } from '../game/meshWin/performanceAffine';
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
		/** which reel the cell is on */
		reel?: number;
		/** the pay frame round the cell (every winning symbol but the Scatter) */
		showWinFrame?: boolean;
		oncomplete?: () => void;
		/** play at normal speed whatever the bet speed (the landings) */
		fixedSpeed?: boolean;
	};

	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();
	const spec = props.spec ?? MESH_WINS[props.symbolName];

	const SHADOW_ALPHA = 0.35, SHADOW_SPREAD = 0.12, SHADOW_DROP = 3;
	// SymbolWinAnim's frame: an ink-red keyline under a paper one
	const FRAME = 0xf3e9d2, KEYLINE = 0xd9342b;

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
			style: { fontFamily: GAME_FONT, fontWeight: '400', fontSize: letter.length > 1 ? 51 : 62, fill: 0x161412 },
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
	const noteOrigins: Record<string, [number, number]> = {
		H1: [214, 70], H2: [205, 75], H3: [185, 60], H4: [210, 95],
	};

	onMount(() => {
		const speed = props.fixedSpeed ? 1 : stateBetDerived.timeScale();
		const playingInstrument = ['H1', 'H2', 'H3', 'H4'].includes(spec.symbol);
		const started = performance.now();
		root.label = `meshWin ${spec.symbol} reel ${props.reel ?? '?'}`;
		// completion and the landing are on TIMERS, not the frame loop: rAF stops
		// in a hidden tab, and the board awaits the completion to move on
		const done = setTimeout(() => props.oncomplete?.(), spec.durationMs / speed);
		const land = setTimeout(() => (dust = !props.spec && !playingInstrument), spec.landMs / speed);
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
		const ink = new InkGraphics();
		const effects = new Container();
		effects.addChild(ink);
		content.addChild(subject, effects);
		const affine = new Float64Array(6), effectMatrix = new Matrix();
		// Printed ink notes answer the actual instrument hits. They live in the
		// subject canvas, so every winning copy follows its own cell; idle and land
		// acts do not emit them. Keep them outside the instrument's main silhouette.
		const beats = props.spec ? [] : (JAZZ_HITS[spec.symbol] ?? []);
		const origin = noteOrigins[spec.symbol] ?? [128, 90];
		const notes = beats.map((_, i) => {
			const note = new Text({
				text: i % 2 ? '♫' : '♪', anchor: 0.5,
				style: { fontFamily: 'Georgia, serif', fontSize: i % 2 ? 39 : 45,
					fill: 0x8e2936, stroke: { color: 0xf4e7c8, width: 3 } },
			});
			note.alpha = 0;
			effects.addChild(note);
			return note;
		});
		root.addChild(content);
		root.scale.set(fit);
		root.position.set(props.x ?? 0, props.y ?? 0);
		// on top of the card Symbol.svelte draws in the same container
		parent.parent.addChild(root);

		let finalFrameDrawn = false;
		const tick = () => {
			if (finalFrameDrawn) return;
			const t = Math.min(spec.durationMs, Math.max(0, performance.now() - started) * speed);
			const pose = spec.pose(rig, t);
			skin(rig, pose, spec.feetY, positions);
			geometry.getBuffer('aPosition').update();
			root.scale.set(fit * pose.plateHit);
			writePerformanceAffine(pose.rigid, spec.feetY, affine);
			effectMatrix.set(affine[0], affine[1], affine[2], affine[3], affine[4], affine[5]);
			effects.setFromMatrix(effectMatrix);
			ink.clear();
			if (!props.spec) drawInstrumentAccents(ink, spec.symbol, t);
			notes.forEach((note, i) => {
				const age = noteProgress(t, beats[i], spec.durationMs);
				if (age === null) { note.alpha = 0; return; }
				const rise = 1 - (1 - age) ** 2;
				note.position.set(origin[0] + i % 2 * 12 + 16 * Math.sin(age * 3.2 + i), origin[1] - 45 * rise - i % 2 * 9);
				note.rotation = (i % 2 ? 1 : -1) * (0.12 + age * 0.12);
				note.scale.set(0.65 + 0.35 * Math.sin(Math.PI * Math.min(1, age * 1.2)));
				note.alpha = Math.min(1, age * 7) * (1 - age) ** 0.7 * (playingInstrument ? 0.7 : 1);
			});

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
			finalFrameDrawn = t >= spec.durationMs;
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
