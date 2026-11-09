import { Container, Graphics, Sprite, TilingSprite, type Texture } from 'pixi.js';

/** The board geometry is authored in code; the material comes from painted parts. */
export function createBoardFrameScene(textures: {capital:Texture;lintel:Texture;column:Texture;logo:Texture},width:number,height:number,portrait=false) {
	const root=new Container();root.eventMode='none';root.label='Board frame (interim grey)';
	const fill=new Graphics().roundRect(-3,-3,width+6,height+6,5).fill(0xb8b1a4).stroke({width:2,color:0xb9b9b9});root.addChild(fill);
	const beam=(y:number)=>{const s=new TilingSprite({texture:textures.lintel,width:width+64,height:32});s.position.set(-32,y);s.tileScale.set(32/textures.lintel.height);root.addChild(s);};
	beam(-32);beam(height);
	for(const x of [-32,width]){const s=new TilingSprite({texture:textures.column,width:32,height});s.position.set(x,0);s.tileScale.set(32/textures.column.width);root.addChild(s);}
	// The painted L joint is at 16% of its canvas, not at the canvas centre.
	// Align that joint with the beam centre (-16), rather than floating the L outside it.
	for(const [x,y,sx,sy] of [[14,14,1,1],[width-14,14,-1,1],[14,height-14,1,-1],[width-14,height-14,-1,-1]]){
		const s=new Sprite(textures.capital);s.anchor.set(.5);s.position.set(x,y);s.width=88;s.height=88;s.scale.x*=sx;s.scale.y*=sy;root.addChild(s);
	}
	const logo=new Sprite(textures.logo);logo.anchor.set(.5);root.addChild(logo);
	const setPortrait=(isPortrait:boolean)=>{
		logo.width=width*(isPortrait ? .38 : .46);
		logo.height=logo.width*.375;
		logo.position.set(isPortrait ? width*.27 : width/2,-47);
	};
	setPortrait(portrait);
	return {root,setPortrait,destroy(){root.destroy({children:true});}};
}
