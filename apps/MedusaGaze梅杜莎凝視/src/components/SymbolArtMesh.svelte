<script lang="ts">
	import { Container, Graphics, Mesh, MeshGeometry, Sprite, ColorMatrixFilter, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onDestroy } from 'svelte';
	import { symbolPose, symbolPoint, symbolAccents, stoneFront, clamp01 } from '../game/symbolMotion';
	import { STONE_COLOR } from '../game/constants';

	type Props = { assetKey: string; name: string; progress: number; width: number; height: number; tint?: number; stone?: number };
	const props: Props = $props();
	const app = getContextApp(), parent = getContextParent();
	const root = new Container(), body = new Container();
	const accents = new Graphics(), shine = new Graphics();
	const stoneLayer = new Container(), finish = new Container(), stoneMask = new Graphics(), stoneEdge = new Graphics();
	const stoneFilter = new ColorMatrixFilter(); stoneFilter.saturate(-1, false);
	stoneLayer.filters = [stoneFilter];
	root.label = 'Medusa symbol acting'; root.addChild(body); parent.addToParent(root);
	const side = 32, positions = new Float32Array((side + 1) ** 2 * 2), uvs = new Float32Array(positions.length);
	const indices: number[] = [];
	for (let y = 0; y <= side; y++) for (let x = 0; x <= side; x++) {
		const at = (y * (side + 1) + x) * 2; uvs[at] = x / side; uvs[at + 1] = y / side;
		positions[at] = x / side - 0.5; positions[at + 1] = y / side - 0.5;
		if (x < side && y < side) { const a = y * (side + 1) + x; indices.push(a, a + 1, a + side + 1, a + 1, a + side + 2, a + side + 1); }
	}
	let geometry: MeshGeometry | undefined, mesh: Mesh | undefined, glowMesh:Mesh | undefined, stoneMesh: Mesh | undefined, mask: Sprite | undefined;
	$effect(() => {
		const texture = app.stateApp.loadedAssets?.[props.assetKey] as Texture | undefined;
		if (!texture || root.destroyed) return;
		if (!mesh) {
			geometry = new MeshGeometry({ positions, uvs, indices: new Uint32Array(indices) });
			mesh = new Mesh({ geometry, texture }); stoneMesh = new Mesh({ geometry, texture });
			glowMesh=new Mesh({geometry,texture});glowMesh.blendMode='add';glowMesh.alpha=0;
			stoneMesh.tint = STONE_COLOR; stoneLayer.addChild(stoneMesh); stoneLayer.mask = stoneMask;
			finish.addChild(shine, stoneEdge); body.addChild(mesh,glowMesh, stoneLayer, stoneMask, accents, finish);
			mask = new Sprite(texture); mask.anchor.set(0.5); mask.width = mask.height = 1;
			body.addChild(mask); finish.mask = mask;
		}
		mesh.texture = texture; mask!.texture = texture; mask!.width = mask!.height = 1;
		stoneMesh!.texture = texture;
		glowMesh!.texture=texture;
		const s = clamp01(props.stone ?? 0), boundary: number[] = [], reverseBoundary: number[] = [];
		for (let i = 0; i <= 24; i++) { const u = i / 24; boundary.push(u - .5, stoneFront(u, s)); }
		for (let i = boundary.length - 2; i >= 0; i -= 2) reverseBoundary.push(boundary[i], boundary[i+1]);
		stoneLayer.visible = s > 0;
		stoneMask.clear().poly([-.6,-.7,.6,-.7,...reverseBoundary]).fill(0xffffff);
		stoneEdge.clear();
		if (s > 0 && s < 1) {
			stoneEdge.moveTo(boundary[0], boundary[1]);
			for (let i = 2; i < boundary.length; i += 2) stoneEdge.lineTo(boundary[i], boundary[i+1]);
			stoneEdge.stroke({ width: .026, color: 0xd9ffd1, alpha: Math.sin(s*Math.PI)*.8 });
		}
		stoneEdge.blendMode = 'add';
		const p = props.progress, pose = symbolPose(props.name, p);
		for (let i = 0; i < positions.length; i += 2) { const v = symbolPoint(props.name, uvs[i], uvs[i + 1], p); positions[i] = v.x; positions[i + 1] = v.y; }
		geometry!.getBuffer('aPosition').update(); mesh.tint = props.tint ?? 0xffffff;
		body.position.set(pose.x * props.width, pose.y * props.height);
		body.scale.set(props.width * pose.sx, props.height * pose.sy); body.rotation = pose.rotation;
		accents.clear(); accents.tint = props.tint ?? 0xffffff;
		for (const shape of symbolAccents(props.name, p)) {
			if (shape.alpha <= 0) continue;
			if (shape.type === 'ellipse') accents.ellipse(shape.x!, shape.y!, shape.rx!, Math.max(0.001, shape.ry!)).fill({ color: shape.color, alpha: shape.alpha });
			else if (shape.type === 'polygon') accents.poly(shape.points!).fill({ color: shape.color, alpha: shape.alpha });
		}
		glowMesh!.alpha=s===0?pose.glint:0;
		shine.clear();
	});
	onDestroy(() => { if (!root.destroyed) root.destroy({ children: true }); geometry?.destroy(); stoneFilter.destroy(); });
</script>
