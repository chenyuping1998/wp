import { Container, Mesh, MeshGeometry, type Texture } from 'pixi.js';
import { MeshAttachment, type TextureAtlasRegion, type Slot } from '@esotericsoftware/spine-core';
import { parseMedusaRig, createMedusaPlayer } from './medusaRigCore';
import rigJson from './medusaRigData.json';
import atlasText from './medusaRigAtlas.txt?raw';

/** Official Spine 4.3 poses, rendered through this app's existing Pixi version.
 * This avoids replacing the shared 4.2 loader or installing a second Pixi renderer.
 * Our authored skeleton uses mesh attachments only, normal alpha and no clipping.
 */
export function createMedusaRigScene(pages: Record<string, Texture>, onSnakeFidget?: (index: number) => void) {
	const { data, atlas } = parseMedusaRig(rigJson, atlasText), player = createMedusaPlayer(data,onSnakeFidget);
	const root = new Container(); root.eventMode = 'none'; root.label = 'Medusa / Spine 4.3 / nine independent snakes';
	const cache = new Map<MeshAttachment,{ mesh: Mesh; geometry: MeshGeometry; positions: Float32Array; world: Float32Array }>();
	let portrait = false, night = false, disposed = false;
	const isHeadSlot = (slot: Slot) => /^(hair_back|face|glasses|snake_)/.test(slot.data.name);
	function update(seconds: number) {
		if (disposed) return;
		player.update(seconds);
		for (const item of cache.values()) item.mesh.visible = false;
		for (const [index,slot] of player.skeleton.drawOrder.appliedPose.entries()) {
			if (portrait && !isHeadSlot(slot)) continue;
			const pose = slot.getAppliedPose(), attachment = pose.getAttachment();
			if (!(attachment instanceof MeshAttachment)) continue;
			let item = cache.get(attachment);
			const sequenceIndex = attachment.sequence.resolveIndex(pose), region = attachment.sequence.regions[sequenceIndex] as TextureAtlasRegion;
			if (!item) {
				const positions = new Float32Array(attachment.worldVerticesLength), world = new Float32Array(positions.length);
				const geometry = new MeshGeometry({ positions, uvs: new Float32Array(attachment.sequence.getUVs(sequenceIndex)), indices: new Uint32Array(attachment.triangles) });
				const texture = pages[region.page.name]; if (!texture) throw new Error(`Medusa atlas page missing: ${region.page.name}`);
				const mesh = new Mesh({ geometry, texture }); root.addChild(mesh); item = { mesh, geometry, positions, world }; cache.set(attachment,item);
			}
			attachment.computeWorldVertices(player.skeleton,slot,0,attachment.worldVerticesLength,item.world,0,2);
			for (let i=0;i<item.positions.length;i+=2) { item.positions[i]=item.world[i]; item.positions[i+1]=-item.world[i+1]; }
			item.geometry.getBuffer('aPosition').update();
			item.mesh.visible = pose.color.a > 0.001; item.mesh.alpha = pose.color.a * attachment.color.a;
			const channel = (v: number) => Math.max(0,Math.min(255,Math.round(v*255)));
			item.mesh.tint = (channel(pose.color.r * attachment.color.r * (night ? 0.90 : 1))<<16)|(channel(pose.color.g * attachment.color.g * (night ? 0.94 : 1))<<8)|channel(pose.color.b * attachment.color.b);
			item.mesh.zIndex = index;
		}
		root.sortChildren();
	}
	root.sortableChildren = true;
	update(0);
	return { root, player, update,
		getGazeAnchors(){
			const point=(name:string)=>{const pose=(player.skeleton.findBone(name)??player.skeleton.findBone('eyes')!).getAppliedPose();return{x:root.x+pose.worldX*root.scale.x,y:root.y-pose.worldY*root.scale.y};};
			const left=point('eye_left');
			const right=point('eye_right');
			return{left,right,center:{x:(left.x+right.x)/2,y:(left.y+right.y)/2}};
		},
		setPortrait(value: boolean) { portrait=value; update(0); },
		setFreegame(value: boolean) { night=value;player.setFreegame(value); },
		setReducedMotion(value: boolean) { player.setReducedMotion(value);update(0); },
		play(name: string,hold=false,rate=1) { return player.play(name,hold,rate); },
		reset() { player.reset();update(0); },
		destroy() { if(disposed)return;disposed=true;player.destroy();root.destroy({children:true});for(const item of cache.values())item.geometry.destroy();cache.clear();atlas.dispose(); },
	};
}
