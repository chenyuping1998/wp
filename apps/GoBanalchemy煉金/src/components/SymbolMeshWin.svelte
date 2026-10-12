<script lang="ts" module>
	import { buildRig, type Rig } from '../game/meshWin/meshRig';
	import type { MeshWinSpec } from '../game/meshWin';

	// one rig per symbol for every copy on the board — it depends only on the drawing
	const rigs = new Map<string, Rig>();
	const rigFor = (spec: MeshWinSpec) => {
		let rig = rigs.get(spec.symbol);
		if (!rig) rigs.set(spec.symbol, (rig = buildRig(spec.rig)));
		return rig;
	};
</script>

<script lang="ts">
	/**
	 * A high-pay symbol's win, drawn as a plate and a subject that ACTS on it.
	 *
	 * Every other symbol's win is a Spine clip that turns and scales the whole
	 * plate as one flat picture. Here the stone stays put (it only takes a knock
	 * on the hit and the landing) and the subject — cut off its plate by
	 * design/make_symbol_layers.mjs — performs through a deforming mesh. The
	 * acting lives in game/meshWin/h*.ts; this component only builds the pixi
	 * objects and feeds them the pose each frame.
	 *
	 * Bottom up, under one container, all in the 256px canvas of the art:
	 *   plate    the stone with the subject lifted off it
	 *   shadow   a soft silhouette ON THE STONE, spreading and darkening as the
	 *            subject rises; it follows the subject sideways, never up
	 *   subject  the mesh
	 * and the landing dust (ImpactDust) in the markup below.
	 *
	 * NO LIGHT. Go Banalchemy drew an additive copy of the whole painting on the
	 * hit (flash), a light sweep, a halo, a beam, glowing particles, a comet
	 * round the pay frame and corner stars. On these full-tile paintings that lit
	 * the entire cell white and was too harsh to look at (2026-10-04), so the
	 * win is carried by the mesh acting and the cell's pop alone.
	 *
	 * PANEL mode (every symbol here — meshRig.panelParts): the subject is
	 * painted onto its panel rather than cut off it, so there is no plate and no
	 * shadow: the mesh draws the symbol's own sprite, the frame held still by
	 * the rig.
	 */
	import { Mesh, MeshGeometry, Sprite, Container, Texture } from 'pixi.js';
	import { Graphics, getContextApp, getContextParent } from 'pixi-svelte';
	import type { Graphics as PixiGraphics } from 'pixi.js';
	import { stateBetDerived } from 'state-shared';
	import { onMount } from 'svelte';

	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolInfo } from '../game/utils';
	import { CANVAS, skin } from '../game/meshWin/meshRig';
	import { MESH_WINS } from '../game/meshWin';
	import { winTimeScale } from '../game/timeScale';
	import ImpactDust from './ImpactDust.svelte';

	type Props = {
		x?: number;
		y?: number;
		symbolName: string;
		symbolInfo: ReturnType<typeof getSymbolInfo>;
		/** a spec to play instead of the symbol's win (the dynamite's landing) */
		spec?: MeshWinSpec;
		/** which reel the cell is on: the win cascades left to right */
		reel?: number;
		/** the gold pay frame round the cell (every winning symbol but the Scatter) */
		showWinFrame?: boolean;
		oncomplete?: () => void;
	};

	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();
	const spec = props.spec ?? MESH_WINS[props.symbolName];

	const SHADOW_ALPHA = 0.55, SHADOW_SPREAD = 0.12, SHADOW_DROP = 3;
	const GOLD = 0xffd75e;

	const fit = (SYMBOL_SIZE * props.symbolInfo.sizeRatios.height) / CANVAS;

	// THE CELL STAYS STILL (2026-10-04). It used to pop to 1.28x, hop and — for
	// the highs — crouch, swell and flip as a whole tile (highJump.ts). The user
	// asked for the PICTURE to jump instead of the cell, so every symbol that can
	// be cut off its plate now is (design/make_alchemy_layers.py) and does its
	// leap, flip and squash in the mesh's own rigid move, over a plate that never
	// moves; the Wild, a portrait filling its tile, acts inside its panel.

	const drawFrame = (g: PixiGraphics) => {
		g.clear();
		const half = (SYMBOL_SIZE * props.symbolInfo.sizeRatios.height) / 2;
		const inset = SYMBOL_SIZE * 0.02;
		g.roundRect(-half + inset, -half + inset, (half - inset) * 2, (half - inset) * 2, SYMBOL_SIZE * 0.05).stroke({
			width: SYMBOL_SIZE * 0.03,
			color: GOLD,
			alpha: 0.9,
		});
	};
	let dust = $state(false);

	const root = new Container();

	onMount(() => {
		// the free game's wins are the payoff: turbo shortens them to ~74%, not
		// half (game/timeScale.ts)
		const speed = props.spec ? stateBetDerived.timeScale() : winTimeScale();
		const started = performance.now();
		// No cascade delay of its own here. GoBananubis staggers its line 60ms a
		// reel in this component; in this game WinWays already lights the win
		// reel by reel (90ms apart, 40 in turbo) and each cell mounts as its reel
		// is reached, so a second stagger on top would double it.
		const delay = 0;
		root.label = `meshWin ${spec.symbol} reel ${props.reel ?? '?'} +${delay}ms`;
		// completion and the landing are on TIMERS, not the frame loop: rAF stops
		// in a hidden tab, and the board awaits the completion to move on
		const done = setTimeout(() => props.oncomplete?.(), (delay + spec.durationMs) / speed);
		const land = setTimeout(() => (dust = true), (delay + spec.landMs) / speed);
		const clearTimers = () => {
			clearTimeout(done);
			clearTimeout(land);
		};

		const assets = app.stateApp.loadedAssets ?? {};
		const tex = (key: string) => assets[key] as Texture | undefined;
		const panelMode = spec.mode === 'panel';
		const plateTex = panelMode ? undefined : tex(`${spec.key}Plate`);
		const shadowTex = panelMode ? undefined : tex(`${spec.key}Shadow`);
		const subjectTex = panelMode ? tex(spec.sprite ?? spec.key) : tex(`${spec.key}Subject`);
		if (!subjectTex || (!panelMode && (!plateTex || !shadowTex))) {
			console.error(`SymbolMeshWin: ${spec.key} layers not loaded`);
			return clearTimers;
		}

		const rig = rigFor(spec);
		const positions = new Float32Array(rig.rest);
		const geometry = new MeshGeometry({ positions, uvs: rig.uvs, indices: rig.indices });

		const plate = plateTex ? new Sprite(plateTex) : null;
		plate?.setSize(CANVAS, CANVAS);
		const shadow = shadowTex ? new Sprite(shadowTex) : null;
		if (shadow) {
			shadow.setSize(CANVAS, CANVAS);
			shadow.alpha = 0;
		}
		const subject = new Mesh({ geometry, texture: subjectTex });

		const content = new Container();
		content.position.set(-CANVAS / 2, -CANVAS / 2);
		for (const layer of panelMode ? [subject] : [plate, shadow, subject]) if (layer) content.addChild(layer);
		root.addChild(content);
		root.position.set(props.x ?? 0, props.y ?? 0);
		// A win's subject leaps out past its cell, so it goes on TOP of the cells
		// round it; a landing or an idle act stays in its cell, under the rest.
		if (!props.spec) parent.parent.addChild(root);
		else parent.parent.addChildAt(root, 0);

		const tick = () => {
			const t = Math.max(0, performance.now() - started - delay / speed) * speed;
			const pose = spec.pose(rig, t);
			skin(rig, pose, spec.feetY, positions);
			geometry.getBuffer('aPosition').update();
			root.scale.set(fit * pose.plateHit);
			root.position.set(props.x ?? 0, props.y ?? 0);

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
			// textures belong to the asset loader; the geometries are ours
			root.destroy({ children: true });
			geometry.destroy();
		};
	});
</script>

{#if props.showWinFrame ?? true}
	<!-- The gold pay frame round the cell. GoBananubis draws the template's
	     `payframe` spine here; this game dropped that asset (gen-2 art), and
	     the frame is drawn in code instead — the same gold and weight as the
	     one SymbolWinAnim draws, but still: the plate does not move, only what
	     is on it. -->
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
