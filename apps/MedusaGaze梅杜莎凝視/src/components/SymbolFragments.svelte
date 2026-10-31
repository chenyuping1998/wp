<script lang="ts">
	import { Container, Graphics, Mesh, MeshGeometry, Sprite, ColorMatrixFilter, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onDestroy } from 'svelte';
	import { FRACTURE_PIECES, fragmentPose, smooth } from '../game/symbolMotion';
	import { drawStoneDebris } from '../game/presentationFx';
	type Props = { assetKey: string; progress: number; width: number; height: number; seed?: number };
	const props: Props = $props();
	const app = getContextApp(), parent = getContextParent(), root = new Container();
	root.label = 'Medusa fractured symbol'; parent.addToParent(root);
	const debris = new Graphics(); root.addChild(debris);
	const crackLayer=new Container(),crackImage=new Sprite(),crackMask=new Sprite();
	crackImage.anchor.set(.5);crackMask.anchor.set(.5);crackLayer.addChild(crackImage);crackLayer.mask=crackMask;
	const stoneFilter = new ColorMatrixFilter(); stoneFilter.saturate(-1, false); root.filters = [stoneFilter];
	const fragments: { node: Container; geometry: MeshGeometry; mesh: Mesh; edge: Mesh }[] = [];
	$effect(() => {
		const texture = app.stateApp.loadedAssets?.[props.assetKey] as Texture | undefined;
		if (!texture || root.destroyed) return;
		if (!fragments.length) for (const points of FRACTURE_PIECES) {
			const cx = points.reduce((a, p) => a + p[0], 0) / points.length;
			const cy = points.reduce((a, p) => a + p[1], 0) / points.length;
			const indices: number[] = []; for (let i = 1; i < points.length - 1; i++) indices.push(0, i, i + 1);
			const geometry = new MeshGeometry({ positions: new Float32Array(points.flatMap(([x, y]) => [x - cx, y - cy])),
				uvs: new Float32Array(points.flatMap(([x, y]) => [x + 0.5, y + 0.5])), indices: new Uint32Array(indices) });
			const mesh = new Mesh({ geometry, texture }), edge = new Mesh({ geometry, texture }), node = new Container();
			mesh.position.set(cx, cy); node.pivot.set(cx, cy); node.position.set(cx, cy);
			edge.tint = 0x56534e;
			node.addChild(edge, mesh); root.addChild(node); fragments.push({ node, geometry, mesh, edge });
		}
		// Keep the final crack drawing through the short impact hold, rather
		// than showing a repaired icon for one frame at the crumble boundary.
		if(crackLayer.parent!==root)root.addChild(crackLayer,crackMask);
		crackLayer.visible=props.progress<.18;
		crackLayer.alpha=1-smooth((props.progress-.08)/.1);
		const crackTexture=app.stateApp.loadedAssets?.fxCrack3 as Texture|undefined;
		if(crackTexture){crackImage.texture=crackTexture;crackImage.width=crackImage.height=1;}
		crackMask.texture=texture;crackMask.width=crackMask.height=1;
		root.scale.set(props.width, props.height);
		drawStoneDebris(debris,props.progress,props.seed);
		fragments.forEach(({ node, mesh, edge }, index) => {
			const points = FRACTURE_PIECES[index], cx = points.reduce((a, p) => a + p[0], 0) / points.length, cy = points.reduce((a, p) => a + p[1], 0) / points.length;
			const pose = fragmentPose(index, props.progress, props.seed);
			node.position.set(cx + pose.x, cy + pose.y); node.rotation = pose.rotation; node.scale.set(pose.scale * pose.sx, pose.scale); node.alpha = pose.alpha;
			mesh.texture = texture; mesh.tint = 0xa9a39a;
			edge.texture = texture; edge.position.set(cx + .025 * pose.depth, cy + .018 * pose.depth); edge.visible = pose.depth > .001;
		});
	});
	onDestroy(() => { if (!root.destroyed) root.destroy({ children: true }); fragments.forEach(({ geometry }) => geometry.destroy()); stoneFilter.destroy(); });
</script>
