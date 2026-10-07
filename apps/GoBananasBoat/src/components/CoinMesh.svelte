<script lang="ts">
	/**
	 * THE PRIZE COIN, FLIPPING (Hold and Spin). The coin disc of gbP drawn
	 * through a round mesh, turned about its horizontal axis WITH PERSPECTIVE:
	 * the half swinging toward the player grows and the far half shrinks, so it
	 * reads as a coin tumbling in the air rather than a picture squeezed flat —
	 * the one thing a sprite's scale cannot do. It darkens as it goes edge-on
	 * (it is catching less light) and flashes as it comes face-up.
	 *
	 * Only the disc: the steel plate it sits in is gbPPlate (the same art with
	 * the coin taken out), drawn under it by StickyPrizes, so the plate stays
	 * put while the coin turns over it.
	 *
	 * Drawn into the pixi container it is mounted in, centred on (x, y).
	 */
	import { Mesh, MeshGeometry, Container, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	type Props = {
		x: number;
		y: number;
		/** the cell the coin art is drawn for (gbP is a full cell) */
		size: number;
		/** turn about the axis, radians (0 face-up) */
		flip: number;
		/** the axis it turns about, in the coin's plane: 0 horizontal (a toss),
		 *  turning with time for a coin settling on a table (StickyPrizes'
		 *  toss leaves it 0; CoinLand spins it) */
		axis?: number;
		/** uniform scale on top (the pop-in) */
		scale?: number;
	};

	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();

	// the coin's radius in the 256px art, just past the rope rim (the plate's
	// socket in p_plate.png was cut at the same radius)
	const DISC = 0.368;
	const RINGS = 6;
	const SEGS = 28;
	const V = 1 + RINGS * SEGS;

	const root = new Container();
	const positions = new Float32Array(V * 2);
	const uvs = new Float32Array(V * 2);
	const indices: number[] = [];
	const polar: [number, number][] = [[0, 0]];
	uvs[0] = 0.5;
	uvs[1] = 0.5;
	for (let r = 1; r <= RINGS; r++)
		for (let s = 0; s < SEGS; s++) {
			const a = (s / SEGS) * Math.PI * 2;
			const k = (r / RINGS) * DISC;
			const i = polar.length;
			polar.push([Math.cos(a) * k, Math.sin(a) * k]);
			uvs[i * 2] = 0.5 + Math.cos(a) * k;
			uvs[i * 2 + 1] = 0.5 + Math.sin(a) * k;
		}
	const at = (r: number, s: number) => (r === 0 ? 0 : 1 + (r - 1) * SEGS + (s % SEGS));
	for (let s = 0; s < SEGS; s++) indices.push(0, at(1, s), at(1, s + 1));
	for (let r = 1; r < RINGS; r++)
		for (let s = 0; s < SEGS; s++) indices.push(at(r, s), at(r + 1, s), at(r + 1, s + 1), at(r, s), at(r + 1, s + 1), at(r, s + 1));

	let geometry: MeshGeometry | undefined;
	let mesh: Mesh | undefined;
	let shine: Mesh | undefined;

	const pose = () => {
		if (!geometry || !mesh || !shine) return;
		const size = props.size * (props.scale ?? 1);
		const c = Math.cos(props.flip), s = Math.sin(props.flip);
		const ca = Math.cos(props.axis ?? 0), sa = Math.sin(props.axis ?? 0);
		// the eye is three coin-widths away: strong enough to see, not a fisheye
		const eye = size * 3;
		for (let i = 0; i < V; i++) {
			const u = polar[i][0] * size, v = polar[i][1] * size;
			// into the axis' frame: along it, and across it (the part that tips)
			const along = u * ca + v * sa, across = -u * sa + v * ca;
			const z = across * s;
			const k = eye / (eye + z);
			const tipped = across * c;
			positions[i * 2] = props.x + (along * ca - tipped * sa) * k;
			positions[i * 2 + 1] = props.y + (along * sa + tipped * ca) * k;
		}
		geometry.getBuffer('aPosition').update();
		// light: dim edge-on, a flash of it coming face-up
		const face = Math.abs(c);
		const lit = Math.round(255 * (0.5 + 0.5 * face));
		mesh.tint = (lit << 16) | (lit << 8) | Math.round(lit * 0.92);
		shine.alpha = Math.max(0, face - 0.7) * 1.6 * (Math.abs(s) > 0.05 ? 1 : 0);
	};

	$effect(() => {
		void [props.x, props.y, props.size, props.flip, props.scale, props.axis];
		pose();
	});

	onMount(() => {
		const texture = app.stateApp.loadedAssets?.gbP as Texture | undefined;
		if (!texture) {
			console.error('CoinMesh: gbP not loaded');
			return;
		}
		geometry = new MeshGeometry({ positions, uvs, indices: new Uint32Array(indices) });
		mesh = new Mesh({ geometry, texture });
		// the same disc again, additive: the glint as it turns face-up
		shine = new Mesh({ geometry, texture });
		shine.blendMode = 'add';
		shine.alpha = 0;
		root.addChild(mesh, shine);
		parent.parent.addChild(root);
		pose();
		return () => {
			root.removeFromParent();
			root.destroy({ children: true });
			geometry?.destroy();
		};
	});
</script>
