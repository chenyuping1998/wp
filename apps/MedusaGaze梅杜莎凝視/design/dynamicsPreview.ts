import { Application, Assets, Container, Graphics, Sprite, Mesh, MeshGeometry, ColorMatrixFilter, Text } from 'pixi.js';
import { drawWinningAccent, drawStoneDebris,drawLandingAccent } from '../src/game/presentationFx';
import { FRACTURE_PIECES, fragmentPose, stoneFront, winHopPose,landingPose } from '../src/game/symbolMotion';

async function start() {
	const canvas = document.querySelector<HTMLCanvasElement>('#stage')!, status = document.querySelector<HTMLElement>('#status')!;
	const app = new Application(); await app.init({canvas,width:1152,height:480,antialias:true,background:0x102f38,resolution:1});
	const textures = await Promise.all(['h4','h2','h1','h3'].map(name=>Assets.load('../../../../../static/assets/sprites/medusaSymbols/'+name+'.png')));
	const groups = [0,1,2,3].map((i)=>{const g=new Container();g.position.set(144+i*288,235);g.scale.set(1.7);app.stage.addChild(g);return g;});
	const addLabel=(text:string,x:number,y:number,size=16)=>{const l=new Text({text,style:{fontFamily:'Arial',fontSize:size,fill:0xf4dd9d}});l.anchor.set(.5);l.position.set(x,y);app.stage.addChild(l);};
	['ROOT BEAT','STONE ADVANCE','SHARDS + STONE DUST','REEL STOP SQUASH'].forEach((label,i)=>addLabel(label,144+i*288,50));
	for(const x of [288,576,864])app.stage.addChild(new Graphics().moveTo(x,80).lineTo(x,420).stroke({width:1,color:0x31545a}));
	const actor=new Sprite(textures[0]);actor.anchor.set(.5);actor.width=actor.height=98;groups[0].addChild(actor);
	const halo=new Graphics();groups[0].addChild(halo);
	const painted=new Sprite(textures[1]),stone=new Sprite(textures[1]),mask=new Graphics(),edge=new Graphics(),stoneGroup=new Container();
	for(const sprite of [painted,stone]){sprite.anchor.set(.5);sprite.width=sprite.height=98;}
	const filter=new ColorMatrixFilter();filter.saturate(-1,false);stone.tint=0xa9a39a;stoneGroup.filters=[filter];stoneGroup.addChild(stone);stoneGroup.mask=mask;
	groups[1].addChild(painted,stoneGroup,mask,edge);
	const pieces=new Container(),dust=new Graphics();pieces.scale.set(98);pieces.addChild(dust);groups[2].addChild(pieces);
	const shardFilter=new ColorMatrixFilter();shardFilter.saturate(-1,false);pieces.filters=[shardFilter];
	const shards=FRACTURE_PIECES.map(points=>{
		const cx=points.reduce((s,p)=>s+p[0],0)/points.length,cy=points.reduce((s,p)=>s+p[1],0)/points.length;
		const indices:number[]=[];for(let i=1;i<points.length-1;i++)indices.push(0,i,i+1);
		const geometry=new MeshGeometry({positions:new Float32Array(points.flatMap(([x,y])=>[x-cx,y-cy])),uvs:new Float32Array(points.flatMap(([x,y])=>[x+.5,y+.5])),indices:new Uint32Array(indices)});
		const front=new Mesh({geometry,texture:textures[2]}),side=new Mesh({geometry,texture:textures[2]}),node=new Container();
		front.tint=0xa9a39a;side.tint=0x56534e;node.addChild(side,front);pieces.addChild(node);return {node,front,side,cx,cy};
	});
	const landed=new Sprite(textures[3]),contact=new Graphics();landed.anchor.set(.5);landed.width=landed.height=98;
	contact.y=98*.4;groups[3].addChild(landed,contact);
	const seek=document.querySelector<HTMLInputElement>('#seek')!;let progress=.35,playing=false,last=0;
	function draw(){
		const hop=winHopPose(progress,'H4');actor.position.y=hop.y*98;actor.scale.set(98/textures[0].width*hop.sx,98/textures[0].height*hop.sy);
		halo.clear();drawWinningAccent(halo,0,0,98,progress*567,4);
		const boundary:number[]=[];for(let i=24;i>=0;i--)boundary.push((i/24-.5)*98,stoneFront(i/24,progress)*98);
		mask.clear().poly([-59,-69,59,-69,...boundary]).fill(0xffffff);stoneGroup.visible=progress>0;
		edge.clear(); // The production front is clipped to the painted silhouette.
		drawStoneDebris(dust,progress,17);
		shards.forEach(({node,front,side,cx,cy},i)=>{const p=fragmentPose(i,progress,17);node.position.set(cx+p.x,cy+p.y);node.rotation=p.rotation;node.scale.set(p.scale*p.sx,p.scale);node.alpha=p.alpha;front.position.set(0,0);side.position.set(.025*p.depth,.018*p.depth);side.visible=p.depth>.001;});
		const land=landingPose(progress,1.2);landed.position.y=land.y*98;landed.scale.set(98/textures[3].width*land.sx,98/textures[3].height*land.sy);
		drawLandingAccent(contact,98,progress,1.2);
		status.textContent=`${Math.round(progress*100)}% · 與正式遊戲共用聚光、石屑、接地特效及動作曲線。各欄分別檢查一個階段。`;
	}
	seek.oninput=()=>{playing=false;progress=Number(seek.value)/100;draw();};
	document.querySelector<HTMLButtonElement>('#play')!.onclick=()=>{playing=true;last=0;};
	document.querySelector<HTMLButtonElement>('#pause')!.onclick=()=>{playing=false;};
	app.ticker.add(()=>{const now=performance.now(),dt=last?(now-last)/1000:0;last=now;if(!playing||document.hidden)return;progress=(progress+dt*.65)%1;seek.value=String(progress*100);draw();});
	draw();
}
start().catch(error=>{document.querySelector<HTMLElement>('#status')!.textContent=String(error);console.error(error);});
