<script lang="ts" module>
	import { buildRig, type Pose, type Rig } from '../game/meshWin/meshRig';
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
	import { Mesh, MeshGeometry, Sprite, Container, Rectangle, Text, Texture, Graphics as PixiGraphicsObj } from 'pixi.js';
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
	import { HAS_INK_FX, drawInkFx } from '../game/meshWin/inkFx';

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
		/** every frame's pose, for things drawn over the mesh that ride it */
		onpose?: (rig: Rig, pose: Pose) => void;
	};

	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();
	const spec = props.spec ?? MESH_WINS[props.symbolName];

	const SHADOW_ALPHA = 0.35, SHADOW_SPREAD = 0.12, SHADOW_DROP = 3;
	// SymbolWinAnim's frame: an ink-red keyline under a paper one
	const FRAME = 0xf4eacb, KEYLINE = 0xe5432f;

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
			style: { fontFamily: GAME_FONT, fontWeight: '400', fontSize: letter.length > 1 ? 51 : 62, fill: 0x1b2a22 },
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
		// the comic ink marks round a WIN (not a landing or an idle act):
		// game/meshWin/inkFx.ts. Over the subject, in its canvas units.
		const inkFx = !props.spec && HAS_INK_FX.has(spec.symbol) ? new PixiGraphicsObj() : null;
		// a part that turns whole about a hub, riding the mesh (H1's sails):
		// placed each frame on the skinned vertex nearest the hub
		const spinTex = spec.spinner ? (assets[spec.spinner.key] as Texture | undefined) : undefined;
		const spinner = spinTex ? new Sprite(spinTex) : null;
		let hubVertex = -1;
		if (spinner && spec.spinner) {
			const [hx, hy] = spec.spinner.hub;
			spinner.anchor.set(hx / CANVAS, hy / CANVAS);
			let best = Infinity;
			for (let v = 0; v < rig.rest.length / 2; v++) {
				const d = Math.hypot(rig.rest[v * 2] - hx, rig.rest[v * 2 + 1] - hy);
				if (d < best) [best, hubVertex] = [d, v];
			}
			// the nearest vertex is off the hub by at most half a cell: keep it
			const off = [hx - rig.rest[hubVertex * 2], hy - rig.rest[hubVertex * 2 + 1]];
			spinner.label = `spinner ${off[0].toFixed(2)},${off[1].toFixed(2)}`;
			(spinner as Sprite & { hubOff?: number[] }).hubOff = off;
			content.addChild(spinner);
		}
		// a part that travels on its own (the low pays' ball, putted into the
		// cup), clipped under the cup's lip while it drops in
		const rollTex = spec.roller ? (assets[spec.roller.key] as Texture | undefined) : undefined;
		const roller = rollTex ? new Sprite(rollTex) : null;
		const rollClip = roller ? new PixiGraphicsObj() : null;
		if (roller && rollClip) {
			roller.anchor.set(0.5);
			content.addChild(rollClip, roller);
		}
		if (inkFx) content.addChild(inkFx);
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
			props.onpose?.(rig, pose);
			if (inkFx) drawInkFx(inkFx, spec.symbol, t, spec.feetY, pose.rigid);
			if (spinner && spec.spinner && hubVertex >= 0) {
				const r = pose.rigid;
				const off = (spinner as Sprite & { hubOff?: number[] }).hubOff ?? [0, 0];
				spinner.position.set(positions[hubVertex * 2] + off[0], positions[hubVertex * 2 + 1] + off[1]);
				spinner.rotation = ((spec.spinner.turn(t) + r.rot) * Math.PI) / 180;
				const k = r.pop * Math.sqrt(Math.abs(r.sx * r.sy));
				spinner.width = spinner.height = CANVAS * k;
			}

			if (roller && rollClip && spec.roller) {
				const b = spec.roller.at(t);
				roller.position.set(b.x, b.y);
				roller.rotation = (b.rot * Math.PI) / 180;
				roller.width = roller.height = spec.roller.size * b.scale;
				roller.alpha = b.alpha;
				rollClip.clear();
				if (b.clipY !== undefined) {
					rollClip.rect(0, 0, CANVAS, b.clipY).fill(0xffffff);
					roller.mask = rollClip;
				} else roller.mask = null;
				rollClip.visible = b.clipY !== undefined;
			}

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
