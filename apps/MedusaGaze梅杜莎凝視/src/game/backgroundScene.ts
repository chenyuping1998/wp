import { Container, Graphics, Mesh, MeshGeometry, Sprite, type Texture } from 'pixi.js';
import { BACKGROUND_SIZE, CLOUDS, BRAZIERS, STATUES, STATUE_SECONDS, STATUE_TO_MEDUSA_HEIGHT,STATUE_FRACTURE_PIECES, FLAME_GRID, cloudPosition, cloudVisibility, statueEnvelope, statuePiecePose, flamePoint, flameUV, mixTint, clamp } from './backgroundMotion';

type Textures = Record<string, Texture>;
/** The exact same Pixi renderer is used in the game and the offline review. */
export function createBackgroundScene(textures: Textures) {
	const root = new Container(); root.label = 'Medusa plaza / fixed architecture'; root.eventMode = 'none';
	const day = new Sprite(textures.mgBgBase), night = new Sprite(textures.mgBgFree);
	for (const sprite of [day, night]) { sprite.width = BACKGROUND_SIZE.width; sprite.height = BACKGROUND_SIZE.height; root.addChild(sprite); }
	night.alpha = 0;
	const cloudLayer = new Container(), skyMask = new Graphics().rect(155, 0, 1615, 145).fill(0xffffff);
	root.addChild(cloudLayer, skyMask); cloudLayer.mask = skyMask;
	const clouds = CLOUDS.map(data => { const sprite = new Sprite(textures.mgBgCloud); sprite.anchor.set(0.5); sprite.position.set(data.x, data.y); sprite.width = data.width; sprite.height = data.height; cloudLayer.addChild(sprite); return sprite; });
	const ownedGeometry: MeshGeometry[] = [];
	const flames = BRAZIERS.map((bowl, index) => {
		const group = new Container(); group.position.set(bowl.x, bowl.y); root.addChild(group);
		const glow = new Sprite(textures.fxGlow); glow.anchor.set(0.5); glow.y = -20; glow.width = 145; glow.height = 100; glow.tint = 0xffa747; glow.alpha = 0.19; glow.blendMode = 'add'; group.addChild(glow);
		const side = FLAME_GRID.columns, rows = FLAME_GRID.rows, positions = new Float32Array((side + 1) * (rows + 1) * 2), uvs = new Float32Array(positions.length), indices: number[] = [];
		for (let y = 0; y <= rows; y++) for (let x = 0; x <= side; x++) {
			const i = (y * (side + 1) + x) * 2; uvs[i] = x / side; uvs[i + 1] = y / rows;
			positions[i] = (x / side - 0.5) * 76; positions[i + 1] = (y / rows - 1) * 112;
			if (x < side && y < rows) { const a = y * (side + 1) + x; indices.push(a, a + 1, a + side + 1, a + 1, a + side + 2, a + side + 1); }
		}
		const geometry = new MeshGeometry({ positions, uvs, indices: new Uint32Array(indices) }); ownedGeometry.push(geometry);
		const mesh = new Mesh({ geometry, texture: textures.mgBgFlame }); group.addChild(mesh);
		return { group, geometry, positions, uvs, restUVs: uvs.slice(), index };
	});
	const statues = STATUES.map(data => {
		const group = new Container(); group.position.set(data.x, data.y); root.addChild(group);
		const shadow = new Sprite(textures.fxGlow); shadow.anchor.set(0.5); shadow.position.set(0,-1); shadow.width = data.width * 1.04; shadow.height = data.width*.10; shadow.tint = 0x473c34; shadow.alpha = 0.20;group.addChild(shadow);
		const texture = textures[data.key], intact = new Sprite(texture); intact.anchor.set(0.5, 1); intact.width = data.width; intact.height = data.height; group.addChild(intact);
		const pieces = new Container(); group.addChild(pieces);
		const meshes = STATUE_FRACTURE_PIECES.map(points => {
			const uv = points.map(([x, y]) => [x, y * data.plinth]);
			const cx = uv.reduce((sum, p) => sum + p[0] - 0.5, 0) / uv.length * data.width;
			const cy = uv.reduce((sum, p) => sum + p[1] - 1, 0) / uv.length * data.height;
			const positions = new Float32Array(uv.flatMap(([u, v]) => [(u - 0.5) * data.width - cx, (v - 1) * data.height - cy]));
			const indices: number[] = []; for (let i = 1; i < uv.length - 1; i++) indices.push(0, i, i + 1);
			const geometry = new MeshGeometry({ positions, uvs: new Float32Array(uv.flat()), indices: new Uint32Array(indices) }); ownedGeometry.push(geometry);
			const piece = new Container(); piece.position.set(cx, cy); pieces.addChild(piece);
			// A thin, shaded copy of the original material gives opened cracks
			// thickness. It is invisible at rest and shares the front's geometry.
			const side = new Mesh({ geometry, texture }), mesh = new Mesh({ geometry, texture });
			side.alpha = 0.85; piece.addChild(side, mesh); return { piece, mesh, side, cx, cy };
		});
		const baseGeometry = new MeshGeometry({ positions: new Float32Array([-data.width/2,(data.plinth-1)*data.height,data.width/2,(data.plinth-1)*data.height,-data.width/2,0,data.width/2,0]), uvs: new Float32Array([0,data.plinth,1,data.plinth,0,1,1,1]), indices: new Uint32Array([0,1,2,1,3,2]) }); ownedGeometry.push(baseGeometry);
		const base = new Mesh({ geometry: baseGeometry, texture }); pieces.addChild(base);
		const cracks = new Container();
		const crackFrames = [textures.fxCrack1, textures.fxCrack2, textures.fxCrack3].map(texture => {
			const frame = new Sprite(texture); frame.anchor.set(0.5, 1); frame.width = data.width; frame.height = data.height; frame.tint = 0x49433e; cracks.addChild(frame); return frame;
		});
		const mask = new Sprite(texture); mask.anchor.set(0.5, 1); mask.width = data.width; mask.height = data.height; group.addChild(cracks, mask); cracks.mask = mask;
		return { data, group, intact, pieces, meshes, base, cracks, crackFrames };
	});
	let elapsed = 0, nightness = 0, target = 0, burstAge = STATUE_SECONDS, reduced = false, disposed = false;
	function update(seconds: number) {
		if (disposed) return;
		const dt = Math.max(0, seconds);
		if (!reduced) { elapsed += dt; burstAge = Math.min(STATUE_SECONDS, burstAge + dt); }
		nightness += Math.sign(target - nightness) * Math.min(Math.abs(target - nightness), dt / (reduced ? 0.25 : 1));
		night.alpha = nightness;
		clouds.forEach((cloud, index) => { cloud.x = cloudPosition(elapsed, CLOUDS[index].x, CLOUDS[index].width); cloud.tint = mixTint(0xffffff, 0x8997c2, nightness); cloud.alpha = (0.8 - nightness * 0.28) * cloudVisibility(cloud.x, CLOUDS[index].width); });
		for (const flame of flames) {
			flame.group.alpha = nightness; flame.group.visible = nightness > 0.001;
			if (!flame.group.visible) continue;
			for (let i = 0; i < flame.positions.length; i += 2) {
				const u = flame.restUVs[i], v = flame.restUVs[i + 1], time = reduced ? 0 : elapsed, seed = flame.index * 2.43;
				const p = flamePoint(u, v, time, seed), uv = flameUV(u, v, time, seed);
				flame.positions[i] = p.x * 76; flame.positions[i + 1] = p.y * 112;
				flame.uvs[i] = uv.u; flame.uvs[i + 1] = uv.v;
			}
			flame.geometry.getBuffer('aPosition').update();
			flame.geometry.getBuffer('aUV').update();
		}
		const state = statueEnvelope(burstAge), tint = mixTint(0xffffff, 0x9cafd1, nightness);
		for (const statue of statues) {
			statue.intact.tint = tint; statue.base.tint = tint;
			statue.intact.visible = state.split < 0.00001; statue.pieces.visible = !statue.intact.visible;
			statue.cracks.alpha = statue.intact.visible ? state.crack * 0.74 : 0;
			statue.crackFrames.forEach((frame, index) => { frame.visible = index === state.crackStage; });
			statue.meshes.forEach(({ piece, mesh, side, cx, cy }, index) => {
				const p = statuePiecePose(index, burstAge, statue.data.width, statue.data.height);
				piece.position.set(cx + p.x, cy + p.y); piece.rotation = p.rotation;
				mesh.tint = tint; side.tint = mixTint(tint, 0x51463c, 0.58);
				side.position.set(statue.data.height*.005*p.depth,statue.data.height*.00625*p.depth); side.visible = p.depth > 0.003;
			});
		}
	}
	function setBounds(width:number,height:number,medusaHeight=height*.65,groundY=height*.87){
		const scale=Math.max(width/BACKGROUND_SIZE.width,height/BACKGROUND_SIZE.height);root.scale.set(scale);root.position.set((width-BACKGROUND_SIZE.width*scale)/2,(height-BACKGROUND_SIZE.height*scale)/2);
		for(const statue of statues){statue.group.scale.set(medusaHeight*STATUE_TO_MEDUSA_HEIGHT/(statue.data.height*scale));statue.group.y=(groundY-root.y)/scale;}
	}
	update(0);
	return { root, update, setBounds,
		setNight(value: boolean) { target = value ? 1 : 0; },
		setReducedMotion(value: boolean) { reduced = value; if (value) burstAge = STATUE_SECONDS; update(0); },
		burstStatues() { if (disposed || reduced || burstAge < STATUE_SECONDS) return false; burstAge = 0; update(0); return true; },
		snapshot() { return { elapsed, nightness: clamp(nightness), burstAge, reduced, cloudX: clouds.map(c => c.x), architecture: { x: day.x, y: day.y, rotation: day.rotation },statues:statues.map(s=>({height:s.data.height*s.group.scale.y*root.scale.y,groundY:root.y+s.group.y*root.scale.y})) }; },
		destroy() { if (disposed) return; disposed = true; root.destroy({ children: true }); ownedGeometry.forEach(geometry => geometry.destroy()); },
	};
}
