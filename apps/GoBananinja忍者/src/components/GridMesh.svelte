<script lang="ts">
	import { Container, Mesh, MeshGeometry, Sprite, Texture } from 'pixi.js';
	import { getContextApp, getContextParent } from 'pixi-svelte';
	import { onDestroy, onMount } from 'svelte';
	import { BG_GRID, makeGrid, poseBackground, poseSymbol, type BgLight } from '../game/gridMotion';
	import { makeBackgroundLighting } from '../game/sceneLighting';

	type Props = {
		assetKey: string;
		kind: 'symbol' | 'background';
		energy?: number;
		name: string;
		seconds: number;
		x?: number;
		y?: number;
		width: number;
		height: number;
		anchor?: number;
	};
	const props: Props = $props();
	const app = getContextApp();
	const parent = getContextParent();
	const root = new Container();
	parent.addToParent(root);
	let geometry: MeshGeometry | undefined;
	let builtKey = '';
	let grid: ReturnType<typeof makeGrid> | undefined;
	let positions: Float32Array | undefined;
	// the lanterns' and candles' glow (backgrounds): soft additive light that follows each lantern on its cord
	const lights: BgLight[] = [];
	const glows: Sprite[] = [];
	let glowTexture: Texture | undefined;
	const softGlow = () => {
		if (glowTexture) return glowTexture;
		const c = document.createElement('canvas');
		c.width = c.height = 128;
		const g = c.getContext('2d')!, r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
		r.addColorStop(0, 'rgba(255,255,255,0.85)');
		r.addColorStop(0.35, 'rgba(255,255,255,0.3)');
		r.addColorStop(1, 'rgba(255,255,255,0)');
		g.fillStyle = r;
		g.fillRect(0, 0, 128, 128);
		return (glowTexture = Texture.from(c));
	};
	onMount(() => {
		if (props.kind !== 'background') return;
		const filter = makeBackgroundLighting();
		root.filters = [filter];
		return () => {
			root.filters = [];
			filter.destroy();
		};
	});

	$effect(() => {
		const assetKey = props.assetKey;
		const texture = app.stateApp.loadedAssets?.[assetKey] as Texture | undefined;
		if (!texture) return;
		if (builtKey !== assetKey) {
			root.removeChildren().forEach((child) => child.destroy());
			glows.length = 0;
			geometry?.destroy();
			const cols = props.kind === 'background' ? BG_GRID.cols : 12;
			const rows = props.kind === 'background' ? BG_GRID.rows : 12;
			grid = makeGrid(texture.width, texture.height, cols, rows);
			positions = new Float32Array(grid.rest);
			geometry = new MeshGeometry({ positions, uvs: grid.uvs, indices: grid.indices });
			root.addChild(new Mesh({ geometry, texture }));
			builtKey = assetKey;
		}
		if (!grid || !positions || !geometry) return;
		if (props.kind === 'background') {
			poseBackground(grid, positions, props.seconds, props.name, lights);
			while (glows.length < lights.length) {
				const s = new Sprite({ texture: softGlow(), anchor: 0.5, blendMode: 'add' });
				root.addChild(s);
				glows.push(s);
			}
			glows.forEach((s, i) => {
				const l = lights[i];
				s.visible = !!l;
				if (!l) return;
				s.position.set(l.x, l.y);
				s.width = s.height = l.r * 2;
				s.tint = l.color;
				s.alpha = l.alpha * (1 + .35 * (props.energy ?? 0));
			});
		}
		else poseSymbol(grid, positions, props.name, props.seconds);
		geometry.getBuffer('aPosition').update();
		const anchor = props.anchor ?? 0;
		root.position.set((props.x ?? 0) - props.width * anchor, (props.y ?? 0) - props.height * anchor);
		root.scale.set(props.width / texture.width, props.height / texture.height);
	});

	onDestroy(() => {
		root.removeChildren().forEach((child) => child.destroy());
		geometry?.destroy();
		glowTexture?.destroy(true);
	});
</script>
