/** Tune the kit's idle recipe on the delivered pose; never hand-author bones. */
import {readFileSync,readdirSync} from 'node:fs';
import {buildCharacter,characterRows} from '/Users/stone/tools/spine-generator/src/character.ts';
import {decodePngAlpha} from '/Users/stone/tools/spine-generator/src/png.ts';
const base='/Users/stone/stake-engine/角色生圖_相撲猴/交件';
for(const cast of ['MG','FG']){
 const dir=`${base}/${cast}/staged/layers`;
 const order=JSON.parse(readFileSync(`${dir}/layers.json`,'utf8')).order;
 const joints=JSON.parse(readFileSync(`${dir}/joints.json`,'utf8'));
 const alphas=new Map(order.map((n:string)=>[n,decodePngAlpha(new Uint8Array(readFileSync(`${dir}/${n}.png`)))]));
 for(const intensity of [.35,.5,.65,.8,1]){
  const result=buildCharacter(alphas,{name:cast.toLowerCase(),order,joints,params:{idle:{intensity},celebrate:{swing:30,elbow:-25,angle:65,elbowBack:-40,angleBack:50}}});
  const idle=characterRows(result).find(x=>x.name==='idle');
  console.log(JSON.stringify({cast,intensity,...idle}));
 }
}
