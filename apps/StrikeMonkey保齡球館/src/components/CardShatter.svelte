<script lang="ts">
	/**
	 * The low card breaking where the bowling ball hits it (BanditMeter,
	 * 2026-10-18). The card art and its letter are painted once into a small
	 * canvas (the letter is type over the art in the game, so it has to be
	 * baked in to break with the card), then cut into radial shards around the
	 * point of impact — an inner triangle and an outer quad per spoke, like a
	 * struck tile — and the shards fly off down the lane, spinning and falling.
	 *
	 * One Mesh for all of it; the parent's clock hands in `t` (ms since the
	 * hit), so nothing here runs a timer of its own.
	 *
	 * Same box as the card it replaces: `size` square, anchored at (.5, .92),
	 * placed at (x, y).
	 */
	import { Container, Mesh, MeshGeometry, Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onDestroy } from 'svelte';
	import { inkBaseline } from '../game/letterCentre';

	type Props = {
		textureKey: string;
		label: string;
		labelFont: string;
		labelColor: string;
		size: number;
		x: number;
		y: number;
		t: number;
		/** where the ball strikes, 0..1 across / down the card */
		impact?: { u: number; v: number };
	};
	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	const root = new Container();
	root.label = 'cardShatter';
	parent.addToParent(root);

	const S = 256;
	const P = props.impact ?? { u: 0.8, v: 0.56 };
	// deterministic jitter: every shatter is the same shape, so it can be judged
	const rand = (i: number) => {
		const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
		return s - Math.floor(s);
	};

	// perimeter points, clockwise from the top-left corner, jittered along
	// their edge; four corners are kept so the card's outline survives
	const ring: [number, number][] = [];
	const PER_EDGE = 3;
	for (let e = 0; e < 4; e++) {
		for (let i = 0; i < PER_EDGE; i++) {
			const f = i === 0 ? 0 : (i + (rand(e * 7 + i) - 0.5) * 0.5) / PER_EDGE;
			if (e === 0) ring.push([f, 0]);
			else if (e === 1) ring.push([1, f]);
			else if (e === 2) ring.push([1 - f, 1]);
			else ring.push([0, 1 - f]);
		}
	}

	type Shard = { pts: [number, number][]; cx: number; cy: number; vx: number; vy: number; spin: number };
	const shards: Shard[] = [];
	for (let i = 0; i < ring.length; i++) {
		const a = ring[i];
		const b = ring[(i + 1) % ring.length];
		const f1 = 0.38 + 0.2 * rand(i + 40);
		const f2 = 0.38 + 0.2 * rand(i + 41);
		const m1: [number, number] = [P.u + (a[0] - P.u) * f1, P.v + (a[1] - P.v) * f1];
		const m2: [number, number] = [P.u + (b[0] - P.u) * f2, P.v + (b[1] - P.v) * f2];
		for (const pts of [[[P.u, P.v], m1, m2], [m1, a, b, m2]] as [number, number][][]) {
			const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
			const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
			let dx = cx - P.u, dy = cy - P.v;
			const len = Math.hypot(dx, dy) || 1;
			dx /= len; dy /= len;
			// outward from the hit, carried on down the lane (left) and up a little
			const speed = 0.9 + 1.1 * rand(i * 3 + pts.length);
			shards.push({
				pts, cx, cy,
				vx: dx * speed - 1.1,
				vy: dy * speed - 0.9 - 0.4 * rand(i + 90),
				spin: (rand(i * 5 + pts.length) - 0.5) * 14,
			});
		}
	}

	const vertexCount = shards.reduce((s, sh) => s + sh.pts.length, 0);
	const uvs = new Float32Array(vertexCount * 2);
	const positions = new Float32Array(vertexCount * 2);
	const indices: number[] = [];
	{
		let v = 0;
		for (const sh of shards) {
			const base = v;
			for (const p of sh.pts) {
				uvs[v * 2] = p[0];
				uvs[v * 2 + 1] = p[1];
				v++;
			}
			for (let k = 1; k < sh.pts.length - 1; k++) indices.push(base, base + k, base + k + 1);
		}
	}

	let texture: Texture | null = null;
	let geometry: MeshGeometry | null = null;
	let mesh: Mesh | null = null;

	const bake = () => {
		const card = app.stateApp.loadedAssets?.[props.textureKey] as Texture | undefined;
		const source = card?.source?.resource as CanvasImageSource | undefined;
		if (!card || !source) return null;
		const canvas = document.createElement('canvas');
		canvas.width = S;
		canvas.height = S;
		const ctx = canvas.getContext('2d');
		if (!ctx) return null;
		const f = card.frame;
		ctx.drawImage(source, f.x, f.y, f.width, f.height, 0, 0, S, S);
		// the letter as BanditMeter sets it: .49 of the card, centred at y .50
		ctx.font = `400 ${Math.round(S * 0.49)}px ${props.labelFont}`;
		ctx.fillStyle = props.labelColor;
		ctx.textAlign = 'center';
		// the glyph's ink centred on the card, as the live label is (letterCentre.ts)
		ctx.textBaseline = 'alphabetic';
		ctx.fillText(props.label, S / 2, inkBaseline(ctx, props.label, S / 2));
		return Texture.from(canvas);
	};

	$effect(() => {
		const t = Math.max(0, props.t) / 1000;
		if (!mesh) {
			texture = bake();
			if (!texture) return;
			geometry = new MeshGeometry({ positions, uvs, indices: new Uint32Array(indices) });
			mesh = new Mesh({ geometry, texture });
			root.addChild(mesh);
		}
		const size = props.size;
		const GRAVITY = 5.2;
		let v = 0;
		for (const sh of shards) {
			// a short crack before it flies: the pieces part, then go
			const go = Math.max(0, t - 0.03);
			const ox = sh.vx * go;
			const oy = sh.vy * go + 0.5 * GRAVITY * go * go;
			const r = sh.spin * go;
			const c = Math.cos(r), s = Math.sin(r);
			const shrink = 1 - Math.min(0.35, go * 0.5);
			for (const p of sh.pts) {
				const lx = (p[0] - sh.cx) * shrink, ly = (p[1] - sh.cy) * shrink;
				const ux = sh.cx + ox + lx * c - ly * s;
				const uy = sh.cy + oy + lx * s + ly * c;
				positions[v * 2] = (ux - 0.5) * size;
				positions[v * 2 + 1] = (uy - 0.92) * size;
				v++;
			}
		}
		geometry!.getBuffer('aPosition').update();
		mesh.alpha = 1 - Math.min(1, Math.max(0, (t - 0.32) / 0.38));
	});

	$effect(() => {
		root.position.set(props.x, props.y);
	});

	onDestroy(() => {
		geometry?.destroy();
		texture?.destroy(true);
	});
</script>
