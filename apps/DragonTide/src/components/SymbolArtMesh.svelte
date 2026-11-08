<script lang="ts">
	import { Container, Graphics, Mesh, MeshGeometry, Sprite, type Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onDestroy } from 'svelte';
	import { symbolPose, symbolPoint, symbolAccents } from '../game/symbolMotion';

	type Props = { assetKey: string; name: string; progress: number; width: number; height: number; tint?: number };
	const props: Props = $props();
	const app = getContextApp(), parent = getContextParent();
	const root = new Container(), body = new Container();
	const accents = new Graphics(), shine = new Graphics();
	root.label = 'Medusa symbol acting'; root.addChild(body); parent.addToParent(root);
	const side = 32, positions = new Float32Array((side + 1) ** 2 * 2), uvs = new Float32Array(positions.length);
	const indices: number[] = [];
	for (let y = 0; y <= side; y++) for (let x = 0; x <= side; x++) {
		const at = (y * (side + 1) + x) * 2; uvs[at] = x / side; uvs[at + 1] = y / side;
		positions[at] = x / side - 0.5; positions[at + 1] = y / side - 0.5;
		if (x < side && y < side) { const a = y * (side + 1) + x; indices.push(a, a + 1, a + side + 1, a + 1, a + side + 2, a + side + 1); }
	}
	let geometry: MeshGeometry | undefined, mesh: Mesh | undefined, mask: Sprite | undefined;
	$effect(() => {
		const texture = app.stateApp.loadedAssets?.[props.assetKey] as Texture | undefined;
		if (!texture || root.destroyed) return;
		if (!mesh) {
			geometry = new MeshGeometry({ positions, uvs, indices: new Uint32Array(indices) });
			mesh = new Mesh({ geometry, texture }); body.addChild(mesh, accents, shine);
			mask = new Sprite(texture); mask.anchor.set(0.5); mask.width = mask.height = 1;
			body.addChild(mask); shine.mask = mask;
		}
		mesh.texture = texture; mask!.texture = texture; mask!.width = mask!.height = 1;
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
		shine.clear(); shine.alpha = pose.glint;
		const x = -0.7 + p * 1.4;
		shine.poly([x - 0.08, -0.6, x + 0.04, -0.6, x + 0.30, 0.6, x + 0.18, 0.6]).fill(0xfff4d8);
		shine.blendMode = 'add';
	});
	onDestroy(() => { if (!root.destroyed) root.destroy({ children: true }); geometry?.destroy(); });
</script>
