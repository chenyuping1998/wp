import {createFlameField} from './flameField';
import { Container, Graphics, Mesh, MeshGeometry, Sprite, BufferImageSource, Texture, BlurFilter } from 'pixi.js';
import { BACKGROUND_SIZE, CLOUDS, BIRD_COUNT,birdPose, gardenBreeze, BRAZIERS, STATUES, STATUE_SECONDS, STATUE_TO_MEDUSA_HEIGHT,STATUE_FRACTURE_PIECES, cloudPosition, cloudVisibility, statueEnvelope, statuePiecePose, mixTint, clamp } from './backgroundMotion';

type Textures = Record<string, Texture>;
const easeGarden = (y:number) => {const t=Math.min(1,y/60,(670-y)/60);return t*t*(3-2*t);};
/** The exact same Pixi renderer is used in the game and the offline review. */
export function createBackgroundScene(textures: Textures,options:{softClouds?:boolean}={}) {
	const root = new Container(); root.label = 'Medusa plaza / fixed architecture'; root.eventMode = 'none';
	const day = new Sprite(textures.mgBgBase), night = new Sprite(textures.mgBgFree);
	for (const sprite of [day, night]) { sprite.width = BACKGROUND_SIZE.width; sprite.height = BACKGROUND_SIZE.height; root.addChild(sprite); }
	night.alpha = 0;
	const skyLayer=new Container(),cloudLayer = new Container(), skyMask = new Graphics().poly([155,0,1770,0,1770,145,610,145,610,245,155,245]).fill(0xffffff);
	root.addChild(skyLayer, skyMask);skyLayer.addChild(cloudLayer);skyLayer.mask=skyMask;
	const cloudSoftness=options.softClouds===false?undefined:new BlurFilter({strength:1.4,quality:2});if(cloudSoftness)cloudLayer.filters=[cloudSoftness];
	const clouds = CLOUDS.map(data => { const sprite = new Sprite(textures.mgBgCloud); sprite.anchor.set(0.5); sprite.position.set(data.x, data.y); sprite.width = data.width; sprite.height = data.height; if(data.flip)sprite.scale.x*=-1;cloudLayer.addChild(sprite); return sprite; });
	// Wind lives in the open side gardens, so it never moves the architecture or
	// fills the board with decorative noise. A few passing birds animate the sky.
	const gardenAir=new Graphics(),birds=new Graphics();root.addChild(gardenAir);skyLayer.addChild(birds);
	const ownedGeometry: MeshGeometry[] = [];
	const flames = BRAZIERS.map((bowl,index)=>{
		const group=new Container();group.position.set(bowl.x,bowl.y);root.addChild(group);
		const glow=new Sprite(textures.fxGlow);glow.anchor.set(.5);glow.position.set(0,-9);glow.width=122;glow.height=68;glow.tint=0xffad54;glow.blendMode='add';group.addChild(glow);
		const field=createFlameField(20261026+index*457);
		const source=new BufferImageSource({resource:field.pixels,width:field.width,height:field.height,format:'rgba8unorm',alphaMode:'premultiplied-alpha',scaleMode:'linear'});
		const texture=new Texture({source});
		const fireGeometry=new MeshGeometry({positions:new Float32Array([-38,-112,38,-112,38,0,-38,0]),uvs:new Float32Array([0,0,1,0,1,1,0,1]),indices:new Uint32Array([0,1,2,0,2,3])});fireGeometry.batchMode='no-batch';ownedGeometry.push(fireGeometry);
		const fire=new Mesh({geometry:fireGeometry,texture});group.addChild(fire);
		const embers=new Graphics();group.addChild(embers);
		return {group,glow,field,source,texture,embers,index};
	});
	let flameAccumulator=0,leftSkyTop=0,leftSkyScale=1;
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
		gardenAir.clear();birds.clear();
		for(let i=0;i<26;i++){
			const side=i%2,wind=gardenBreeze(elapsed,side),phase=(elapsed*(.034+(i%5)*.004)+i*.137+wind.distance/280)%1;
			const x=(side?1505:80)+phase*280+Math.sin(elapsed*.7+i*1.9)*14;
			const vertical=(i*83+elapsed*(13+i%4*3))%670,y=230+vertical-wind.lift;
			const alpha=Math.sin(Math.PI*phase)**2*(.15+(i%3)*.075)*easeGarden(vertical);
			if(i%4===0){
				const turn=elapsed*(1.1+i*.035)+i+wind.distance*.035,dx=Math.cos(turn)*5,dy=Math.sin(turn)*3;
				gardenAir.moveTo(x-dx,y-dy).quadraticCurveTo(x+dy*.8,y-dx*.8,x+dx,y+dy)
					.quadraticCurveTo(x-dy*.55,y+dx*.55,x-dx,y-dy).fill({color:i%3===0?0xe3b66a:0x96ad55,alpha});
			}else gardenAir.circle(x,y,1.2+(i%3)*.7).fill({color:nightness>.5?0xb2ffd3:0xffe6a0,alpha});
		}
		for(let i=0;i<BIRD_COUNT;i++){
			const pose=birdPose(i,elapsed),{x,span,alpha}=pose,y=i<6?leftSkyTop+pose.y*leftSkyScale:pose.y,wing=pose.wing*(i<6?leftSkyScale:1),opacity=alpha*(1-nightness*.42);
			birds.moveTo(x-span,y-wing).quadraticCurveTo(x-span*.42,y-2,x,y+1).quadraticCurveTo(x+span*.42,y-2,x+span,y-wing).stroke({width:i<6?1.8:1.5,color:0x35545d,alpha:opacity});
			birds.ellipse(x,y+1,.9,1.5).fill({color:0x35545d,alpha:opacity});
		}
		clouds.forEach((cloud, index) => { cloud.x = cloudPosition(elapsed, CLOUDS[index].x, CLOUDS[index].width,CLOUDS[index].speed,CLOUDS[index].lane); cloud.tint = mixTint(0xffffff, 0x8997c2, nightness); cloud.alpha = CLOUDS[index].alpha*(1-nightness*.5) * cloudVisibility(cloud.x, CLOUDS[index].width,CLOUDS[index].lane); });
		flameAccumulator+=reduced?0:Math.min(dt,.1);
		const fireSteps=Math.min(3,Math.floor(flameAccumulator*30));flameAccumulator-=fireSteps/30;
		for(const flame of flames){
			flame.group.alpha=.88+.12*nightness;
			flame.glow.alpha=(.09+.08*nightness)*(1+.07*Math.sin(elapsed*4.2+flame.index*2));
			if(fireSteps){for(let step=0;step<fireSteps;step++)flame.field.step();flame.field.paint();flame.source.update();}
			flame.embers.clear();
			for(let i=0;i<3;i++){
				const p=(elapsed*(.65+i*.09)+i*.317+flame.index*.41)%1;
				const x=Math.sin(p*5+i*2+flame.index)*11+(i-1)*7,y=-15-p*102;
				flame.embers.circle(x,y,.65).fill({color:0xffd69a,alpha:Math.sin(Math.PI*p)*.46});
			}
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
		leftSkyTop=Math.max(0,-root.y/scale);leftSkyScale=Math.max(0,(245-leftSkyTop)/245);
		clouds.forEach((cloud,i)=>{if(CLOUDS[i].lane==='left'){cloud.y=leftSkyTop+CLOUDS[i].y*leftSkyScale;cloud.height=CLOUDS[i].height*leftSkyScale;}});
		for(const statue of statues){statue.group.scale.set(medusaHeight*STATUE_TO_MEDUSA_HEIGHT/(statue.data.height*scale));statue.group.y=(groundY-root.y)/scale;}
	}
	update(0);
	return { root, update, setBounds,
		setNight(value: boolean) { target = value ? 1 : 0; },
		setReducedMotion(value: boolean) { reduced = value; if (value) burstAge = STATUE_SECONDS; update(0); },
		burstStatues() { if (disposed || reduced || burstAge < STATUE_SECONDS) return false; burstAge = 0; update(0); return true; },
		snapshot() { return { elapsed, nightness: clamp(nightness), burstAge, reduced, cloudX: clouds.map(c => c.x),leftClouds:clouds.filter((_,i)=>CLOUDS[i].lane==='left').map(c=>({x:root.x+c.x*root.scale.x,y:root.y+c.y*root.scale.y,width:c.width*root.scale.x,height:c.height*root.scale.y,alpha:c.alpha})), architecture: { x: day.x, y: day.y, rotation: day.rotation },statues:statues.map(s=>({height:s.data.height*s.group.scale.y*root.scale.y,groundY:root.y+s.group.y*root.scale.y})) }; },
		destroy() { if (disposed) return; disposed = true; root.destroy({ children: true }); ownedGeometry.forEach(geometry => geometry.destroy());cloudSoftness?.destroy();for(const flame of flames)flame.texture.destroy(true); },
	};
}
