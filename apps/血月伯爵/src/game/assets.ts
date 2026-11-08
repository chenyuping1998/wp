// Shared mono UI icons are the only retained GoBoomana artwork.
const chrome = {
 gbIconMonoMenu: {type:'sprite',src:'assets/sprites/goBananasUiIconsMono/menu.png',preload:true},
 gbIconMonoMenuExit: {type:'sprite',src:'assets/sprites/goBananasUiIconsMono/menuExit.png',preload:true},
 gbIconMonoSettings: {type:'sprite',src:'assets/sprites/goBananasUiIconsMono/settings.png',preload:true},
 gbIconMonoInfo: {type:'sprite',src:'assets/sprites/goBananasUiIconsMono/info.png',preload:true},
 gbIconMonoPayTable: {type:'sprite',src:'assets/sprites/goBananasUiIconsMono/payTable.png',preload:true},
 gbIconMonoSoundOn: {type:'sprite',src:'assets/sprites/goBananasUiIconsMono/soundOn.png',preload:true},
 gbIconMonoSoundOff: {type:'sprite',src:'assets/sprites/goBananasUiIconsMono/soundOff.png',preload:true},
 gbIconMonoAutoSpin: {type:'sprite',src:'assets/sprites/goBananasUiIconsMono/autoSpin.png',preload:true},
 gbIconMonoReplay: {type:'sprite',src:'assets/sprites/goBananasUiIconsMono/replay.png',preload:true},
} as const;
const chromeUrls=Object.fromEntries(Object.entries(chrome).map(([key,entry])=>[key,{...entry,src:import.meta.env.BASE_URL+entry.src}]));
import manifest from './bloodmoonAssets.json';
const relative=(path:string)=>`${import.meta.env.BASE_URL}${path.replace(/^\//,'')}`;
const blood:Record<string,{type:'sprite';src:string;preload:true}>={};
const add=(key:string,path:string)=>blood[key]={type:'sprite',src:relative(path),preload:true};
for(const [name,path] of Object.entries(manifest.scene))add(`bmScene_${name}`,path);
for(const [name,path] of Object.entries(manifest.environment))add(`bmEnvironment_${name}`,path);
for(const [name,path] of Object.entries(manifest.celebrations))add(`bmCelebration_${name}`,path);
for(const [name,path] of Object.entries(manifest.symbols))add(`bmSymbol_${name}`,path);
for(const [name,path] of Object.entries(manifest.characterFallback))add(`bmCharacter_${name}`,path);
for(const [name,path] of Object.entries(manifest.ui)){if(typeof path==='string')add(`bmUi_${name}`,path);}
for(const [name,path] of Object.entries(manifest.ui.multipliers))add(`bmMultiplier_${name}`,path);
for(const [name,paths] of Object.entries(manifest.sequences)){paths.forEach((path,i)=>add(`bmFx_${name}_${i}`,path));}
for(const name of ['bar','spin','button','button-active','buy','buy-lit'])add(`bmChrome_${name}`,`/bloodmoon/chrome/${name}.png`);
for(const name of ['base','free','red','glow-gold','glow-red'])add(`bmFrame_${name}`,`/bloodmoon/frame/${name}.png`);
for(const name of ['plaque','rays'])add(`bmWin_${name}`,`/bloodmoon/win-chrome/${name}.png`);
export default {...chromeUrls,...blood};
