/** Explicit opt-in local art QA, unreachable in a production build. */
export function installCastControls(scene: {inspect(name:string,time:number):void;resume():void},mode?:'mg'|'fg') {
	const panel=document.createElement('div');panel.dataset.castQa='true';
	panel.style.cssText='position:fixed;top:24px;left:8px;z-index:99999;display:flex;flex-wrap:wrap;gap:4px;max-width:330px;padding:6px;background:#202020e8;color:white;font:12px sans-serif';
	const poses:[string,string,number][]=[['idle','待機',1],['idle_fidget','調眼鏡',.8],['gaze','催眠出手',.7],['react_small','小獎點帽',.5],['gaze_dud','丟空攤手',.5],['win_big','摘帽',.85],['win_big_loop','大獎循環',.4],['win_big_end','戴回帽子',.4]];
	if(mode==='fg'){poses.push(['fg_trigger','助手登場',.6],['fg_end','鞠躬退場',.65]);}
	const fgLabels:Record<string,string>={idle_fidget:'甩錶待機',gaze:'甩錶出手',react_small:'小獎指向',gaze_dud:'作廢噘嘴',win_big:'大笑甩錶',win_big_loop:'大獎循環',win_big_end:'收錶'};
	for(const [name,originalLabel,time] of poses){const button=document.createElement('button');button.textContent=mode==='fg'?(fgLabels[name]??originalLabel):originalLabel;button.dataset.castAction=name;button.onclick=()=>scene.inspect(name,time);panel.append(button);}
	const resume=document.createElement('button');resume.textContent='繼續遊戲';resume.onclick=()=>scene.resume();panel.append(resume);
	const hide=document.createElement('button');hide.textContent='收起動作列';hide.onclick=()=>panel.remove();panel.append(hide);
	if(new URLSearchParams(location.search).has('motionqa')){panel.style.top='auto';panel.style.bottom='8px';};
	document.body.append(panel);return()=>panel.remove();
}
