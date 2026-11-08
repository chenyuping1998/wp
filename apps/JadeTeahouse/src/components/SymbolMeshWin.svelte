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
	import { Mesh, MeshGeometry, Sprite, Container, Rectangle, Text, Texture, Graphics as PixiGraphicsClass } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
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
	// the additive rim light's peak (at the top of the leap) and its colour
	const RIM_ALPHA = 0.22, RIM_TINT = 0xffe2a8;
	// the gloss band's pass (ms into the act): over the top of the leap
	const GLOSS_FROM = 300, GLOSS_MS = 420;
	// SymbolWinAnim's frame: an ink-red keyline under a paper one
	const fit = (SYMBOL_SIZE * props.symbolInfo.sizeRatios.height) / CANVAS;

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
		// THE RIM LIGHT (2026-10-31, slot-motion-recipes §1.2 layer 5): the same
		// mesh again, additive in a warm gold, its strength riding the leap —
		// ~22% at the top of the jump, a smaller flash on the second hop, nothing
		// on the ground. Idles and landings barely leave the card, so they only
		// glow faintly, which is what an idle should do. Shares the geometry, so
		// it bends with every part of the act at no extra skinning cost.
		const rim = new Mesh({ geometry, texture: subjectTex });
		rim.blendMode = 'add';
		rim.tint = RIM_TINT;
		rim.alpha = 0;

		// THE WIN IS LIGHT ON THE PICTURE, NOT A SHAPE AROUND IT (2026-11-01, as
		// Purrfia / Parrot; user: no stars, hard rings or box flashes — "太粗糙").
		// The hard keyline box round each paying cell is gone. A winning symbol
		// gets a warm soft backlight for the length of the act (brighter at the
		// top of the leap) and one gloss band that sweeps across the art itself
		// while it is in the air: the same mesh again, additive, seen through a
		// moving diagonal Graphics stencil (an alpha sprite mask shows nothing in
		// this pixi build). Lands and idles get neither.
		// a real win act (lands and idles pass their own `spec`); the Scatter's
		// win counts too
		const winning = !props.spec;
		const glowTex = assets.fxSoftGlow as Texture | undefined;
		const backlight = winning && glowTex ? new Sprite(glowTex) : null;
		if (backlight) {
			backlight.anchor.set(0.5);
			backlight.position.set(CANVAS / 2, CANVAS / 2);
			backlight.width = backlight.height = CANVAS * 1.45;
			backlight.blendMode = 'add';
			backlight.tint = 0xffd99a;
			backlight.alpha = 0;
		}
		const gloss = winning ? new Mesh({ geometry, texture: subjectTex }) : null;
		const glossMask = winning ? new PixiGraphicsClass() : null;
		if (gloss && glossMask) {
			gloss.blendMode = 'add';
			gloss.alpha = 0.55;
			gloss.mask = glossMask;
		}

		const content = new Container();
		content.position.set(-CANVAS / 2, -CANVAS / 2);
		if (backlight) content.addChild(backlight);
		if (shadow) content.addChild(shadow);
		content.addChild(subject);
		content.addChild(rim);
		if (gloss && glossMask) {
			content.addChild(gloss);
			content.addChild(glossMask);
		}
		// ink motion marks round the act (game/meshWin/inkFx.ts): wins only
		const inkFx = winning && HAS_INK_FX.has(spec.symbol) ? new PixiGraphicsClass() : null;
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
			// the rim light pulses ON the act's beats (act.ts glowPulse via pose.flash),
			// or follows the height for acts that do not key it
			rim.alpha = RIM_ALPHA * Math.min(1, Math.max(0, pose.flash > 0 ? pose.flash / 0.22 : pose.air));
			if (inkFx) drawInkFx(inkFx, spec.symbol, t, spec.feetY, pose.rigid);
			if (backlight) {
				const fade = Math.min(1, t / 160) * Math.min(1, Math.max(0, (spec.durationMs - t) / 260));
				backlight.alpha = (0.26 + 0.24 * Math.min(1, Math.max(0, pose.air))) * fade;
			}
			if (gloss && glossMask) {
				// one pass, left to right, while the symbol is up
				const k = (t - GLOSS_FROM) / GLOSS_MS;
				gloss.visible = k > 0 && k < 1;
				glossMask.clear();
				if (gloss.visible) {
					const x = -90 + (CANVAS + 180) * k;
					const band = 42;
					glossMask.poly([x, 0, x + band, 0, x + band - 70, CANVAS, x - 70, CANVAS]).fill(0xffffff);
				}
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


{#if dust}
	<!-- the landing, at the subject's feet -->
	<ImpactDust
		x={props.x ?? 0}
		y={(props.y ?? 0) + (spec.feetY - CANVAS / 2) * fit}
		oncomplete={() => (dust = false)}
	/>
{/if}
