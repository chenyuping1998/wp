<script lang="ts">
	/**
	 * THE BIG-WIN BANANA FOUNTAIN, TUMBLING (2026-10-03). It was the shared
	 * particle emitter: each banana one of ten flat drawings, turning in the
	 * plane of the screen like a card. Now each one is a small MESH and it
	 * tumbles end over end about its own long axis as it flies — the far side
	 * shrinking, the near side swelling, darker as it turns edge-on — and it
	 * flexes a little as it spins, so it reads as a thing with weight in the
	 * air rather than a sticker. Same fountain: the same tiers (rate, speed,
	 * spread from LEVEL_PARTICLE_BANANA_MAP), gravity, life and cap as before.
	 *
	 * The ten drawings stay (variety); each mesh samples its frame straight out
	 * of the sheet's page (a mesh ignores a texture's frame on WebGPU — see
	 * SymbolMeshWin), so all ten share one texture.
	 */
	import { Container, Mesh, MeshGeometry, Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	type Tier = {
		frequency: number;
		speedOption: { list: readonly { value: number }[] };
		spawnOption: { spawnRect: { x: number; w: number } };
	};
	type Props = { emit: boolean; tier: Tier | null };
	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	const GRAVITY = 600;
	const LIFE = 6;
	const MAX = 100;
	const SCALE: [number, number] = [0.3, 0.4];
	const COLS = 6, ROWS = 3;

	type Banana = {
		mesh: Mesh;
		geo: MeshGeometry;
		pos: Float32Array;
		w: number;
		h: number;
		x: number;
		y: number;
		vx: number;
		vy: number;
		rot: number;
		spin: number;
		roll: number;
		rollRate: number;
		age: number;
		alive: boolean;
	};

	const root = new Container();
	const pool: Banana[] = [];
	let frames: Texture[] = [];
	let page: Texture | undefined;
	let carry = 0;

	const indices = new Uint32Array(COLS * ROWS * 6);
	for (let r = 0, k = 0; r < ROWS; r++)
		for (let c = 0; c < COLS; c++, k += 6) {
			const a = r * (COLS + 1) + c;
			indices.set([a, a + 1, a + COLS + 2, a, a + COLS + 2, a + COLS + 1], k);
		}

	const make = (frame: Texture): Banana => {
		const src = frame.source;
		const f = frame.frame;
		const uvs = new Float32Array((COLS + 1) * (ROWS + 1) * 2);
		for (let r = 0, i = 0; r <= ROWS; r++)
			for (let c = 0; c <= COLS; c++, i += 2)
				uvs.set([(f.x + (c / COLS) * f.width) / src.width, (f.y + (r / ROWS) * f.height) / src.height], i);
		const pos = new Float32Array(uvs.length);
		const geo = new MeshGeometry({ positions: pos, uvs, indices });
		const mesh = new Mesh({ geometry: geo, texture: page! });
		root.addChild(mesh);
		return { mesh, geo, pos, w: f.width, h: f.height, x: 0, y: 0, vx: 0, vy: 0, rot: 0, spin: 0, roll: 0, rollRate: 0, age: 0, alive: false };
	};

	const rand = (a: number, b: number) => a + Math.random() * (b - a);

	const spawn = (tier: Tier) => {
		let b = pool.find((p) => !p.alive);
		if (!b) {
			if (pool.length >= MAX) return;
			b = make(frames[Math.floor(Math.random() * frames.length)]);
			pool.push(b);
		}
		const sp = tier.spawnOption.spawnRect;
		const speeds = tier.speedOption.list.map((s) => s.value);
		const speed = rand(Math.min(...speeds), Math.max(...speeds));
		const a = (rand(255, 285) * Math.PI) / 180;
		Object.assign(b, {
			x: sp.x + Math.random() * sp.w,
			y: 0,
			vx: Math.cos(a) * speed,
			vy: Math.sin(a) * speed,
			rot: Math.random() * Math.PI * 2,
			spin: (rand(-90, 90) * Math.PI) / 180,
			roll: Math.random() * Math.PI * 2,
			// end over end, both ways round, some lazy and some quick
			rollRate: (Math.random() < 0.5 ? -1 : 1) * rand(3.5, 9),
			age: 0,
			alive: true,
		});
		b.mesh.visible = true;
	};

	const pose = (b: Banana) => {
		const s = SCALE[0] + (SCALE[1] - SCALE[0]) * (b.age / LIFE);
		const w = b.w * s, h = b.h * s;
		const c = Math.cos(b.roll), sn = Math.sin(b.roll);
		const cr = Math.cos(b.rot), sr = Math.sin(b.rot);
		const eye = w * 3;
		// the flex: the ends curl a touch more as it turns, and back
		const flex = 0.12 * h * sn;
		for (let r = 0, i = 0; r <= ROWS; r++)
			for (let col = 0; col <= COLS; col++, i += 2) {
				const u = (col / COLS - 0.5) * w;
				const along = col / COLS - 0.5;
				let v = (r / ROWS - 0.5) * h + flex * (4 * along * along - 1);
				// rolled about its long axis (local x), in perspective
				const z = v * sn;
				v *= c;
				const k = eye / (eye + z);
				const lx = u * k, ly = v * k;
				b.pos[i] = b.x + lx * cr - ly * sr;
				b.pos[i + 1] = b.y + lx * sr + ly * cr;
			}
		b.geo.getBuffer('aPosition').update();
		const lit = Math.round(255 * (0.55 + 0.45 * Math.abs(c)));
		b.mesh.tint = (lit << 16) | (lit << 8) | Math.round(lit * 0.9);
	};

	onMount(() => {
		const list = app.stateApp.loadedAssets?.winBananas as Texture[] | undefined;
		if (!list?.length) {
			console.error('BananaFountain: winBananas not loaded');
			return;
		}
		frames = list;
		page = new Texture({ source: list[0].source });
		parent.parent.addChild(root);
		const ticker = app.stateApp.pixiApplication?.ticker;
		const tick = () => {
			const dt = Math.min(0.05, (ticker?.deltaMS ?? 16) / 1000);
			if (props.emit && props.tier) {
				carry += dt;
				while (carry >= props.tier.frequency) {
					carry -= props.tier.frequency;
					spawn(props.tier);
				}
			} else carry = 0;
			for (const b of pool) {
				if (!b.alive) continue;
				b.age += dt;
				if (b.age >= LIFE) {
					b.alive = false;
					b.mesh.visible = false;
					continue;
				}
				b.vy += GRAVITY * dt;
				b.x += b.vx * dt;
				b.y += b.vy * dt;
				b.rot += b.spin * dt;
				b.roll += b.rollRate * dt;
				pose(b);
			}
		};
		ticker?.add(tick);
		return () => {
			ticker?.remove(tick);
			root.removeFromParent();
			root.destroy({ children: true });
			for (const b of pool) b.geo.destroy();
		};
	});
</script>
