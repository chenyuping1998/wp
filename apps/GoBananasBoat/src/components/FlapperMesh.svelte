<script lang="ts">
	/**
	 * THE FLAPPER on a pick slot (CargoPick, MultiplierPick): a brass leaf
	 * spring whose tip rides on the strip. Every cell that goes by catches the
	 * tip and bends it — the leaf curls, most at its tip — until the cell's edge
	 * slips past and it SNAPS back, ringing, until the next one catches it.
	 *
	 * Driven by the strip's own position (`pos`, in cells), so it is exactly in
	 * step with what the player sees: a blur of flicks while the strip runs, a
	 * slow, heavy bend and a loud snap as it creeps the last cell, and one final
	 * ring when it locks. The bend is a mesh — a tapered strip curving along
	 * its length — not a rigid pointer turning on a pin.
	 *
	 * Local frame: the base pin at (0, 0), the leaf pointing along +y for
	 * `length`; `rotation` turns the whole thing into place. + bend is toward
	 * local +x; `dir` says which way the strip pushes it.
	 */
	import { Container, Graphics, Mesh, MeshGeometry, Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	type Props = {
		x: number;
		y: number;
		rotation: number;
		length: number;
		/** the strip's position, in cells */
		pos: number;
		/** which way a passing cell pushes the tip: +1 toward local +x, -1 away */
		dir: 1 | -1;
	};

	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	const SEG = 12;
	// the fraction of a cell during which the edge is pushing the tip; past it,
	// the edge has slipped by and the leaf is free
	const CATCH = 0.72;
	const MAX_BEND = 0.5;

	const uvs = new Float32Array((SEG + 1) * 4);
	const indices = new Uint32Array(SEG * 6);
	for (let r = 0; r <= SEG; r++) {
		uvs.set([0, r / SEG, 1, r / SEG], r * 4);
	}
	for (let r = 0, k = 0; r < SEG; r++, k += 6) {
		const a = r * 2;
		indices.set([a, a + 1, a + 3, a, a + 3, a + 2], k);
	}

	const root = new Container();
	const pin = new Graphics();
	const ink = { pos: new Float32Array(uvs.length), geo: undefined as MeshGeometry | undefined };
	const brass = { pos: new Float32Array(uvs.length), geo: undefined as MeshGeometry | undefined };

	// the ring after each snap, in time
	let releasedAt = -1e9;
	let releaseBend = 0;
	let lastFrac = 0;
	let clock = $state(0);

	const bendNow = () => {
		const f = props.pos - Math.floor(props.pos);
		// a cell edge slipped past the tip since the last frame: it is free
		if (lastFrac < CATCH && f >= CATCH) {
			releasedAt = clock;
			releaseBend = MAX_BEND;
		}
		lastFrac = f;
		const ring = releaseBend * Math.exp(-(clock - releasedAt) / 95) * Math.cos((2 * Math.PI * (clock - releasedAt)) / 130);
		// pushed: rises with the cell's travel, eased so the strain builds
		const push = f < CATCH ? MAX_BEND * (f / CATCH) ** 1.6 : 0;
		// while being pushed the ring is cut off by the push itself
		return f < CATCH && push > Math.abs(ring) ? push : ring;
	};

	const shape = (out: Float32Array, half0: number, half1: number, bend: number) => {
		const L = props.length;
		for (let r = 0; r <= SEG; r++) {
			const s = r / SEG;
			// a cantilever: the tip curls most
			const off = props.dir * bend * L * s * s * 0.6;
			const slope = props.dir * bend * s * 1.2;
			const half = half0 + (half1 - half0) * s;
			const cx = off, cy = s * L;
			// across the leaf, perpendicular to its local direction
			const nx = Math.cos(slope), ny = -Math.sin(slope);
			out.set([cx - nx * half, cy - ny * half, cx + nx * half, cy + ny * half], r * 4);
		}
	};

	const pose = () => {
		if (!ink.geo || !brass.geo) return;
		const b = bendNow();
		// Broad triangular pointer: fixed, heavy root and a clear single tip.
		// Both layers taper together, so the flex still reads as one metal leaf.
		const w = props.length * 0.31;
		shape(ink.pos, w, props.length * 0.028, b);
		shape(brass.pos, w * 0.83, props.length * 0.012, b);
		ink.geo.getBuffer('aPosition').update();
		brass.geo.getBuffer('aPosition').update();
		root.position.set(props.x, props.y);
		root.rotation = props.rotation;
	};

	$effect(() => {
		void [props.pos, props.x, props.y, props.rotation, props.length, clock];
		pose();
	});

	onMount(() => {
		ink.geo = new MeshGeometry({ positions: ink.pos, uvs, indices });
		brass.geo = new MeshGeometry({ positions: brass.pos, uvs, indices });
		const a = new Mesh({ geometry: ink.geo, texture: Texture.WHITE });
		a.tint = 0x2a1a08;
		const b = new Mesh({ geometry: brass.geo, texture: Texture.WHITE });
		b.tint = 0xe2b04a;
		const w = props.length * 0.31;
		pin.circle(0, 0, w * 0.48).fill({ color: 0x2a1a08 });
		pin.circle(0, 0, w * 0.36).fill({ color: 0xf5dfa0 });
		pin.circle(0, 0, w * 0.14).fill({ color: 0x4f3218 });
		root.addChild(a, b, pin);
		parent.parent.addChild(root);
		// Landing meshes are mounted after the strip has already started. Keep the
		// pointer's wrapper above those late children through the result hold.
		parent.parent.zIndex = 100;
		if (parent.parent.parent) parent.parent.parent.sortableChildren = true;
		const ticker = app.stateApp.pixiApplication?.ticker;
		const tick = () => (clock = performance.now());
		ticker?.add(tick);
		pose();
		return () => {
			ticker?.remove(tick);
			root.removeFromParent();
			root.destroy({ children: true });
			ink.geo?.destroy();
			brass.geo?.destroy();
		};
	});
</script>
