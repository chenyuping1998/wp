/** Explicit opt-in local art QA (?castqa), unreachable in a production build. */
export function installDragonCastControls(scene: { inspect(name: string, time: number): void; resume(): void }, kind: 'mg' | 'fg') {
	const panel = document.createElement('div'); panel.dataset.castQa = 'true';
	panel.style.cssText = 'position:fixed;top:24px;left:8px;z-index:99999;display:flex;flex-wrap:wrap;gap:4px;max-width:360px;padding:6px;background:#202020e8;color:white;font:12px sans-serif';
	const title = document.createElement('div'); title.style.cssText = 'width:100%;opacity:.8'; title.textContent = kind === 'mg' ? '龍王動作' : '龍女動作'; panel.append(title);
	// [animation, label, seconds]: the frames that bend joints most in each act
	const poses: [string, string, number][] = [
		['idle', '待機', 1.0], ['cast', '施法 起手', 0.15], ['cast', '施法 最高', 0.3], ['cast', '施法 收', 0.6],
		['ready', '蓄力', 0.4], ['ready_loop', '蓄力循環', 0.5], ['transform', '變身 舉起', 0.5], ['transform', '變身 最高', 1.0],
		['win_big', '大獎(不用)', 0.7], ['win_big_loop', '大獎循環(不用)', 0.6],
	];
	for (const [name, label, time] of poses) {
		const button = document.createElement('button'); button.textContent = label; button.dataset.castAction = `${name}@${time}`;
		button.onclick = () => scene.inspect(name, time); panel.append(button);
	}
	const resume = document.createElement('button'); resume.textContent = '繼續遊戲'; resume.onclick = () => scene.resume(); panel.append(resume);
	const hide = document.createElement('button'); hide.textContent = '收起動作列'; hide.onclick = () => panel.remove(); panel.append(hide);
	if (new URLSearchParams(location.search).has('motionqa')) { panel.style.top = 'auto'; panel.style.bottom = '8px'; }
	document.body.append(panel); return () => panel.remove();
}
