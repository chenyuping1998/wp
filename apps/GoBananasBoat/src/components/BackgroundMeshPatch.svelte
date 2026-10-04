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
	 * One moving patch of a background plate (game/meshWin/bgPatches.ts): the
	 * crane hook, a tarp, the caged lamp. A rectangle of the plate drawn through
	 * a mesh ON TOP of the plate, at exactly the plate's own place and size —
	 * the props are the plate sprite's own (Background's parallax) — so its
	 * fixed border lines up with the plate underneath and there is no seam.
	 *
	 * It loops for as long as its plate is on screen. The UVs point straight
	 * into the full plate texture rather than at a sub-texture: on WebGPU
	 * pixi 8.8.1's mesh ignores a texture's frame (see SymbolMeshWin).
	 */
	import { Mesh, MeshGeometry, Container, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { skin } from '../game/meshWin/meshRig';
	import { holdRoll, HOLD_ROLL_LOOP } from '../game/meshWin/bgPatches';

	type Props = {
		spec: MeshWinSpec;
		x: number;
		y: number;
		width: number;
		height: number;
		/** the plate under it rolls (BgRollPlate): warp this patch the same way */
		roll?: boolean;
	};

	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();
	const PLATE = props.spec.rig.uv ?? [1920, 1080];

	const root = new Container();

	$effect(() => {
		root.position.set(props.x, props.y);
		root.scale.set(props.width / PLATE[0], props.height / PLATE[1]);
	});

	onMount(() => {
		const spec = props.spec;
		const texture = app.stateApp.loadedAssets?.[spec.sprite ?? spec.key] as Texture | undefined;
		if (!texture) {
			console.error(`BackgroundMeshPatch: ${spec.key} not loaded`);
			return;
		}
		const rig = rigFor(spec);
		const positions = new Float32Array(rig.rest);
		const geometry = new MeshGeometry({ positions, uvs: rig.uvs, indices: rig.indices });
		const mesh = new Mesh({ geometry, texture });
		root.label = `bgPatch ${spec.symbol}`;
		root.addChild(mesh);
		parent.parent.addChild(root);

		// loops, so the clock is the wall clock modulo the loop: no drift, and a
		// tab coming back from the background picks up where the wind is
		const tick = () => {
			const t = performance.now() % spec.durationMs;
			skin(rig, spec.pose(rig, t), spec.feetY, positions);
			if (props.roll) {
				const rt = performance.now() % HOLD_ROLL_LOOP;
				for (let i = 0; i < positions.length; i += 2) {
					const [x, y] = holdRoll(positions[i], positions[i + 1], rt);
					positions[i] = x;
					positions[i + 1] = y;
				}
			}
			geometry.getBuffer('aPosition').update();
		};
		const ticker = app.stateApp.pixiApplication?.ticker;
		tick();
		ticker?.add(tick);

		return () => {
			ticker?.remove(tick);
			root.removeFromParent();
			root.destroy({ children: true });
			geometry.destroy();
		};
	});
</script>
