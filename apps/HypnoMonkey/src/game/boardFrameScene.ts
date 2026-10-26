import { Container, Graphics, Sprite, TilingSprite, type Texture } from 'pixi.js';

/** The board geometry is authored in code; the material comes from painted parts. */
export function createBoardFrameScene(textures: {capital:Texture;lintel:Texture;column:Texture;logo:Texture},width:number,height:number) {
	const root=new Container();root.eventMode='none';root.label='Fixed Medusa marble frame';
	const fill=new Graphics().roundRect(-3,-3,width+6,height+6,5).fill(0x123b42).stroke({width:2,color:0xf2b632});root.addChild(fill);
	const beam=(y:number)=>{const s=new TilingSprite({texture:textures.lintel,width:width+64,height:32});s.position.set(-32,y);s.tileScale.set(32/textures.lintel.height);root.addChild(s);};
	beam(-32);beam(height);
	for(const x of [-32,width]){const s=new TilingSprite({texture:textures.column,width:32,height});s.position.set(x,0);s.tileScale.set(32/textures.column.width);root.addChild(s);}
	for(const [x,y,sx,sy] of [[-33,-34,1,1],[width+33,-34,-1,1],[-33,height+34,1,-1],[width+33,height+34,-1,-1]]){
		const s=new Sprite(textures.capital);s.anchor.set(.5);s.position.set(x,y);s.width=88;s.height=88;s.scale.x*=sx;s.scale.y*=sy;root.addChild(s);
	}
	const logo=new Sprite(textures.logo);logo.anchor.set(.5);logo.position.set(width/2,-47);logo.width=width*.46;logo.height=logo.width*.375;root.addChild(logo);
	return {root,destroy(){root.destroy({children:true});}};
}
