<script lang="ts" module>
	import { buildRig, type Rig } from '../game/meshWin/meshRig';
	import type { MeshWinSpec } from '../game/meshWin';

	const rigs = new Map<string, Rig>();
	const rigFor = (spec: MeshWinSpec) => {
		let rig = rigs.get(spec.symbol);
		if (!rig) rigs.set(spec.symbol, (rig = buildRig(spec.rig)));
		return rig;
	};
</script>

<script lang="ts">
	/**
	 * A cut subject OFF its plate, walking — the win-line scarab, and the scarab
	 * the jackal god throws in the transition. It draws the subject's mesh only
	 * (`${key}Subject`, all six legs), posed by the spec's walk cycle
	 * (meshRig.MeshWinSpec.walk): `phase` is the gait's angle and should follow
	 * distance covered so the feet never skate, `amount` 0..1 how hard it strides.
	 *
	 * The caller owns position and heading; this only re-skins when the pose
	 * inputs change. Pixi objects are built on mount and hung on the parent
	 * pixi-svelte container, like SymbolMeshWin.
	 */
	import { Container, Mesh, MeshGeometry, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { CANVAS, skin } from '../game/meshWin/meshRig';
	import { MESH_WINS } from '../game/meshWin';

	type Props = {
		symbolName: string;
		x: number;
		y: number;
		/** px the 256 canvas is drawn at */
		size: number;
		rotation?: number;
		alpha?: number;
		phase: number;
		amount: number;
		/** extra uniform scale (the arrival hop) */
		scale?: number;
		tint?: number;
		/** insert UNDER its siblings rather than on top. It mounts when it first
		 *  shows, after siblings declared below it in the markup, so a plain
		 *  addChild would draw it over them (the transition's blast and flash). */
		bottom?: boolean;
	};

	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();
	const spec = MESH_WINS[props.symbolName];

	const root = new Container();
	let geometry: MeshGeometry | null = null;
	let mesh: Mesh | null = null;
	let positions: Float32Array | null = null;
	let rig: Rig | null = null;

	onMount(() => {
		const texture = app.stateApp.loadedAssets?.[`${spec.key}Subject`] as Texture | undefined;
		if (!texture || !spec.walk) {
			console.error(`MeshWalker: ${spec.key} has no subject texture or no walk cycle`);
			return;
		}
		rig = rigFor(spec);
		positions = new Float32Array(rig.rest);
		geometry = new MeshGeometry({ positions, uvs: rig.uvs, indices: rig.indices });
		mesh = new Mesh({ geometry, texture });
		// the canvas centre is the pivot, so position and rotation act on the body
		mesh.position.set(-CANVAS / 2, -CANVAS / 2);
		root.addChild(mesh);
		if (props.bottom) parent.parent.addChildAt(root, 0);
		else parent.parent.addChild(root);
		return () => {
			root.removeFromParent();
			root.destroy({ children: true });
			geometry?.destroy();
			geometry = mesh = positions = rig = null;
		};
	});

	$effect(() => {
		const { x, y, size, rotation, alpha, phase, amount, scale, tint } = props;
		if (!rig || !positions || !geometry || !mesh || !spec.walk) return;
		skin(rig, spec.walk(rig, phase, amount), spec.feetY, positions);
		geometry.getBuffer('aPosition').update();
		root.position.set(x, y);
		root.rotation = rotation ?? 0;
		root.scale.set((size / CANVAS) * (scale ?? 1));
		root.alpha = alpha ?? 1;
		mesh.tint = tint ?? 0xffffff;
	});
</script>
