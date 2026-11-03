import { Container, Mesh, MeshGeometry, type Texture } from 'pixi.js';
import { AnimationState, AnimationStateData, Skeleton, SkeletonJson, Physics, type AttachmentLoader } from '@esotericsoftware/spine-core';
import mgRig from './hypnoCastData.json';
import mgAtlas from './hypnoCastAtlas.json';
import {castReleaseRate} from './hypnoWatchTiming';

// Bones, IK, curves and physics are evaluated by the real 4.3 runtime. The
// character's original region attachments are drawn through existing Pixi 8.
const loader = {
	newRegionAttachment: () => null, newMeshAttachment: () => null,
	newBoundingBoxAttachment: () => null, newPathAttachment: () => null,
	newPointAttachment: () => null, newClippingAttachment: () => null,
} as unknown as AttachmentLoader;
type Attachment = { x?: number; y?: number; rotation?: number; width: number; height: number };
type Part = { x: number; y: number; width: number; height: number; cropX: number; cropY: number };

export function createHypnoCastScene(texture: Texture, variant?: {rig:typeof mgRig;atlas:{width:number;height:number;parts:Record<string,Part>};facePoints?:{x:number;y:number}[];releaseBone?:string}) {
	const rig=variant?.rig??mgRig,atlas=variant?.atlas??mgAtlas;
	const data = new SkeletonJson(loader).readSkeletonData(rig);
	const skeleton = new Skeleton(data);
	const stateData = new AnimationStateData(data); stateData.defaultMix = 0.12;
	const state = new AnimationState(stateData);
	const root = new Container(); root.label = 'Hypno Monkey / stand34 / Spine 4.3'; root.eventMode = 'none'; root.sortableChildren = true;
	const skin = rig.skins[0].attachments as unknown as Record<string, Record<string, Attachment>>;
	const parts = atlas.parts as Record<string, Part>;
	const meshes = new Map<string, { mesh: Mesh; geometry: MeshGeometry; positions: Float32Array }>();
	let hidden = new Set<string>(), reduced = false, disposed = false, holding = false, acting = false, restTime = 0, inspection = false;
	state.setAnimation(0, 'idle', true);
	state.addListener({ complete: entry => { if (entry.trackIndex === 0 && !entry.loop && !holding) acting = false; } });
	const facePoints = variant?.facePoints??[{ x: 300, y: 370 }, { x: 385, y: 394 }];
	function matrix(slotName: string, drawing: string) {
		const slot = rig.slots.find(s => s.name === slotName)!;
		const bone = skeleton.findBone(slot.bone)!.getAppliedPose();
		const attachment = skin[slotName][drawing];
		const angle = (attachment.rotation ?? 0) * Math.PI / 180, c = Math.cos(angle), s = Math.sin(angle);
		const a = bone.a*c+bone.b*s, b = -bone.a*s+bone.b*c;
		const c1 = bone.c*c+bone.d*s, d = -bone.c*s+bone.d*c;
		const qx = bone.worldX+bone.a*(attachment.x??0)+bone.b*(attachment.y??0);
		const qy = bone.worldY+bone.c*(attachment.x??0)+bone.d*(attachment.y??0);
		return { a, b, c:c1, d, x:qx-a*attachment.width/2+b*attachment.height/2,
			y:qy-c1*attachment.width/2+d*attachment.height/2 };
	}
	function eyePoints() {
		const m = matrix('head', 'head_idle');
		return facePoints.map(p => ({ x:m.x+m.a*p.x-m.b*p.y, y:-(m.y+m.c*p.x-m.d*p.y) }));
	}
	skeleton.setupPose(); skeleton.updateWorldTransform(Physics.none);
	const setup = eyePoints();
	const setupEyes = { x:(setup[0].x+setup[1].x)/2, y:(setup[0].y+setup[1].y)/2 };
	function update(seconds: number) {
		if (disposed) return;
		const dt = Math.max(0, Math.min(0.1, seconds));
		if (!reduced && !inspection) { state.update(dt); skeleton.update(dt); }
		state.apply(skeleton); skeleton.updateWorldTransform(Physics.none);
		if (!acting && !reduced && !inspection && (restTime += dt) >= 18) {
			restTime = 0; acting = true; state.setAnimation(0,'idle_fidget',false); state.addAnimation(0,'idle',true,0);
		}
		for (const item of meshes.values()) item.mesh.visible = false;
		const current = state.tracks[0];
		const name = current?.animation?.name ?? 'idle';
		const time = current ? current.loop ? current.trackTime % current.animation!.duration : Math.min(current.trackTime,current.animation!.duration) : 0;
		const animation = (rig.animations as unknown as Record<string, { slots?: Record<string,{ attachment?: { time?:number; name?:string|null }[] }> }>)[name];
		for (const [index,slot] of rig.slots.entries()) {
			if (hidden.has(slot.name)) continue;
			let drawing:string|null = slot.attachment;
			for (const key of animation?.slots?.[slot.name]?.attachment ?? []) if ((key.time??0) <= time+1e-6) drawing = key.name ?? null;
			if (!drawing || !parts[drawing]) continue;
			const part=parts[drawing]; let item=meshes.get(drawing);
			if (!item) {
				const positions = new Float32Array(8);
				const u0=part.x/atlas.width,v0=part.y/atlas.height,u1=(part.x+part.width)/atlas.width,v1=(part.y+part.height)/atlas.height;
				const geometry = new MeshGeometry({ positions, uvs:new Float32Array([u0,v0,u1,v0,u1,v1,u0,v1]), indices:new Uint32Array([0,1,2,0,2,3]) });
				const mesh = new Mesh({geometry,texture});root.addChild(mesh);item={mesh,geometry,positions};meshes.set(drawing,item);
			}
			const m=matrix(slot.name,drawing);
			const points=[[part.cropX,part.cropY],[part.cropX+part.width,part.cropY],[part.cropX+part.width,part.cropY+part.height],[part.cropX,part.cropY+part.height]];
			for (const [i,[x,y]] of points.entries()) {item.positions[i*2]=m.x+m.a*x-m.b*y;item.positions[i*2+1]=-(m.y+m.c*x-m.d*y);}
			item.geometry.getBuffer('aPosition').update();item.mesh.visible=true;item.mesh.zIndex=index;
		}
		root.sortChildren();
	}
	update(0);
	const api = { root, state, skeleton, update, setupEyes,
		inspect(name:string,seconds:number) {
			if(!import.meta.env.DEV||!data.findAnimation(name))return;
			state.clearTracks();skeleton.setupPose();holding=true;acting=true;
			state.setAnimation(0,name,false);state.update(seconds);skeleton.update(seconds);state.apply(skeleton);skeleton.updateWorldTransform(Physics.none);
			inspection=true;update(0);
		},
		resume() {inspection=false;holding=false;api.reset();},
		/** Slots left undrawn, e.g. the tail when portrait tucks the hips behind the frame. */
		setHidden(names:string[]) { hidden=new Set(names);update(0); },
		setReducedMotion(value:boolean) { reduced=value;if(value){holding=false;acting=false;state.clearTracks();skeleton.setupPose();state.setAnimation(0,'idle',true);update(0);} },
		play(request:string,hold=false,rate=1) {
			if(disposed||reduced)return false;
			const mapped:Record<string,string>={gaze_turbo:'gaze',fg_gaze:'gaze',fg_gaze_turbo:'gaze',fg_idle:'idle',fg_trigger:'win_big',win_max:'win_big',fg_end:'win_big'};
			const name=data.findAnimation(request)?request:mapped[request]??request;if(!data.findAnimation(name))return false;
			const current=state.tracks[0]?.animation?.name;
			// Repeated big-win cues must not lower and re-raise an already cheering arm.
			if(name==='win_big'&&holding&&(current==='win_big'||current==='win_big_loop'))return true;
			restTime=0;acting=true;holding=hold&&name==='win_big';
			const entry=state.setAnimation(0,name,false);
			entry.timeScale=Math.max(.25,Math.min(4,rate*castReleaseRate(request)));
			if(name==='win_big') {
				if(holding)state.addAnimation(0,'win_big_loop',true,0);
				else {state.addAnimation(0,'win_big_end',false,0);state.addAnimation(0,'idle',true,0);}
			} else state.addAnimation(0,'idle',true,0);
			return true;
		},
		reset() { restTime=0;const name=state.tracks[0]?.animation?.name;if(holding&&(name==='win_big'||name==='win_big_loop')){holding=false;acting=true;state.setAnimation(0,'win_big_end',false);state.addAnimation(0,'idle',true,0);}else{holding=false;acting=false;state.clearTracks();skeleton.setupPose();state.setAnimation(0,'idle',true);}update(0); },
		getGazeAnchors() { const release=variant?.releaseBone?skeleton.findBone(variant.releaseBone)?.getAppliedPose():undefined;const [a,b]=release?[{x:release.worldX-5,y:-release.worldY},{x:release.worldX+5,y:-release.worldY}]:eyePoints();const point=(p:{x:number;y:number})=>({x:root.x+p.x*root.scale.x,y:root.y+p.y*root.scale.y});const left=point(a),right=point(b);return{left,right,center:{x:(left.x+right.x)/2,y:(left.y+right.y)/2}}; },
		destroy() {if(disposed)return;disposed=true;state.clearTracks();state.clearListeners();root.destroy({children:true});for(const item of meshes.values())item.geometry.destroy();meshes.clear();},
	};
	if(import.meta.env.DEV)(globalThis as typeof globalThis & {__hypnoCastScene?:unknown}).__hypnoCastScene=api;
	return api;
}
