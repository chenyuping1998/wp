<script lang="ts">
	/**
	 * Text drawn through a deforming grid (game/meshWin/textMesh.ts), so the
	 * letters can hop one after another, squash, stretch, wobble and shiver with
	 * cold — the win amounts, the FS intro/outro and the FG counter's count.
	 * Ported from Go Bananeon (TextMesh), in this game's gold and with a frost
	 * shiver of its own (textMesh.ts `shiver`).
	 *
	 * The text is laid out OFF SCREEN, in GoldText's three passes (shadow, body,
	 * sheen) when `bevel` is on, rendered to a texture, and that texture is the
	 * mesh's. Re-rendered only when the text or its look changes. The grid's
	 * rest positions are the text's own local bounds, so at rest the mesh sits
	 * exactly where the plain Text would have.
	 *
	 * THE TEXT IS LAID OUT ONCE AND KEPT. A win amount changes every frame while
	 * it counts up; building three Text nodes and a fresh texture for every
	 * value would allocate a canvas and a GPU texture per frame. Instead the
	 * passes live for the component's life, a new value only sets their .text,
	 * and they are drawn into ONE render texture that grows in 64px steps (the
	 * UVs take the part the text covers) — so a count-up costs a canvas redraw
	 * and a render, like GoldText's own.
	 *
	 * Driven by setInterval: it keeps time in a hidden tab.
	 */
	import { Container, Matrix, Mesh, MeshGeometry, RenderTexture, Text, type TextStyleOptions } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { GAME_FONT, GAME_FONT_WEIGHT } from '../game/fonts';
	import { verticalFill } from '../game/gradientFill';
	import { deformText, type TextAct, type TextEnv } from '../game/meshWin/textMesh';

	type Props = {
		text: string | number;
		fontSize: number;
		/** GoldText's gold, top to bottom */
		fill?: number[];
		/** GoldText's default dark brown outline */
		stroke?: number;
		/** outline width; default fontSize * 0.1 (GoldText's body) */
		strokeWidth?: number;
		/** drop shadow blur and distance; default GoldText's */
		shadow?: { blur: number; distance: number };
		x?: number;
		y?: number;
		/** as Text's anchor; default centred. maxWidth scales about this point. */
		anchor?: number | { x: number; y: number };
		/** scale down uniformly if wider than this */
		maxWidth?: number;
		letterSpacing?: number;
		/** GoldText's bevel passes (shadow + sheen) — for the numbers */
		bevel?: boolean;
		/** ms since each kick, or < 0 (any left out are off) */
		env?: Omit<TextEnv, 'now'>;
		/** OR when each kick happened, as Date.now() — for callers without a
		 *  clock of their own; turned into env each tick */
		at?: Partial<Record<'spin' | 'retrig' | 'level' | 'roll' | 'land' | 'stamp', number>>;
		act: TextAct;
	};
	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	// GoldText's own gold and outline — which GoldText itself never actually
	// showed: an array `fill` is read by pixi v8 as one normalised colour and
	// clamps to white (game/gradientFill.ts). Here it is the real gradient.
	const DEFAULT_FILL = [0xfff3bd, 0xffd75e, 0xc9821a];
	const DEFAULT_STROKE = 0x54330a;

	const COLS = 32;
	const ROWS = 8;
	const STEP = 64;

	const root = new Container();
	root.label = 'textMesh';
	parent.addToParent(root);

	// the grid: fixed indices, UVs set per texture size, positions every tick
	const V = (COLS + 1) * (ROWS + 1);
	const positions = new Float32Array(V * 2);
	const uvs = new Float32Array(V * 2);
	const indices = new Uint32Array(COLS * ROWS * 6);
	for (let r = 0, k = 0; r < ROWS; r++)
		for (let c = 0; c < COLS; c++, k += 6) {
			const a = r * (COLS + 1) + c;
			indices.set([a, a + 1, a + COLS + 2, a, a + COLS + 2, a + COLS + 1], k);
		}

	let geometry: MeshGeometry | null = null;
	let mesh: Mesh | null = null;
	let target: RenderTexture | null = null;
	let box = { x: 0, y: 0, w: 1, h: 1 };
	// the text's own bounds (no margin): what the anchor is measured on
	let ink = { x: 0, y: 0, w: 1, h: 1 };
	const started = Date.now();

	const src = new Container();
	let passes: Text[] = [];
	let styleKey = '';

	const restyle = () => {
		const fontSize = props.fontSize;
		const fill = props.fill ?? DEFAULT_FILL;
		const stroke = props.stroke ?? DEFAULT_STROKE;
		const key = [
			fontSize,
			fill.join(','),
			stroke,
			props.strokeWidth,
			props.shadow?.blur,
			props.shadow?.distance,
			props.letterSpacing,
			props.bevel,
		].join('|');
		if (key === styleKey) return;
		styleKey = key;
		for (const t of src.removeChildren()) t.destroy();
		passes = [];
		const base = {
			fontFamily: GAME_FONT,
			fontSize,
			fontWeight: GAME_FONT_WEIGHT,
			letterSpacing: props.letterSpacing ?? 1,
		} as const;
		const bevel = Math.max(1, fontSize * 0.05);
		const make = (style: TextStyleOptions, y: number, alpha: number) => {
			const t = new Text({ text: '', style: { ...base, ...style } });
			t.anchor.set(0.5);
			t.y = y;
			t.alpha = alpha;
			src.addChild(t);
			passes.push(t);
		};
		if (props.bevel)
			make({ fill: stroke, stroke: { color: stroke, width: Math.max(2, fontSize * 0.13) } }, bevel, 0.85);
		make(
			{
				fill: verticalFill(fill, fontSize),
				stroke: { color: stroke, width: props.strokeWidth ?? Math.max(2, fontSize * 0.1) },
				dropShadow: {
					color: 0x000000,
					alpha: 1,
					blur: props.shadow?.blur ?? Math.max(4, fontSize * 0.12),
					distance: props.shadow?.distance ?? Math.max(1.5, fontSize * 0.045),
					angle: Math.PI / 2,
				},
			},
			0,
			1,
		);
		if (props.bevel) make({ fill: 0xffffff }, -bevel * 0.55, 0.3);
	};

	// a little margin, so a shadow or a sheen at the edge is not clipped
	const pad = () => Math.ceil(props.fontSize * 0.15);

	const rebuild = () => {
		const renderer = app.stateApp.pixiApplication?.renderer;
		if (!renderer) return false;
		restyle();
		const text = String(props.text);
		for (const t of passes) t.text = text;
		const b = src.getLocalBounds();
		const p = pad();
		const fx = Math.floor(b.x) - p;
		const fy = Math.floor(b.y) - p;
		const fw = Math.max(1, Math.ceil(b.width) + p * 2);
		const fh = Math.max(1, Math.ceil(b.height) + p * 2);
		const resolution = Math.max(2, globalThis.devicePixelRatio ?? 1);
		const tw = Math.ceil(fw / STEP) * STEP;
		const th = Math.ceil(fh / STEP) * STEP;
		if (!target) target = RenderTexture.create({ width: tw, height: th, resolution, antialias: true });
		else if (target.width !== tw || target.height !== th) target.resize(tw, th, resolution);
		renderer.render({
			container: src,
			target,
			clear: true,
			clearColor: [0, 0, 0, 0],
			transform: new Matrix(1, 0, 0, 1, -fx, -fy),
		});
		box = { x: fx, y: fy, w: fw, h: fh };
		ink = { x: b.x, y: b.y, w: b.width, h: b.height };
		// the UVs cover only the part of the texture the text was drawn into
		const su = fw / tw;
		const sv = fh / th;
		for (let r = 0; r <= ROWS; r++)
			for (let c = 0; c <= COLS; c++) {
				const i = r * (COLS + 1) + c;
				uvs[i * 2] = (c / COLS) * su;
				uvs[i * 2 + 1] = (r / ROWS) * sv;
			}
		if (!mesh) {
			geometry = new MeshGeometry({ positions, uvs, indices });
			mesh = new Mesh({ geometry, texture: target });
			root.addChild(mesh);
		} else {
			geometry!.getBuffer('aUV').update();
		}
		return true;
	};

	const tick = () => {
		if (!mesh || !geometry) return;
		const wall = Date.now();
		const since = (at: number | undefined) => (at === undefined || at < 0 ? -1 : Math.max(0, wall - at));
		const at = props.at;
		const env: TextEnv = at
			? {
					spinT: since(at.spin),
					retrigT: since(at.retrig),
					levelT: since(at.level),
					rollT: since(at.roll),
					landT: since(at.land),
					stampT: since(at.stamp),
					now: wall - started,
				}
			: { ...props.env, now: wall - started };
		for (let r = 0; r <= ROWS; r++)
			for (let c = 0; c <= COLS; c++) {
				const i = r * (COLS + 1) + c;
				const [px, py] = deformText(c / COLS, r / ROWS, box.w, box.h, env, props.act);
				positions[i * 2] = box.x + px;
				positions[i * 2 + 1] = box.y + py;
			}
		// an anchor other than the centre: shift so that point of the text sits
		// on (x, y). Left out, nothing moves — the passes are anchored at 0.5.
		if (props.anchor !== undefined) {
			const a = typeof props.anchor === 'number' ? { x: props.anchor, y: props.anchor } : props.anchor;
			const ox = -(ink.x + a.x * ink.w);
			const oy = -(ink.y + a.y * ink.h);
			for (let i = 0; i < V; i++) {
				positions[i * 2] += ox;
				positions[i * 2 + 1] += oy;
			}
		}
		geometry.getBuffer('aPosition').update();
		// the text's own width, without the margin, is what maxWidth limits
		const textW = box.w - pad() * 2;
		const fit = props.maxWidth && textW > props.maxWidth ? props.maxWidth / textW : 1;
		root.scale.set(fit);
		root.position.set(props.x ?? 0, props.y ?? 0);
	};

	// re-render the texture when what it shows changes (and once the renderer
	// is there: it may not be on the first frame)
	let pending = true;
	$effect(() => {
		// read everything the texture depends on, so the effect tracks it
		void [
			props.text,
			props.fontSize,
			(props.fill ?? DEFAULT_FILL).join(','),
			props.stroke,
			props.strokeWidth,
			props.shadow?.blur,
			props.shadow?.distance,
			props.letterSpacing,
			props.bevel,
		];
		pending = true;
	});

	onMount(() => {
		// The display face is self-hosted and can finish loading AFTER this text
		// was first rendered (the loading screen's title is up before it lands):
		// the texture would keep the fallback face. Rebuild the passes when any
		// font finishes loading — a new Text measures with the face now there.
		const fonts = globalThis.document?.fonts;
		const refont = () => {
			styleKey = '';
			pending = true;
		};
		fonts?.addEventListener?.('loadingdone', refont);
		fonts?.ready?.then(refont);
		const id = setInterval(() => {
			if (pending && rebuild()) pending = false;
			tick();
		}, 16);
		return () => {
			fonts?.removeEventListener?.('loadingdone', refont);
			clearInterval(id);
			geometry?.destroy();
			target?.destroy(true);
			src.destroy({ children: true });
		};
	});
</script>
