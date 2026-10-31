/** Continuous power on a logarithmic scale: each multiplier step must matter. */
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const palette=[[2,0xb8ff5a],[8,0x64ffb1],[15,0xaa9dff],[50,0xe0b0ff],[100,0xffc64d],[250,0xffd67c],[500,0xfff1b0]] as const;
function blend(a:number,b:number,t:number){
 let color=0;for(const shift of [16,8,0])color|=Math.round(((a>>shift)&255)*(1-t)+((b>>shift)&255)*t)<<shift;return color;
}
export function orbPower(value:number){
 const v=Number.isFinite(value)?Math.max(2,Math.min(500,value)):2;
 const energy=clamp(Math.log(v/2)/Math.log(250)),divinity=clamp(Math.log(v/50)/Math.log(10));
 let color:number=palette.at(-1)![1];
 for(let i=1;i<palette.length;i++)if(v<=palette[i][0]){const [low,a]=palette[i-1],[high,b]=palette[i];color=blend(a,b,Math.log(v/low)/Math.log(high/low));break;}
 return{energy,divinity,color,bodyScale:.94+.30*energy,corona:1+.58*energy,impact:.88+.92*energy,
  motes:6+Math.floor(14*energy),petals:4+Math.floor(8*energy),wakeStrands:2+Math.floor(2.01*divinity)};
}
