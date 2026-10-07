// Measure whether the PSD rig can bring each fist to its own pectoral safely.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const store = path.resolve(root, '../../node_modules/.pnpm');
const coreDir = fs.readdirSync(store).find((name) => name.startsWith('@esotericsoftware+spine-core@'));
const { TextureAtlas, AtlasAttachmentLoader, SkeletonJson, Skeleton, AnimationStateData, AnimationState, Physics } = await import(pathToFileURL(path.join(store, coreDir, 'node_modules/@esotericsoftware/spine-core/dist/index.js')).href);
const dir = path.join(root, 'static/assets/spines/goBananasMonkey');
const data = new SkeletonJson(new AtlasAttachmentLoader(new TextureAtlas(fs.readFileSync(path.join(dir,'monkey.atlas'),'utf8')))).readSkeletonData(fs.readFileSync(path.join(dir,'monkey.json'),'utf8'));
for (const [side,time,target] of [['R',0.48,[60,540]],['L',0.78,[-60,540]]]) {
	const sk = new Skeleton(data), st = new AnimationState(new AnimationStateData(data));
	st.setAnimation(0,'chestbeat',false); st.update(time); st.apply(sk);
	const arm=sk.findBone(`arm${side}`), fore=sk.findBone(`arm${side}_fore`), hand=sk.findBone(`arm${side}_hand`);
	const initial=[arm.rotation,fore.rotation];
	const list=[];
	for(let shoulder=0;shoulder<=65;shoulder+=2)
		for(let elbow=0;elbow<=100;elbow+=2){
			arm.rotation=(side==='L'?1:-1)*shoulder;
			fore.rotation=(side==='L'?1:-1)*elbow;
			sk.updateWorldTransform(Physics.update);
			const d=Math.hypot(hand.worldX-target[0],hand.worldY-target[1]);
			const cost=d + Math.max(0,elbow-75)*.4 + Math.max(0,shoulder-50)*.3;
			list.push({shoulder,elbow,x:Math.round(hand.worldX),y:Math.round(hand.worldY),d:Math.round(d),cost});
		}
	list.sort((a,b)=>a.cost-b.cost);
	console.log(side,'original',initial,'best',list.slice(0,8));
}
