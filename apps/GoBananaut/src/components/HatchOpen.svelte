<script lang="ts" module>
	/** the latches, the seal giving, and the doors at rest open (ms) */
	export const HATCH_LATCH_MS = [60, 150, 230];
	export const HATCH_CRACK_MS = 340;
	export const HATCH_SLIDE_MS = 430;
	export const HATCH_STOP_MS = 1230;
	export const HATCH_DONE_MS = 1420;
</script>

<script lang="ts">
	/**
	 * THE BOARD BEHIND AN AIRLOCK, OPENED (EntryReveal, 2026-10-03).
	 *
	 * Go Bananas Boat opens on a tarp yanked off the hold (TarpPeel). This is the
	 * capsule's version: the board is shut behind a pair of blast doors that open
	 * like heavy machinery, not like an effect —
	 *
	 *   LATCHES  the three brass latches across the seam flip open one by one,
	 *            and each one jolts the doors a hair
	 *   CRACK    the seal gives: a sliver of the lit board shows down the seam
	 *            (EntryReveal lets a little cold air out of it)
	 *   SLIDE    the doors start SLOW — they are heavy — gather speed, and stop
	 *            HARD in the housing with a small rebound and a thud through it.
	 *            The right one runs a beat behind the left: two motors, not one.
	 *            Their seam edges lag a little behind a fast move (mesh flex).
	 *
	 * "盡量做的不要有ai感": nothing here is drawn flat by the program. The doors are
	 * built from the housing's own PAINTED art (frame_edge.png): its riveted steel
	 * plate, laid edge to edge with the plates flipped and offset so no pattern
	 * repeats; its brass pipe as the doors' meeting edge; its hazard tape top and
	 * bottom; its brass latches. Only the shading is added. Each door is a grid
	 * mesh over its half; masked to the opening, so they go INTO the housing.
	 *
	 * A function of `t` (ms since the reveal began). Centred on (x, y).
	 */
	import { Container, Graphics, Mesh, MeshGeometry, Rectangle, Sprite, Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	type Props = { x: number; y: number; width: number; height: number; t: number };
	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	const COLS = 12, ROWS = 18;
	// frame_edge.png (1456x1424), measured 2026-10-03
	const EDGE_W = 1456;
	const STEEL = [new Rectangle(2, 405, 116, 245), new Rectangle(2, 765, 116, 245)];
	const BRASS_PIPE = new Rectangle(140, 405, 25, 245);
	const TAPE = new Rectangle(200, 2, 1000, 14);
	const LATCH = new Rectangle(20, 296, 80, 102);
	// the latch turns about its ring (tex px inside LATCH)
	const LATCH_PIVOT = { x: 55, y: 49 };

	// seeded, so every player sees the same doors
	let seed = 7;
	const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

	const root = new Container();
	let posL: Float32Array | null = null;
	let posR: Float32Array | null = null;
	let geoL: MeshGeometry | null = null;
	let geoR: MeshGeometry | null = null;
	let latches: Container[] = [];
	let crack: Graphics | null = null;
	let k = 1; // texture px -> board px

	onMount(() => {
		const renderer = app.stateApp.pixiApplication?.renderer;
		const edge = app.stateApp.loadedAssets?.gbFrameEdge as Texture | undefined;
		if (!renderer || !edge) return;
		const W = Math.round(props.width), H = Math.round(props.height);
		// the housing is drawn about 1.3x the board's width across its 1456px; at
		// the same scale its plates and rivets are the size they are on the frame
		k = (W * 1.27) / EDGE_W;
		const sub = (r: Rectangle) => new Texture({ source: edge.source, frame: new Rectangle(edge.frame.x + r.x, edge.frame.y + r.y, r.width, r.height) });
		const steel = STEEL.map(sub);
		const pipe = sub(BRASS_PIPE);
		const tape = sub(TAPE);

		// ── paint the pair of doors once ──
		// The steel plate lies ACROSS the door (turned 90°) and a quarter larger:
		// stood on end at the frame's own size, plates side by side read as a
		// plank fence, not a blast door. Each row starts at its own offset, so the
		// joints stagger like laid plate.
		const art = new Container();
		const PLATE_SCALE = 1.25;
		const plateLong = STEEL[0].height * k * PLATE_SCALE, plateShort = STEEL[0].width * k * PLATE_SCALE;
		for (const side of [0, 1]) {
			const x0 = side * (W / 2);
			for (let y = 0; y < H; y += plateShort) {
				for (let x = x0 - rnd() * plateLong; x < x0 + W / 2; x += plateLong) {
					const s = new Sprite(steel[Math.floor(rnd() * steel.length)]);
					s.anchor.set(0.5);
					s.width = plateShort + 1;
					s.height = plateLong + 1;
					// turned either way, and flipped or not: four faces from each plate
					s.rotation = rnd() < 0.5 ? Math.PI / 2 : -Math.PI / 2;
					if (rnd() < 0.5) s.scale.x *= -1;
					s.position.set(x + plateLong / 2, y + plateShort / 2);
					// no two plates quite the same tone
					const v = 0.8 + rnd() * 0.2;
					s.tint = (Math.round(255 * v) << 16) | (Math.round(255 * v) << 8) | Math.round(255 * Math.min(1, v + 0.02));
					// keep each half's plates on its own half
					const clip = new Graphics().rect(x0, 0, W / 2, H).fill({ color: 0xffffff });
					const holder = new Container();
					holder.addChild(s, clip);
					s.mask = clip;
					art.addChild(holder);
				}
			}
			// the meeting edge: the frame's brass pipe, down the seam side
			const pw = BRASS_PIPE.width * k * 1.4;
			const pipeLen = BRASS_PIPE.height * k;
			for (let y = 0; y < H; y += pipeLen) {
				const p = new Sprite(pipe);
				p.width = pw;
				p.height = pipeLen + 1;
				if (side === 0) p.position.set(W / 2 - pw, y);
				else {
					p.scale.x *= -1;
					p.position.set(W / 2 + pw, y);
				}
				art.addChild(p);
			}
		}
		// hazard tape across the top and the foot of both doors
		for (const y of [0, H - TAPE.height * k * 1.6]) {
			const t = new Sprite(tape);
			t.width = W;
			t.height = TAPE.height * k * 1.6;
			t.position.set(0, y);
			art.addChild(t);
		}
		// shading only: the doors darken toward the foot and into the seam
		const shade = new Graphics();
		for (let i = 0; i < 12; i++) {
			shade.rect(0, H * (0.55 + i * 0.0375), W, H * 0.0375 + 1).fill({ color: 0x05080b, alpha: 0.03 * i });
		}
		for (const side of [-1, 1])
			for (let i = 0; i < 6; i++)
				shade.rect(W / 2 + side * (BRASS_PIPE.width * k * 1.4 + i * 3) - (side < 0 ? 3 : 0), 0, 3, H).fill({ color: 0x000000, alpha: 0.22 - i * 0.035 });
		shade.rect(W / 2 - 1, 0, 2, H).fill({ color: 0x000000, alpha: 0.9 });
		art.addChild(shade);

		const texture = renderer.generateTexture({ target: art, frame: new Rectangle(0, 0, W, H), resolution: 1.5 });
		art.destroy({ children: true });

		const make = (u0: number) => {
			const n = (COLS + 1) * (ROWS + 1);
			const positions = new Float32Array(n * 2);
			const uvs = new Float32Array(n * 2);
			const idx: number[] = [];
			for (let r = 0; r <= ROWS; r++)
				for (let c = 0; c <= COLS; c++) {
					const i = (r * (COLS + 1) + c) * 2;
					uvs[i] = u0 + (0.5 * c) / COLS;
					uvs[i + 1] = r / ROWS;
					if (r < ROWS && c < COLS) {
						const a = r * (COLS + 1) + c, b = a + 1, d = a + COLS + 1, e = d + 1;
						idx.push(a, b, e, a, e, d);
					}
				}
			const geometry = new MeshGeometry({ positions, uvs, indices: new Uint32Array(idx) });
			return { geometry, positions, mesh: new Mesh({ geometry, texture }) };
		};
		const L = make(0), R = make(0.5);
		geoL = L.geometry;
		geoR = R.geometry;
		posL = L.positions;
		posR = R.positions;

		// the light of the board, showing through the seam as it parts: a sliver,
		// not a glow
		crack = new Graphics();

		// three latches across the seam, on the LEFT door, at uneven heights. The
		// crop holds the frame's steel behind the latch as well; a mask keeps only
		// the latch itself — its brass upright, its ring and its lever — or a square
		// of steel would turn with it
		const latchTex = sub(LATCH);
		latches = [0.21, 0.52, 0.8].map((v) => {
			const holder = new Container();
			const s = new Sprite(latchTex);
			const m = new Graphics()
				.roundRect(20, 4, 52, 98, 8)
				.fill({ color: 0xffffff })
				.circle(58, 49, 29)
				.fill({ color: 0xffffff })
				.roundRect(2, 34, 78, 32, 6)
				.fill({ color: 0xffffff });
			holder.addChild(s, m);
			s.mask = m;
			holder.scale.set(k * 1.25);
			holder.pivot.set(LATCH_PIVOT.x, LATCH_PIVOT.y);
			holder.position.set(props.x + 4, props.y - H / 2 + H * v);
			return holder;
		});

		const mask = new Graphics().rect(props.x - W / 2, props.y - H / 2, W, H).fill({ color: 0xffffff });
		root.addChild(crack, L.mesh, R.mesh, ...latches, mask);
		root.mask = mask;
		parent.parent.addChild(root);
		pose();
		return () => {
			root.removeFromParent();
			root.destroy({ children: true });
			texture.destroy(true);
		};
	});

	const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
	// how far a door has travelled, 0..1, with a heavy start, a hard stop and a
	// small rebound off the stop
	const travelOf = (t: number, delay: number, stretch: number) => {
		const span = (HATCH_STOP_MS - HATCH_SLIDE_MS) * stretch;
		const u = (t - HATCH_SLIDE_MS - delay) / span;
		if (u <= 0) return 0;
		if (u < 1) return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
		const after = (u - 1) * span;
		return 1 - 0.022 * Math.exp(-after / 60) * Math.sin(after / 22);
	};

	const pose = () => {
		if (!posL || !posR || !geoL || !geoR || !crack) return;
		const { x: cx, y: cy, width: W, height: H, t } = props;
		// each latch flip jolts the doors a hair
		let jolt = 0;
		HATCH_LATCH_MS.forEach((at, i) => {
			const u = (t - at) / 90;
			if (u > 0 && u < 1) jolt += (i % 2 ? -1 : 1) * 1.2 * Math.sin(Math.PI * u);
		});
		// the seal giving: the doors part a few px before they slide
		const cracked = clamp01((t - HATCH_CRACK_MS) / 60) * 4;
		const open = W / 2 + 24;
		const doors = [
			{ pos: posL, geo: geoL, side: -1, travel: cracked + open * travelOf(t, 0, 1) },
			{ pos: posR, geo: geoR, side: 1, travel: cracked + open * travelOf(t, 45, 1.03) },
		];
		for (const d of doors) {
			// a fast move bends the seam edge back a little
			const u = (t - HATCH_SLIDE_MS) / (HATCH_STOP_MS - HATCH_SLIDE_MS);
			const accel = u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
			for (let r = 0; r <= ROWS; r++) {
				const v = r / ROWS;
				const mid = Math.sin(Math.PI * v);
				for (let c = 0; c <= COLS; c++) {
					const uu = c / COLS;
					const toSeam = d.side < 0 ? uu : 1 - uu;
					const i = (r * (COLS + 1) + c) * 2;
					const baseX = d.side < 0 ? cx - W / 2 + (uu * W) / 2 : cx + (uu * W) / 2;
					d.pos[i] = baseX + d.side * d.travel - d.side * 7 * accel * toSeam * toSeam * mid + jolt;
					d.pos[i + 1] = cy + (v - 0.5) * H;
				}
			}
			d.geo.getBuffer('aPosition').update();
		}
		// the latches: flip up off the seam one by one, then ride the left door
		HATCH_LATCH_MS.forEach((at, i) => {
			const s = latches[i];
			if (!s) return;
			const u = clamp01((t - at) / 110);
			s.rotation = -1.25 * (1 - (1 - u) ** 3) + 0.08 * Math.sin(Math.PI * clamp01((t - at - 110) / 120));
			s.x = cx + 4 - doors[0].travel + jolt;
		});
		// the board's light through the gap
		const gap = doors[0].travel + doors[1].travel;
		crack.clear();
		if (gap > 0.5 && t < HATCH_STOP_MS) {
			crack.rect(cx - doors[0].travel, cy - H / 2, gap, H).fill({ color: 0xd8f4ff, alpha: 0.18 * clamp01(1 - (gap - 4) / 120) });
		}
	};

	$effect(() => {
		void props.t, props.x, props.y, props.width, props.height;
		pose();
	});
</script>
