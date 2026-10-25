<script lang="ts">
	import { Container, Mesh, MeshGeometry, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onDestroy } from 'svelte';
	import { FRACTURE_PIECES, fragmentPose } from '../game/symbolMotion';
	type Props = { assetKey: string; progress: number; width: number; height: number; seed?: number };
	const props: Props = $props();
	const app = getContextApp(), parent = getContextParent(), root = new Container();
	root.label = 'Medusa fractured symbol'; parent.addToParent(root);
	const fragments: { node: Container; geometry: MeshGeometry; mesh: Mesh }[] = [];
	$effect(() => {
		const texture = app.stateApp.loadedAssets?.[props.assetKey] as Texture | undefined;
		if (!texture || root.destroyed) return;
		if (!fragments.length) for (const points of FRACTURE_PIECES) {
			const cx = points.reduce((a, p) => a + p[0], 0) / points.length;
			const cy = points.reduce((a, p) => a + p[1], 0) / points.length;
			const indices: number[] = []; for (let i = 1; i < points.length - 1; i++) indices.push(0, i, i + 1);
			const geometry = new MeshGeometry({ positions: new Float32Array(points.flatMap(([x, y]) => [x - cx, y - cy])),
				uvs: new Float32Array(points.flatMap(([x, y]) => [x + 0.5, y + 0.5])), indices: new Uint32Array(indices) });
			const mesh = new Mesh({ geometry, texture }), node = new Container();
			mesh.position.set(cx, cy); node.pivot.set(cx, cy); node.position.set(cx, cy);
			node.addChild(mesh); root.addChild(node); fragments.push({ node, geometry, mesh });
		}
		root.scale.set(props.width, props.height);
		fragments.forEach(({ node, mesh }, index) => {
			const points = FRACTURE_PIECES[index], cx = points.reduce((a, p) => a + p[0], 0) / points.length, cy = points.reduce((a, p) => a + p[1], 0) / points.length;
			const pose = fragmentPose(index, props.progress, props.seed);
			node.position.set(cx + pose.x, cy + pose.y); node.rotation = pose.rotation; node.scale.set(pose.scale); node.alpha = pose.alpha;
			mesh.texture = texture; mesh.tint = 0xa9a39a;
		});
	});
	onDestroy(() => { if (!root.destroyed) root.destroy({ children: true }); fragments.forEach(({ geometry }) => geometry.destroy()); });
</script>
