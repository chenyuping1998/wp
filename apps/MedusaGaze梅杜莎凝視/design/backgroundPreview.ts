import { Application, Assets, Container, Graphics, Text } from 'pixi.js';
import { createBackgroundScene } from '../src/game/backgroundScene';
import { BACKGROUND_KEYS } from '../src/game/backgroundMotion';

async function start() {
	const canvas = document.querySelector<HTMLCanvasElement>('#stage')!;
	const status = document.querySelector<HTMLElement>('#status')!;
	const app = new Application(); await app.init({ canvas, width: 1152, height: 648, antialias: true, background: 0x1e4950, resolution: 1 });
	const root = '../../../../../static/assets/';
	const urls: Record<string, string> = { mgBgBase: 'sprites/medusaBackground/bg_base.jpg', mgBgFree: 'sprites/medusaBackground/bg_free.jpg', mgBgCloud: 'sprites/medusaBackground/cloud.png', mgBgTourist: 'sprites/medusaBackground/statue_tourist.png', mgBgIcecream: 'sprites/medusaBackground/statue_icecream.png', mgBgFlame: 'sprites/medusaBackground/flame.png', fxCrack1: 'sprites/medusaFx/fx_crack_1.png', fxCrack2: 'sprites/medusaFx/fx_crack_2.png', fxCrack3: 'sprites/medusaFx/fx_crack_3.png', fxGlow: 'sprites/medusaFx/fx_glow.png' };
	const textures = Object.fromEntries(await Promise.all(BACKGROUND_KEYS.map(async key => [key, await Assets.load(root + urls[key])])));
	const scene = createBackgroundScene(textures); app.stage.addChild(scene.root); scene.setBounds(1152, 648);
	const caption = new Container(), captionPlate = new Graphics().roundRect(0,0,650,42,6).fill({ color: 0x0b222a, alpha: 0.88 });
	const captionText = new Text({ text: 'BACKGROUND v4 / REAL-TIME ANIMATION', style: { fontFamily: 'Arial', fontSize: 18, fill: 0xf3eadb } });
	captionText.position.set(14,10); caption.position.set(18,18); caption.addChild(captionPlate,captionText); app.stage.addChild(caption);
	type View = 'scene' | 'fire' | 'statue';
	let view: View = 'scene', paused = false, recording = false, demo = false, clipTime = 0, previousClip = 0, last = 0, accumulator = 0;
	let recorder: MediaRecorder | undefined, audio: HTMLAudioElement | undefined;
	const media = matchMedia('(prefers-reduced-motion: reduce)'); scene.setReducedMotion(media.matches);
	const reduced = document.querySelector<HTMLInputElement>('#reduced')!; reduced.checked = media.matches;
	const pace = document.querySelector<HTMLElement>('#clock')!;
	const viewSelect = document.querySelector<HTMLSelectElement>('#view')!;
	function frameView(next: View) {
		view = next; viewSelect.value = next;
		const w = app.screen.width, h = app.screen.height;
		if (next === 'scene') scene.setBounds(w,h);
		else {
			const scale = w / (next === 'fire' ? 580 : 820);
			scene.root.scale.set(scale);
			scene.root.position.set(w/2 - (next === 'fire' ? 300 : 430)*scale,h/2 - (next === 'fire' ? 657 : 470)*scale);
		}
		caption.scale.set(Math.min(1,w/900));
		captionText.text = next === 'fire' ? 'FIRE DETAIL / RISING HEAT + DISSIPATING TONGUES' : next === 'statue' ? 'STATUE DETAIL / 12 FRAGMENTS + STAGGERED SETTLE' : 'BACKGROUND v4 / REAL-TIME ANIMATION';
	}
	function breakStatues() { if (scene.burstStatues() && document.querySelector<HTMLInputElement>('#sound')!.checked) { audio?.pause(); audio = new Audio(root + 'audio/medusa/sfx_statues_crack.wav'); audio.volume = 0.45; void audio.play(); } }
	function stopDemo() { if (recording) return; demo = false; status.textContent = '手動檢視；可切換全景、火焰或石像細節。近看裁切只用於審片，遊戲鏡頭固定。'; }
	function startDemo() {
		paused = false; document.querySelector<HTMLButtonElement>('#pause')!.textContent = '暫停';
		scene.setNight(false); scene.update(1.2); frameView('scene'); clipTime = 0; previousClip = 0; demo = true;
		last = performance.now(); accumulator = 0; app.render();
		status.textContent = '演出中：白天 → 黃昏點火 → 石像碎裂 → 火焰近看 → 石像近看 → 回白天。近看裁切僅供審片。';
	}
	app.ticker.add(() => {
		const now = performance.now(); if (!last || document.hidden) { last = now; return; }
		accumulator += (now - last) / 1000; last = now;
		if (accumulator < 1 / 60) return;
		const dt = accumulator; accumulator = 0;
		if (!paused || recording) scene.update(dt);
		const snap = scene.snapshot(); pace.textContent = `雲層時間 ${snap.elapsed.toFixed(1)} 秒 · 夜景 ${Math.round(snap.nightness * 100)}%`;
		if (demo && (!paused || recording)) {
			previousClip = clipTime; clipTime += dt;
			if (previousClip < 2 && clipTime >= 2) scene.setNight(true);
			if (previousClip < 4 && clipTime >= 4) breakStatues();
			if (previousClip < 7 && clipTime >= 7) frameView('fire');
			if (previousClip < 11 && clipTime >= 11) frameView('statue');
			if (previousClip < 11.5 && clipTime >= 11.5) breakStatues();
			if (previousClip < 14 && clipTime >= 14) { frameView('scene'); scene.setNight(false); }
			if (clipTime >= 16) { demo = false; if (recorder?.state === 'recording') recorder.stop(); else status.textContent = '完整16秒演出已播放；可重新播放或手動檢查各動作。'; }
		}
	});
	document.addEventListener('visibilitychange', () => { last = 0; accumulator = 0; });
	document.querySelector<HTMLButtonElement>('#demo')!.onclick = startDemo;
	document.querySelector<HTMLButtonElement>('#day')!.onclick = () => { stopDemo(); scene.setNight(false); };
	document.querySelector<HTMLButtonElement>('#night')!.onclick = () => { stopDemo(); scene.setNight(true); };
	document.querySelector<HTMLButtonElement>('#burst')!.onclick = () => { stopDemo(); breakStatues(); };
	document.querySelector<HTMLButtonElement>('#pause')!.onclick = event => { paused = !paused; (event.currentTarget as HTMLButtonElement).textContent = paused ? '繼續播放' : '暫停'; };
	document.querySelector<HTMLButtonElement>('#minute')!.onclick = () => { scene.update(60); status.textContent = '將雲的位置推進60秒；每分鐘移動原場景寬度的1/5。'; };
	reduced.onchange = () => { stopDemo(); scene.setReducedMotion(reduced.checked); status.textContent = reduced.checked ? '減少動態：雲與火焰保持靜止，石像不碎裂。' : '已恢復一般背景動態。'; };
	viewSelect.onchange = () => { stopDemo(); frameView(viewSelect.value as View); };
	document.querySelector<HTMLSelectElement>('#shape')!.onchange = event => {
		const portrait = (event.currentTarget as HTMLSelectElement).value === 'portrait';
		stopDemo(); app.renderer.resize(portrait ? 432 : 1152, portrait ? 768 : 648); frameView(view);
	};
	document.querySelector<HTMLButtonElement>('#record')!.onclick = () => {
		if (recording) return;
		if (!window.MediaRecorder || !canvas.captureStream) { status.textContent = '此瀏覽器不支援錄影，可直接觀看背景預演。'; return; }
		if (reduced.checked) { status.textContent = '請先取消減少動態，再錄製一般版預演。'; return; }
		app.renderer.resize(1152,648); scene.setBounds(1152,648); document.querySelector<HTMLSelectElement>('#shape')!.value = 'landscape';
		startDemo(); recording = true;
		const stream = canvas.captureStream(60), chunks: Blob[] = [];
		const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
		recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 5000000 });
		recorder.onstart = () => { last = performance.now(); accumulator = 0; };
		recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
		recorder.onstop = () => { const url = URL.createObjectURL(new Blob(chunks,{type:'video/webm'})), link = document.createElement('a'); link.href = url; link.download = 'MedusaGaze_background_v2.webm'; link.click(); setTimeout(() => URL.revokeObjectURL(url),3000); stream.getTracks().forEach(track => track.stop()); recording = false; status.textContent = '16秒背景動畫已下載，含火焰和石像近看。共用遊戲Pixi程式錄製，並非Stake Engine上機錄影。'; };
		recorder.start(); status.textContent = '錄製16秒動畫中：全景演出與動作細節。';
	};
	frameView('scene');
	if (!media.matches) status.textContent='持續燃燒、雲層緩慢飄移；可切換日夜與火焰近看。'; else status.textContent = '已依系統偏好減少動態；取消勾選後可播放動畫。';
}
start().catch(error => { document.querySelector<HTMLElement>('#status')!.textContent = String(error); console.error(error); });
