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
	 * A plaque whose sky face RINGS when struck (game/meshWin/plateJelly.ts):
	 * the plate's own art through a mesh, the frame held still, the face
	 * wobbling and settling after each `hit`. Drawn at the top-left of the
	 * plate like the Sprite it replaces (anchor 0), or centred with `centred`.
	 *
	 * The caller strikes it by changing `hit` (a counter) and says how hard with
	 * `amp`; the ring then runs on its own clock.
	 */
	import { Mesh, MeshGeometry, Container, Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onMount } from 'svelte';

	import { skin } from '../game/meshWin/meshRig';
	import { plateJellyPose, PLATE_RING_MS } from '../game/meshWin/plateJelly';

	type Props = {
		spec: MeshWinSpec;
		width: number;
		height: number;
		/** bump to strike it */
		hit: number;
		/** how hard the latest strike was, 0..1 */
		amp: number;
		centred?: boolean;
	};

	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();
	const [W, H] = props.spec.rig.uvSize ?? [256, 256];

	const root = new Container();
	let struckAt = -1;
	let lastHit = props.hit;

	onMount(() => {
		const rig = rigFor(props.spec);
		const positions = new Float32Array(rig.rest);
		const geometry = new MeshGeometry({ positions, uvs: rig.uvs, indices: rig.indices });
		// The counter mounts with the game, and the game mounts while the assets
		// that are not preloaded are still streaming in: the plaque's texture may
		// not exist yet. So the mesh starts empty and picks it up when it lands,
		// the way a Sprite would.
		const texture = () => (app.stateApp.loadedAssets ?? {})[props.spec.sprite] as Texture | undefined;
		const mesh = new Mesh({ geometry, texture: texture() ?? Texture.EMPTY });
		const content = new Container();
		if (props.centred) content.position.set(-W / 2, -H / 2);
		content.addChild(mesh);
		root.addChild(content);
		parent.parent.addChild(root);

		let resting = true;
		const tick = () => {
			if (mesh.texture === Texture.EMPTY) {
				const tex = texture();
				if (tex) mesh.texture = tex;
			}
			root.scale.set(props.width / W, props.height / H);
			const t = struckAt < 0 ? -1 : performance.now() - struckAt;
			if (t < 0 || t > PLATE_RING_MS) {
				// back on the drawing, and nothing to do until the next strike
				if (!resting) {
					positions.set(rig.rest);
					geometry.getBuffer('aPosition').update();
					resting = true;
				}
				return;
			}
			resting = false;
			// the last 150ms blend home, so the rest frame is exact
			const home = Math.max(0, Math.min(1, (t - (PLATE_RING_MS - 150)) / 150));
			skin(rig, plateJellyPose(rig, t, props.amp * (1 - home)), props.spec.feetY, positions);
			geometry.getBuffer('aPosition').update();
		};
		const ticker = app.stateApp.pixiApplication?.ticker;
		ticker?.add(tick);
		tick();
		return () => {
			ticker?.remove(tick);
			root.removeFromParent();
			root.destroy({ children: true });
			geometry.destroy();
		};
	});

	$effect(() => {
		if (props.hit !== lastHit) {
			lastHit = props.hit;
			struckAt = performance.now();
		}
	});
</script>
