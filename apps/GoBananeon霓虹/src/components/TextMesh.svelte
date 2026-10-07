<script lang="ts">
	/**
	 * Text drawn through a deforming grid (game/meshWin/textMesh.ts), so the
	 * letters can hop one after another, squash, stretch and wobble — what the
	 * FG counter's title and count do on a spin, a retrigger and a new rung.
	 *
	 * The text is laid out OFF SCREEN, in GoldText's three passes (shadow, body,
	 * sheen) when `bevel` is on, rendered to a texture, and that texture is the
	 * mesh's. Re-rendered only when the text or its look changes, never per
	 * frame. The grid's rest positions are the text's own local bounds, so at
	 * rest the mesh sits exactly where the plain Text would have.
	 *
	 * Driven by setInterval, like the rest of the counter: it keeps time in a
	 * hidden tab.
	 */
	import { Container, Mesh, MeshGeometry, Rectangle, Text, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { verticalFill } from '../game/gradientFill';
	import { deformText, type TextAct } from '../game/meshWin/textMesh';

	type Props = {
		text: string | number;
		fontSize: number;
		fill: number[];
		stroke: number;
		x?: number;
		y?: number;
		/** scale down uniformly if wider than this */
		maxWidth?: number;
		letterSpacing?: number;
		/** GoldText's bevel passes (shadow + sheen) — for the count */
		bevel?: boolean;
		/** ms since each kick, or < 0 */
		env: { spinT: number; retrigT: number; levelT: number };
		act: TextAct;
	};
	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	const COLS = 32;
	const ROWS = 8;

	const root = new Container();
	root.label = 'textMesh';
	parent.addToParent(root);

	// the grid: fixed UVs and indices, positions rewritten every tick
	const V = (COLS + 1) * (ROWS + 1);
	const positions = new Float32Array(V * 2);
	const uvs = new Float32Array(V * 2);
	const indices = new Uint32Array(COLS * ROWS * 6);
	for (let r = 0; r <= ROWS; r++)
		for (let c = 0; c <= COLS; c++) {
			const i = r * (COLS + 1) + c;
			uvs[i * 2] = c / COLS;
			uvs[i * 2 + 1] = r / ROWS;
		}
	for (let r = 0, k = 0; r < ROWS; r++)
		for (let c = 0; c < COLS; c++, k += 6) {
			const a = r * (COLS + 1) + c;
			indices.set([a, a + 1, a + COLS + 2, a, a + COLS + 2, a + COLS + 1], k);
		}

	let geometry: MeshGeometry | null = null;
	let mesh: Mesh | null = null;
	let texture: Texture | null = null;
	let box = { x: 0, y: 0, w: 1, h: 1 };
	const started = Date.now();

	const layout = () => {
		const src = new Container();
		const text = String(props.text);
		const fontSize = props.fontSize;
		const base = {
			fontFamily: GAME_FONT,
			fontSize,
			fontWeight: GAME_FONT_WEIGHT,
			letterSpacing: props.letterSpacing ?? 1,
		} as const;
		const bevel = Math.max(1, fontSize * 0.05);
		if (props.bevel) {
			const shadow = new Text({
				text,
				style: { ...base, fill: props.stroke, stroke: { color: props.stroke, width: Math.max(2, fontSize * 0.13) } },
			});
			shadow.anchor.set(0.5);
			shadow.y = bevel;
			shadow.alpha = 0.85;
			src.addChild(shadow);
		}
		const body = new Text({
			text,
			style: {
				...base,
				fill: verticalFill(props.fill, fontSize),
				stroke: { color: props.stroke, width: Math.max(2, fontSize * 0.1) },
				dropShadow: { color: 0x000000, alpha: 1, blur: Math.max(4, fontSize * 0.12), distance: Math.max(1.5, fontSize * 0.045), angle: Math.PI / 2 },
			},
		});
		body.anchor.set(0.5);
		src.addChild(body);
		if (props.bevel) {
			const sheen = new Text({ text, style: { ...base, fill: 0xffffff } });
			sheen.anchor.set(0.5);
			sheen.y = -bevel * 0.55;
			sheen.alpha = 0.3;
			src.addChild(sheen);
		}
		return src;
	};

	const rebuild = () => {
		const renderer = app.stateApp.pixiApplication?.renderer;
		if (!renderer) return false;
		const src = layout();
		// a little margin, so a shadow or a sheen at the edge is not clipped
		const b = src.getLocalBounds();
		const pad = Math.ceil(props.fontSize * 0.15);
		const frame = new Rectangle(Math.floor(b.x) - pad, Math.floor(b.y) - pad, Math.ceil(b.width) + pad * 2, Math.ceil(b.height) + pad * 2);
		const next = renderer.generateTexture({
			target: src,
			frame,
			resolution: Math.max(2, globalThis.devicePixelRatio ?? 1),
			antialias: true,
		});
		src.destroy({ children: true });
		box = { x: frame.x, y: frame.y, w: frame.width, h: frame.height };
		if (!mesh) {
			geometry = new MeshGeometry({ positions, uvs, indices });
			mesh = new Mesh({ geometry, texture: next });
			root.addChild(mesh);
		} else {
			mesh.texture = next;
		}
		texture?.destroy(true);
		texture = next;
		return true;
	};

	const tick = () => {
		if (!mesh || !geometry) return;
		const env = { ...props.env, now: Date.now() - started };
		for (let r = 0; r <= ROWS; r++)
			for (let c = 0; c <= COLS; c++) {
				const i = r * (COLS + 1) + c;
				const [px, py] = deformText(c / COLS, r / ROWS, box.w, box.h, env, props.act);
				positions[i * 2] = box.x + px;
				positions[i * 2 + 1] = box.y + py;
			}
		geometry.getBuffer('aPosition').update();
		// the text's own width, without the margin, is what maxWidth limits
		const textW = box.w - Math.ceil(props.fontSize * 0.15) * 2;
		const fit = props.maxWidth && textW > props.maxWidth ? props.maxWidth / textW : 1;
		root.scale.set(fit);
		root.position.set(props.x ?? 0, props.y ?? 0);
	};

	// re-render the texture when what it shows changes (and once the renderer
	// is there: it may not be on the first frame)
	let pending = true;
	$effect(() => {
		// read everything the texture depends on, so the effect tracks it
		void [props.text, props.fontSize, props.fill.join(','), props.stroke, props.letterSpacing, props.bevel];
		pending = true;
	});

	onMount(() => {
		const id = setInterval(() => {
			if (pending && rebuild()) pending = false;
			tick();
		}, 16);
		return () => {
			clearInterval(id);
			geometry?.destroy();
			texture?.destroy(true);
		};
	});
</script>
