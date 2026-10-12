import './style.css';
import { createRgsClient, fromRgsAmount } from './rgs.js';

const ASSET = `${import.meta.env.BASE_URL}assets/`;
const SCENE_ASSETS = {
  '--scene-base': 'base-clean.webp',
  '--scene-bonus': 'bonus-clean.webp',
  '--scene-blood': 'blood-clean.webp',
  '--scene-intro': 'loading-reference.webp',
  '--scene-modes': 'modes-reference.webp',
  '--scene-transition': 'bat-transition.webp',
};
let rgs;
let rgsError = null;
const TIMING = Object.freeze({
  transition: 2000, triggerGlow: 440, lineShow: 410,
  turboLineShow: 150, bonusStart: 450,
});
const CELL_W = 130.6;
const CELL_H = 131.8;
const SOURCE_X = 635;
const SOURCE_Y = 166;
const SYMBOLS = {
  A: { sheet: 'base.webp', col: 3, row: 0 },
  K: { sheet: 'base.webp', col: 4, row: 1 },
  Q: { sheet: 'base.webp', col: 1, row: 0 },
  J: { sheet: 'base.webp', col: 0, row: 2 },
  T: { sheet: 'base.webp', col: 0, row: 3 },
  potion: { sheet: 'base.webp', col: 2, row: 1 },
  pumpkin: { sheet: 'base.webp', col: 4, row: 2 },
  cat: { sheet: 'base.webp', col: 1, row: 2 },
  garlic: { sheet: 'base.webp', col: 1, row: 3 },
  bonus: { sheet: 'base.webp', col: 2, row: 2 },
  bat: { sheet: 'bonus.webp', col: 2, row: 2 },
  wild: { sheet: 'bonus.webp', col: 1, row: 3 },
  ghost: { sheet: 'bonus.webp', col: 3, row: 4 },
};
const POOL = ['A', 'K', 'Q', 'J', 'T', 'potion', 'pumpkin', 'cat', 'garlic', 'ghost'];
const BAT = `<svg viewBox="0 0 100 56" aria-hidden="true"><path class="bat-left" d="M49 27Q34 8 3 9L13 21Q7 22 0 34Q13 27 19 38Q23 29 30 32Q35 23 49 35Z"/><path class="bat-right" d="M51 27Q66 8 97 9L87 21Q93 22 100 34Q87 27 81 38Q77 29 70 32Q65 23 51 35Z"/><path d="M43 27L45 17L49 23L53 17L57 27Q55 39 50 43Q45 39 43 27Z"/></svg>`;
const BONUS_COFFIN = `<svg class="bonus-coffin-art" viewBox="0 0 220 270" aria-hidden="true"><defs><linearGradient id="coffin-purple" x2="1" y2="1"><stop stop-color="#c575ff"/><stop offset=".45" stop-color="#7914d8"/><stop offset="1" stop-color="#35036e"/></linearGradient><linearGradient id="coffin-gold" x2="0" y2="1"><stop stop-color="#fff5a1"/><stop offset=".5" stop-color="#f9bd1e"/><stop offset="1" stop-color="#9c4a0a"/></linearGradient></defs><path d="M71 20H149L193 67V201L156 244H64L27 201V67Z" fill="#310a59" stroke="#5c1978" stroke-width="15"/><path d="M76 28H144L183 70V196L151 232H69L37 196V70Z" fill="url(#coffin-gold)" stroke="#ffe383" stroke-width="6"/><path d="M80 43H140L168 76V188L142 215H78L52 188V76Z" fill="url(#coffin-purple)" stroke="#4c167b" stroke-width="7"/><path d="M65 7L80 23L69 31L52 21L42 31L40 12L57 18ZM155 7L140 23L151 31L168 21L178 31L180 12L163 18Z" fill="url(#coffin-gold)" stroke="#64300c" stroke-width="4"/><path d="M110 5L123 18L110 35L97 18Z" fill="#e84bbc" stroke="#ffe879" stroke-width="5"/><path d="M69 122Q86 105 101 124Q87 141 69 122ZM119 124Q134 105 151 122Q133 141 119 124Z" fill="#ffd6e3"/><path d="M70 122Q85 116 100 124M120 124Q135 116 150 122" fill="none" stroke="#4b105e" stroke-width="6"/><circle cx="88" cy="123" r="5" fill="#67207d"/><circle cx="132" cy="123" r="5" fill="#67207d"/><path d="M85 151Q110 176 135 151Q126 187 110 184Q93 187 85 151Z" fill="#32104e" stroke="#d37bea" stroke-width="4"/><path d="M94 162L99 175L105 166M115 166L121 175L126 162" fill="#fff9ea"/><path d="M19 180H201L194 226H26Z" fill="url(#coffin-gold)" stroke="#6e2e0e" stroke-width="7"/><path d="M28 188H192L187 217H33Z" fill="#4d1466"/><text x="110" y="211" text-anchor="middle" fill="#fff0a1" stroke="#9c4a0a" stroke-width="1.5" paint-order="stroke" font-size="34" font-weight="1000" font-family="Arial,sans-serif">BONUS</text><path d="M110 224L119 235L110 247L101 235Z" fill="#b525b9" stroke="#ffe069" stroke-width="4"/></svg>`;
const WIN_CHALICE = `<svg class="win-chalice" viewBox="0 0 210 210" aria-hidden="true"><defs><linearGradient id="cup-gold" x2="0" y2="1"><stop stop-color="#fff4aa"/><stop offset=".42" stop-color="#f9c63d"/><stop offset="1" stop-color="#aa4a12"/></linearGradient><radialGradient id="cup-ruby"><stop stop-color="#ffb1be"/><stop offset=".36" stop-color="#f8255a"/><stop offset="1" stop-color="#850e48"/></radialGradient></defs><path d="M38 30H172L157 93Q147 130 105 139Q63 130 53 93Z" fill="url(#cup-gold)" stroke="#fff3b1" stroke-width="7"/><path d="M46 47H164L151 91Q137 120 105 126Q73 120 59 91Z" fill="url(#cup-ruby)" stroke="#702037" stroke-width="6"/><path d="M31 53Q7 51 18 91Q28 114 65 111M179 53Q203 51 192 91Q182 114 145 111" fill="none" stroke="url(#cup-gold)" stroke-width="11"/><path d="M94 136H116V176H94ZM66 178H144L154 196H56Z" fill="url(#cup-gold)" stroke="#fff1a0" stroke-width="5"/><path d="M104 54L123 80L105 110L87 80Z" fill="#ffadcc" opacity=".75"/></svg>`;
const PAY = { ghost: [1.8, 9, 45], pumpkin: [1.2, 4.8, 18], cat: [0.9, 3.6, 12], potion: [0.7, 3, 9], garlic: [0.6, 2.4, 7.2], A: [0.4, 1.5, 3.6], K: [0.3, 1.2, 3], Q: [0.25, 0.9, 2.4], J: [0.2, 0.7, 1.8], T: [0.15, 0.6, 1.5] };
const LINES = [
  [0,0,0,0,0],[1,1,1,1,1],[2,2,2,2,2],[3,3,3,3,3],[4,4,4,4,4],
  [0,1,2,1,0],[4,3,2,3,4],[1,2,3,2,1],[3,2,1,2,3],
  [0,0,1,0,0],[4,4,3,4,4],[1,1,2,1,1],[3,3,2,3,3],
  [2,1,0,1,2],[2,3,4,3,2],[0,1,1,1,0],[4,3,3,3,4],
  [1,0,1,0,1],[3,4,3,4,3],
];
const MODES = [
  { key: 'ante', name: 'ANTE', cost: 3.2, action: 'ACTIVATE', desc: '3.2× the base bet', art: 0 },
  { key: 'curtain', name: 'CRIMSON CURTAIN', cost: 1000, action: 'ACTIVATE', desc: '1,000× the base bet', art: 1 },
  { key: 'mystery', name: 'MYSTERY BONUS', cost: 500, action: 'ACTIVATE', desc: '500× the base bet', art: 2 },
  { key: 'night', name: 'NIGHT BONUS', cost: 100, action: 'BUY', desc: '100× the base bet', art: 3 },
  { key: 'blood', name: 'BLOOD MOON', cost: 500, action: 'BUY', desc: '500× the base bet', art: 4 },
];
const state = {
  screen: 'intro', modal: null, rulesTab: 'paytable', balance: 1283.8, bet: 1,
  win: 0, totalWin: 0, freeSpins: 0, spinCount: 0, multiplier: 1,
  spinning: false, auto: false, turbo: false, sound: true, activation: null,
  presentation: null,
  featureType: 'night', pendingBuy: null,
  matrix: Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => pick(POOL))),
  sticky: new Map(),
  rgsReady: false, rgsError: null, rgsCurrency: 'USD',
  betLevels: [0.1,0.2,0.5,1,2,5,10,20,50], pendingRound: null,
  buyDisabled: false, turboDisabled: false,
  assetsReady: false, assetsProgress: 0,
};
let rgsBonusContinue;
let rgsRoundActive = false;
let audioCtx;
let ambience;
const imageCache = new Map();
const activeCues = new Set();
let app;
let mounted = false;

function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
function money(n) { return `${state.rgsCurrency === 'USD' ? '$' : `${state.rgsCurrency} `}${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function play(type = 'click') {
  if (!state.sound) return;
  const recorded = { spin: 'spin-recorded.mp3', transition: 'transition-recorded.mp3', celebration: 'win-recorded.mp3' }[type];
  if (recorded) {
    const cue = new Audio(`${ASSET}${recorded}`);
    cue.volume = type === 'spin' ? 0.3 : 0.5;
    if (type === 'spin' && state.turbo) cue.playbackRate = 2.2;
    activeCues.add(cue);
    if (ambience) ambience.volume = 0.1;
    const release = () => { activeCues.delete(cue); if (ambience && !activeCues.size) ambience.volume = 0.25; };
    cue.addEventListener('ended', release, { once: true });
    cue.play().catch(release);
    return;
  }
  try {
    audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime;
    const notes = type === 'win' ? [523,659,784,1047] : type === 'bonus' ? [392,523,659,784,1047] : type === 'line' ? [880] : type === 'stop' ? [180] : type === 'spin' ? [180,130] : [660];
    notes.forEach((hz,i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type === 'stop' || type === 'spin' ? 'triangle' : 'sine';
      o.frequency.setValueAtTime(hz, t + i * 0.075);
      if (type === 'spin') o.frequency.exponentialRampToValueAtTime(80, t + 0.22);
      g.gain.setValueAtTime(0.0001, t + i * 0.075);
      g.gain.exponentialRampToValueAtTime(type === 'bonus' ? 0.11 : 0.07, t + i * 0.075 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.075 + (type === 'bonus' ? 0.42 : 0.2));
      o.connect(g).connect(audioCtx.destination);
      o.start(t + i * 0.075);
      o.stop(t + i * 0.075 + 0.45);
    });
  } catch { /* Sound is optional. */ }
}
function startAmbience() {
  if (!ambience) {
    ambience = new Audio(`${ASSET}ambience.mp3`);
    ambience.loop = true;
    ambience.volume = 0.25;
  }
  if (state.sound) ambience.play().catch(() => {});
}
function applyScale() {
  const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  document.querySelector('#stage')?.style.setProperty('--scale', String(scale));
}
function symbolStyle(id) {
  const s = SYMBOLS[id] || SYMBOLS.A;
  const x = SOURCE_X + s.col * CELL_W;
  const y = SOURCE_Y + s.row * CELL_H;
  return `background-image:url('${ASSET}${s.sheet}');background-position:-${x}px -${y}px`;
}
function gridHtml() {
  const lit = new Set(state.presentation?.positions || []);
  return state.matrix.flatMap((row,r) => row.map((id,c) => {
    const sticky = state.sticky.has(`${r}-${c}`);
    return `<div class="cell ${sticky ? 'sticky' : ''} ${lit.has(`${r}-${c}`) ? state.presentation.kind === 'trigger' ? 'trigger-active' : 'win-active' : ''}" data-r="${r}" data-c="${c}" data-id="${id}"><div class="symbol" style="${symbolStyle(id)}"></div>${sticky ? '<span class="sticky-badge">×2</span>' : ''}</div>`;
  })).join('');
}
function reelStrips(target) {
  return Array.from({ length: 5 }, (_, c) => [
    ...Array.from({ length: 5 }, (_, r) => target[r][c]),
    ...Array.from({ length: 6 }, () => pick(POOL)),
    ...Array.from({ length: 5 }, (_, r) => state.matrix[r][c]),
  ]);
}
function paintReel(canvas, strip) {
  const context = canvas.getContext('2d', { alpha: false });
  context.fillStyle = '#241739';
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (const [index, id] of strip.entries()) {
    const symbol = SYMBOLS[id] || SYMBOLS.A;
    const sheet = imageCache.get(symbol.sheet);
    if (!sheet?.naturalWidth) continue;
    context.drawImage(sheet, SOURCE_X + symbol.col * CELL_W, SOURCE_Y + symbol.row * CELL_H, CELL_W, CELL_H, 0, index * CELL_H, canvas.width, CELL_H);
  }
}
async function animateReels(target) {
  const grid = app.querySelector('.reel-grid');
  grid?.querySelectorAll('.reel-motion').forEach(reel => reel.remove());
  const strips = reelStrips(target);
  grid?.insertAdjacentHTML('beforeend', Array.from({ length: 5 }, (_, c) =>
    `<div class="reel-motion" data-reel="${c}" style="left:${c * CELL_W}px" aria-hidden="true"><canvas class="reel-motion-track" width="131" height="2109"></canvas></div>`
  ).join(''));
  for (let c = 0; c < 5; c++) {
    paintReel(grid.querySelector(`.reel-motion[data-reel="${c}"] canvas`), strips[c]);
  }
  const travel = 11 * CELL_H;
  const bounce = (state.turbo ? .05 : .3) * CELL_H;
  const duration = state.turbo ? 430 : 630;
  const stagger = state.turbo ? 90 : 145;
  await Promise.all(Array.from({ length: 5 }, async (_, c) => {
    const reel = grid.querySelector(`.reel-motion[data-reel="${c}"]`);
    const track = reel.querySelector('.reel-motion-track');
    const animation = track.animate([
      { transform: 'translate3d(0, 0, 0)', filter: 'blur(1.8px)', offset: 0 },
      { transform: `translate3d(0, ${travel - CELL_H}px, 0)`, filter: 'blur(1.8px)', offset: .72 },
      { transform: `translate3d(0, ${travel + bounce}px, 0)`, filter: 'blur(0px)', offset: .82, easing: 'ease-out' },
      { transform: `translate3d(0, ${travel}px, 0)`, filter: 'blur(0px)', offset: 1 },
    ], { duration, delay: c * stagger, easing: 'linear', fill: 'forwards' });
    await animation.finished.catch(() => {});
    for (let r = 0; r < 5; r++) {
      setCell(r, c, target[r][c]);
      const cell = grid.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
      cell?.classList.add('settled', 'land');
    }
    reel.remove();
    play('stop');
  }));
  state.matrix = target.map(row => [...row]);
}
function winPathHtml() {
  const show = state.presentation;
  if (!show) return '';
  const points = show.kind === 'line' ? show.positions.map(key => {
    const [r,c] = key.split('-').map(Number);
    return `${Math.round((c + .5) * CELL_W)},${Math.round((r + .5) * CELL_H)}`;
  }).join(' ') : '';
  const last = show.positions?.at(-1)?.split('-').map(Number) || [2,2];
  const labelX = Math.min(480, Math.max(10, (last[1] + .5) * CELL_W - 88));
  const labelY = Math.min(605, Math.max(12, (last[0] + .5) * CELL_H + 27));
  const payouts = show.kind === 'line' ? show.positions.map((key, index) => {
    const [r,c] = key.split('-').map(Number);
    const x = Math.round((c + .5) * CELL_W);
    const y = Math.round((r + .5) * CELL_H);
    return `<span class="win-node" style="left:${x}px;top:${y}px;--order:${index}"><i></i>${index === 0 || index === show.positions.length - 1 ? `<b>+${money(show.lineAmount)}</b>` : ''}</span>`;
  }).join('') : '';
  return `<div class="win-grid-overlay ${state.turbo ? 'fast' : ''}">${points ? `<svg viewBox="0 0 653 659" aria-hidden="true"><polyline class="win-line-glow" points="${points}"/><polyline class="win-line" points="${points}"/></svg>` : ''}${payouts}<div class="win-grid-label ${show.kind === 'trigger' ? 'trigger-label' : ''}" style="left:${labelX}px;top:${labelY}px">${show.label}</div></div>`;
}
function hudHtml() {
  return `<div class="hud ${state.screen === 'bonus' ? 'hud-bonus' : ''}">
    <button class="hud-menu" data-action="menu" aria-label="選單">☰</button>
    <button class="hud-sound" data-action="sound" aria-label="聲音">${state.sound ? '◀))' : '◀×'}</button>
    <div class="readout"><small>BALANCE</small><strong>${money(state.balance)}</strong></div>
    <div class="readout"><small>${state.screen === 'bonus' ? 'TOTAL WIN' : 'WIN'}</small><strong class="win-number">${money(state.presentation?.hudValue ?? (state.screen === 'bonus' ? state.totalWin : state.win))}</strong></div>
    ${state.screen === 'bonus' ? `<div class="readout"><small>FREE SPINS</small><strong>${state.freeSpins}</strong></div>` : ''}
    <div class="readout bet"><small>BET${state.activation ? ` ×${MODES.find(m => m.key === state.activation).cost}` : ''}</small><strong>${money(state.bet * (state.activation ? MODES.find(m => m.key === state.activation).cost : 1))}</strong></div>
    <button class="bet-arrow" data-action="bet-down" aria-label="降低投注">⌄</button>
    <button class="bet-arrow" data-action="bet-up" aria-label="提高投注">⌃</button>
  </div>`;
}
function controlsHtml() {
  return `<div class="control-mask" aria-hidden="true"></div>${hudHtml()}
  <button class="chat-btn" data-action="rules" aria-label="遊戲規則">☻</button>
  <button class="spin-btn" data-action="spin" aria-label="旋轉" ${state.spinning || rgsRoundActive || !state.rgsReady ? 'disabled' : ''}>⟳</button>
  <button class="auto-btn ${state.auto ? 'active' : ''}" data-action="auto" aria-label="自動旋轉">⏱</button>
  <button class="turbo-btn ${state.turbo ? 'active' : ''}" data-action="turbo" aria-label="快速旋轉" ${state.turboDisabled ? 'disabled' : ''}>ϟ</button>`;
}
function introHtml() {
  return `<div class="intro-screen" data-action="enter" role="button" tabindex="0" aria-label="Fangtastic Night 測試，按任意處繼續"><div class="intro-glint glint-a"></div><div class="intro-glint glint-b"></div><div class="project-test-label">測試</div><div class="intro-loader"><span>LOADING 0%</span><div class="intro-loader-track"><i></i></div></div></div>`;
}
function introReady() { return state.assetsReady && (!rgs || state.rgsReady || state.rgsError); }
function updateIntro() {
  const loader = app.querySelector('.intro-loader');
  if (!loader) return;
  loader.classList.toggle('ready', !!introReady());
  loader.querySelector('span').textContent = state.assetsReady && rgs && !state.rgsReady && !state.rgsError ? 'CONNECTING…' : `LOADING ${state.assetsProgress}%`;
  loader.querySelector('i').style.width = `${state.assetsProgress}%`;
}
async function preloadImage(name) {
  const image = new Image();
  const load = new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error(`Unable to load ${name}`));
    image.src = `${ASSET}${name}`;
  });
  let timer;
  try {
    await Promise.race([load, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Timed out loading ${name}`)), 12000);
    })]);
    clearTimeout(timer);
    imageCache.set(name, image);
    if ((name === 'base.webp' || name === 'bonus.webp') && image.decode) {
      await Promise.race([image.decode(), new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Timed out decoding ${name}`)), 12000);
      })]);
    }
  } finally {
    clearTimeout(timer);
  }
}
async function preloadGameAssets() {
  const assets = ['base-clean.webp', 'base.webp', 'vampire.webp', 'vampire-blink.webp', 'vampire-gesture.webp', 'bonus-clean.webp', 'bonus.webp', 'blood-clean.webp', 'bat-transition.webp', 'modes-reference.webp'];
  let next = 0;
  let complete = 0;
  const worker = async () => {
    while (next < assets.length) {
      const name = assets[next++];
      try { await preloadImage(name); } catch { /* The game still shows its load error on use. */ }
      complete++;
      state.assetsProgress = Math.round(complete / assets.length * 100);
      updateIntro();
    }
  };
  await Promise.all([worker(), worker()]);
  state.assetsReady = true;
  updateIntro();
}
function modalHtml() {
  if (!state.modal) return '';
  if (state.modal === 'modes') return `<div class="shade"><div class="modes-modal"><button class="close yellow" data-action="close" aria-label="關閉">×</button><h2>MODES AND BONUSES</h2><div class="mode-cards">${MODES.map(m => { const active = state.activation === m.key; const locked = m.action === 'BUY' && (!!state.activation || state.buyDisabled); return `<div class="mode-card ${active ? 'mode-active' : ''} ${locked ? 'mode-locked' : ''}"><div class="mode-art art-${m.art}"></div>${active ? '<span class="mode-active-tag">ACTIVE</span>' : ''}<div class="mode-copy"><h3>${m.name}</h3><b>${money(m.cost * state.bet)}</b><small>${m.desc}</small><button class="${m.action === 'BUY' ? 'orange' : 'pink'} ${active ? 'turn-off' : ''}" data-mode="${m.key}" ${locked ? 'disabled' : ''}>${active ? 'TURN OFF' : locked ? 'ACTIVATION ON' : m.action}</button></div></div>`; }).join('')}</div><div class="modal-bet"><div class="modal-balance"><small>BALANCE</small><b>${money(state.balance)}</b></div><div class="modal-bet-control"><button data-action="bet-down" aria-label="降低投注">−</button><div><small>BET${state.activation ? ` ×${MODES.find(m => m.key === state.activation).cost.toLocaleString('en-US')}` : ''}</small><b>${money(state.bet)}</b></div><button data-action="bet-up" aria-label="提高投注">＋</button></div></div>${state.activation ? '<p class="mode-lock-note">Bonus buys are available when no activation is on.</p>' : ''}</div></div>`;
  if (state.modal === 'confirm') { const mode = MODES.find(m => m.key === state.pendingBuy); const cost = state.bet * mode.cost; const blood = state.pendingBuy === 'blood'; return `<div class="shade"><div class="confirm-modal"><div class="confirm-hero art-${mode.art}"><button class="confirm-back" data-action="back-to-modes" aria-label="返回模式選單">‹</button><button class="close yellow" data-action="close" aria-label="關閉">×</button></div><div class="confirm-body"><h2>${mode.name}</h2><p>${blood ? '4 SCATTERS drop · 10 free spins · sticky bats · rising line multiplier.' : '3 SCATTERS drop · 10 free spins · sticky bats · a bat guaranteed on spin 1.'}</p><div class="confirm-row"><span>FREE SPINS</span><b>10</b></div><div class="confirm-row"><span>${blood ? 'LINE MULTIPLIER' : 'BAT'}</span><b>${blood ? 'RISING' : '100%'}</b></div><div class="confirm-row"><span>VOLATILITY</span><b>VERY HIGH</b></div><div class="confirm-cost-label">TOTAL COST · ${money(state.bet)} × ${mode.cost}</div><strong class="confirm-total">${money(cost)}</strong><div class="confirm-breakdown"><div class="confirm-row"><span>BET</span><b>${money(state.bet)}</b></div><div class="confirm-row"><span>BALANCE</span><b>${money(state.balance)}</b></div><div class="confirm-row"><span>AFTER</span><b>${money(state.balance - cost)}</b></div></div><button class="orange wide" data-action="confirm-buy">CONFIRM</button></div></div></div>`; }
  if (state.modal === 'rules') return `<div class="shade"><div class="rules-modal"><button class="close" data-action="close">×</button><h2>GAME RULES</h2><div class="rules-tabs"><button class="${state.rulesTab === 'paytable' ? 'selected' : ''}" data-tab="paytable">PAYTABLE</button><button class="${state.rulesTab === 'how' ? 'selected' : ''}" data-tab="how">HOW TO PLAY</button><button class="${state.rulesTab === 'bonus' ? 'selected' : ''}" data-tab="bonus">BONUSES &amp; MODES</button></div>${rulesContent()}</div></div>`;
  if (state.modal === 'menu') return `<div class="shade"><div class="menu-modal"><button class="close" data-action="close">×</button><h2>SETTINGS</h2><button data-action="sound">SOUND ${state.sound ? 'ON' : 'OFF'}</button><button data-action="turbo">TURBO ${state.turbo ? 'ON' : 'OFF'}</button><button data-action="auto">AUTO PLAY ${state.auto ? 'ON' : 'OFF'}</button><button data-action="rules">GAME RULES</button><button data-action="modes">MODES AND BONUSES</button></div></div>`;
  return '';
}
function rulesContent() {
  if (state.rulesTab === 'how') return `<div class="rules-copy"><h3>HOW TO PLAY</h3><p>Select a bet and press spin. Matching symbols on 19 fixed lines pay from left to right. Wilds replace regular symbols. Three bonus coffins trigger Night Bonus free spins.</p><p>${rgs ? 'Round outcomes and wallet balance come from Stake Engine.' : 'This playable study uses local demo outcomes and a virtual balance.'}</p></div>`;
  if (state.rulesTab === 'bonus') return `<div class="rules-copy"><h3>BONUSES &amp; MODES</h3><p>Night Bonus: 10 free spins with sticky bats. Blood Moon: red scene, 10 free spins and line multipliers. Ante changes the trigger frequency. Crimson Curtain and Mystery Bonus are one-spin activation modes.</p></div>`;
  return `<div class="facts"><div><b>5 × 5</b><small>REELS × ROWS</small></div><div><b>19</b><small>FIXED LINES</small></div><div><b>96.50%</b><small>REFERENCE RTP</small></div><div><b>25,000×</b><small>REFERENCE MAX WIN</small></div></div><div class="pay-symbols">👻 &nbsp; 🎃 &nbsp; 🐈‍⬛ &nbsp; 🧪 &nbsp; 🧄</div><table><tr><th>5</th><td>$45.00</td><td>$18.00</td><td>$12.00</td><td>$9.00</td><td>$7.20</td></tr><tr><th>4</th><td>$9.00</td><td>$4.80</td><td>$3.60</td><td>$3.00</td><td>$2.40</td></tr><tr><th>3</th><td>$1.80</td><td>$1.20</td><td>$0.90</td><td>$0.70</td><td>$0.60</td></tr></table><div class="pay-symbols letters">A &nbsp; K &nbsp; Q &nbsp; J &nbsp; 10</div>`;
}
function celebrationHtml(amount, actionName, tier, total = false) {
  const particles = Array.from({ length: 18 }, (_, i) => `<i class="${i % 4 === 0 ? 'win-gem' : 'win-coin'}" style="--i:${i};--x:${(i * 37) % 95 + 3}%;--delay:${(i * 0.19) % 2.4}s"></i>`).join('');
  return `<div class="feature-scrim win-screen win-${tier}" data-action="${actionName}"><div class="win-rays"></div><div class="win-particles">${particles}</div>${total ? '<div class="total-label">TOTAL WIN</div>' : ''}<div class="epic-title">${tier.toUpperCase()} WIN</div>${WIN_CHALICE}<div class="feature-amount" data-final="${amount}">${money(0)}</div><button class="win-skip" data-action="${actionName}">SKIP</button></div>`;
}
function animateCelebrationAmount(target) {
  const label = document.querySelector('.win-screen .feature-amount');
  if (!label) return;
  const started = performance.now();
  const duration = target >= 100 ? 2400 : 2100;
  function step(now) {
    if (!label.isConnected) return;
    const progress = Math.min(1, (now - started) / duration);
    const eased = 1 - (1 - progress) ** 3;
    label.textContent = money(Math.round(target * eased * 100) / 100);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
function winOverlayHtml() {
  if (state.screen === 'batTransition') return `<div class="bat-transition"><div class="bat-sweep">🦇 🦇 🦇 🦇 🦇</div></div>`;
  if (state.screen === 'bonusIntro') return `<div class="feature-scrim bonus-intro" data-action="start-bonus"><div class="bonus-rays"></div><div class="feature-title">${state.featureType === 'blood' ? 'BLOOD MOON' : 'NIGHT BONUS'}</div><div class="bonus-coffins">${Array.from({ length: state.featureType === 'blood' ? 4 : 3 }, (_, i) => `<span class="bonus-coffin" style="--order:${i}">${BONUS_COFFIN}</span>`).join('')}</div><div class="free-title"><strong>10</strong> FREE SPINS</div><p>${state.featureType === 'blood' ? 'STICKY BATS · RISING LINE MULTIPLIER' : 'STICKY BATS · A BAT GUARANTEED ON SPIN 1'}</p><small>PRESS ANYWHERE TO CONTINUE</small></div>`;
  if (state.screen === 'featureOutro') return celebrationHtml(state.totalWin, 'finish-bonus', state.totalWin >= 100 ? 'epic' : state.totalWin >= 35 ? 'super' : 'big', true);
  if (state.screen === 'winFlash') return celebrationHtml(state.win, 'dismiss-win', state.win >= state.bet * 30 ? 'super' : 'big');
  return '';
}
function renderLegacy() {
  const bloodScene = (state.screen === 'bonus' || state.screen === 'featureOutro' || state.screen === 'bonusIntro') && state.featureType === 'blood' || state.activation === 'curtain' && state.screen === 'base';
  app.innerHTML = `<div id="stage" class="stage ${state.screen === 'bonus' || state.screen === 'featureOutro' ? 'bonus-stage' : ''} ${bloodScene ? 'blood-stage' : ''}">
    ${state.screen === 'intro' ? introHtml() : `<div class="scene"></div><div class="sky-drift"></div><div class="moving-cloud cloud-a"></div><div class="moving-cloud cloud-b"></div><div class="scene-stars"></div><div class="bird bird-a">${BAT}</div><div class="bird bird-b">${BAT}</div><div class="bird bird-c">${BAT}</div><div class="lamp-glow"></div><div class="host-rig ${state.spinning || state.screen === 'bonusIntro' || state.screen === 'featureOutro' ? 'host-excited' : ''}"><img class="host-base" src="${ASSET}vampire.webp" alt="" /><img class="host-cape-left" src="${ASSET}vampire.webp" alt="" /><img class="host-cape-right" src="${ASSET}vampire.webp" alt="" /><img class="host-arm-cup" src="${ASSET}vampire.webp" alt="" /><img class="host-arm-open" src="${ASSET}vampire.webp" alt="" /><img class="host-head" src="${ASSET}vampire.webp" alt="" /><img class="host-blink" src="${ASSET}vampire-blink.webp" alt="" /><img class="host-gesture" src="${ASSET}vampire-gesture.webp" alt="" /></div><div class="ground-fog"></div><div class="reel-grid">${gridHtml()}</div><div class="grid-sheen"></div>${state.activation && state.screen === 'base' ? `<div class="mode-flag">${state.activation === 'curtain' ? 'CURTAIN' : state.activation === 'mystery' ? 'MYSTERY' : 'ANTE'}</div>` : ''}${state.screen === 'bonus' ? `<div class="multiplier">${state.featureType === 'blood' ? 'LINE ' : ''}×${state.multiplier}</div>` : ''}${controlsHtml()}<div class="demo-tag">FANGTASTIC NIGHT 測試 · ${rgs ? 'STAKE ENGINE' : 'DEMO'}</div>${winOverlayHtml()}${state.rgsError ? `<div class="rgs-error" data-action="rgs-retry">${escapeHtml(state.rgsError)}<small>PRESS TO RETRY</small></div>` : ''}`}
    ${modalHtml()}
  </div>`;
  document.querySelector('.grid-sheen')?.insertAdjacentHTML('afterend', winPathHtml());
  applyScale();
}
function render() {
  const stage = app.querySelector('#stage');
  if (state.screen === 'intro') {
    if (!stage?.querySelector('.intro-screen')) renderLegacy();
    updateIntro();
    return;
  }
  if (!stage?.querySelector('.reel-grid')) {
    renderLegacy();
    return;
  }

  const bloodScene = ((state.screen === 'bonus' || state.screen === 'featureOutro' || state.screen === 'bonusIntro') && state.featureType === 'blood') || (state.activation === 'curtain' && state.screen === 'base');
  stage.classList.toggle('bonus-stage', state.screen === 'bonus' || state.screen === 'featureOutro');
  stage.classList.toggle('blood-stage', bloodScene);
  stage.querySelector('.host-rig')?.classList.toggle('host-excited', state.spinning || state.screen === 'bonusIntro' || state.screen === 'featureOutro');

  const lit = new Set(state.presentation?.positions || []);
  for (const cell of stage.querySelectorAll('.cell')) {
    const row = Number(cell.dataset.r);
    const column = Number(cell.dataset.c);
    const symbol = state.matrix[row][column];
    if (cell.dataset.id !== symbol) {
      cell.dataset.id = symbol;
      cell.querySelector('.symbol').style.cssText = symbolStyle(symbol);
    }
    const sticky = state.sticky.has(`${row}-${column}`);
    cell.classList.toggle('sticky', sticky);
    cell.classList.toggle('win-active', lit.has(`${row}-${column}`) && state.presentation?.kind !== 'trigger');
    cell.classList.toggle('trigger-active', lit.has(`${row}-${column}`) && state.presentation?.kind === 'trigger');
    const badge = cell.querySelector('.sticky-badge');
    if (sticky && !badge) cell.insertAdjacentHTML('beforeend', '<span class="sticky-badge">×2</span>');
    else if (!sticky && badge) badge.remove();
    if (state.spinning) {
      cell.classList.remove('land', 'settled');
      cell.querySelector('.land-dust')?.remove();
    }
  }

  const grid = stage.querySelector('.reel-grid');
  if (!state.spinning) grid.querySelectorAll('.reel-motion').forEach(reel => reel.remove());

  stage.querySelector('.win-grid-overlay')?.remove();
  stage.querySelector('.grid-sheen')?.insertAdjacentHTML('afterend', winPathHtml());
  stage.querySelector('.mode-flag')?.remove();
  stage.querySelector('.multiplier')?.remove();
  const hud = stage.querySelector('.hud');
  if (state.activation && state.screen === 'base') hud.insertAdjacentHTML('beforebegin', `<div class="mode-flag">${state.activation === 'curtain' ? 'CURTAIN' : state.activation === 'mystery' ? 'MYSTERY' : 'ANTE'}</div>`);
  if (state.screen === 'bonus') hud.insertAdjacentHTML('beforebegin', `<div class="multiplier">${state.featureType === 'blood' ? 'LINE ' : ''}×${state.multiplier}</div>`);
  hud.outerHTML = hudHtml();

  stage.querySelector('.bat-transition')?.remove();
  stage.querySelector('.bonus-intro')?.remove();
  stage.querySelector('.win-screen')?.remove();
  stage.insertAdjacentHTML('beforeend', winOverlayHtml());
  stage.querySelector('.shade')?.remove();
  stage.insertAdjacentHTML('beforeend', modalHtml());
  stage.querySelector('.rgs-error')?.remove();
  if (state.rgsError) stage.insertAdjacentHTML('beforeend', `<div class="rgs-error" data-action="rgs-retry">${escapeHtml(state.rgsError)}<small>PRESS TO RETRY</small></div>`);
}
function setCell(r,c,id) {
  state.matrix[r][c] = id;
  const el = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
  if (el) {
    el.dataset.id = id;
    el.querySelector('.symbol').style.cssText = symbolStyle(id);
  }
}
function makeMatrix(mode) {
  const matrix = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => pick(POOL)));
  if (mode === 'trigger') {
    const positions = state.featureType === 'blood' ? [[0,0],[2,2],[4,1],[1,4]] : [[0,0],[2,2],[4,1]];
    positions.forEach(([r,c]) => matrix[r][c] = 'bonus');
  } else if (mode === 'bonus') {
    const spinIndex = 11 - state.freeSpins;
    if (spinIndex === 1) matrix[4][0] = 'bat';
    if ([2,4,6,9].includes(spinIndex)) {
      [[3,1],[3,2],[4,1]].forEach(([r,c]) => matrix[r][c] = 'wild');
      matrix[2][2] = 'bat';
    }
    if (spinIndex === 5 || spinIndex === 10) {
      for (let c=0;c<5;c++) matrix[2][c] = c === 2 ? 'bat' : 'Q';
    }
    for (const [key,id] of state.sticky) { const [r,c] = key.split('-').map(Number); matrix[r][c] = id; }
  } else if (state.spinCount % 3 === 1) {
    for (let c=0;c<4;c++) matrix[2][c] = 'Q';
  }
  return matrix;
}
function evaluate(matrix) {
  let total = 0;
  const winning = new Set();
  const lines = [];
  for (const [index,line] of LINES.entries()) {
    const first = matrix[line[0]][0];
    if (first === 'bonus') continue;
    const target = first === 'wild' || first === 'bat' ? line.map((r,c) => matrix[r][c]).find(id => id !== 'wild' && id !== 'bat') || 'A' : first;
    if (!PAY[target]) continue;
    let count = 0;
    let bats = 0;
    const positions = [];
    for (let c=0;c<5;c++) {
      const id = matrix[line[c]][c];
      if (id === target || id === 'wild' || id === 'bat') { count++; bats += id === 'bat'; positions.push(`${line[c]}-${c}`); }
      else break;
    }
    if (count >= 3) {
      const batCap = state.screen === 'bonus' ? state.featureType === 'blood' ? 4 : 2 : 8;
      const amount = Math.round(PAY[target][count-3] * Math.min(batCap, 2 ** bats) * state.bet * 100) / 100;
      total += amount;
      positions.forEach(position => winning.add(position));
      lines.push({ index: index + 1, target, positions, amount });
    }
  }
  return { amount: Math.round(total * 100) / 100, winning, lines };
}
async function presentWins(result, amount, previous, multiplier) {
  if (amount <= 0) return;
  const shownLines = result.lines.slice(0, state.turbo ? 3 : 8);
  let running = 0;
  for (const [index, line] of shownLines.entries()) {
    const lineAmount = Math.round(line.amount * multiplier * 100) / 100;
    running = Math.min(amount, Math.round((running + lineAmount) * 100) / 100);
    state.presentation = {
      kind: 'line', positions: line.positions,
      label: `LINE ${line.index} · +${money(lineAmount)}`,
      lineAmount,
      hudValue: Math.round((previous + running) * 100) / 100,
    };
    render();
    play(index === 0 ? 'win' : 'line');
    await delay(state.turbo ? TIMING.turboLineShow : TIMING.lineShow);
  }
  if (result.lines.length > shownLines.length || Math.abs(running - amount) > .001) {
    state.presentation = {
      kind: 'total', positions: [...result.winning],
      label: result.lines.length ? `TOTAL +${money(amount)}` : `BAT BONUS +${money(amount)}`,
      hudValue: Math.round((previous + amount) * 100) / 100,
    };
    render();
    play(shownLines.length ? 'line' : 'win');
    await delay(state.turbo ? TIMING.turboLineShow : TIMING.lineShow);
  }
  state.presentation = null;
}
function rgsResult(event) {
  const lines = (event.lineWins || []).map(line => {
    const path = LINES[line.line - 1] || LINES[0];
    return {
      index: line.line,
      positions: path.slice(0, line.count).map((row, column) => `${row}-${column}`),
      amount: Math.round(line.payoutMultiplier * state.bet) / 100,
    };
  });
  return { lines, winning: new Set(lines.flatMap(line => line.positions)) };
}
async function animateRgsBoard(board) {
  if (!Array.isArray(board) || board.length !== 5 || board.some(row => !Array.isArray(row) || row.length !== 5)) {
    throw new Error('Invalid RGS board event.');
  }
  state.presentation = null;
  state.spinning = true;
  state.spinCount++;
  render();
  play('spin');
  await animateReels(board);
  state.spinning = false;
  render();
}
async function playRgsRound(round) {
  if (!Array.isArray(round?.state) || !round.state.length) throw new Error('RGS returned no game events.');
  rgsRoundActive = true;
  const resumeIndex = Number(round.event) || 0;
  state.bet = round.amount ? fromRgsAmount(round.amount) : state.bet;
  state.win = 0;
  state.totalWin = 0;
  state.screen = 'base';
  state.activation = round.mode?.toLowerCase() === 'ante' ? 'ante' : null;
  state.pendingRound = null;
  for (const [index, event] of round.state.entries()) {
    if (event.type === 'reveal' || event.type === 'featureSpin') {
      if (event.type === 'featureSpin') {
        state.screen = 'bonus';
        state.freeSpins = Math.max(0, 11 - event.spin);
        state.sticky = new Map((event.stickyBats || []).map(([row, column]) => [`${row}-${column}`, 'bat']));
        state.multiplier = event.lineMultiplier || 1;
      }
      await animateRgsBoard(event.board);
      const amount = Math.round((event.payoutMultiplier || 0) * state.bet) / 100;
      const previous = event.type === 'featureSpin' ? state.totalWin : 0;
      if (event.type === 'featureSpin') state.totalWin = Math.round((previous + amount) * 100) / 100;
      else state.win = amount;
      await presentWins(rgsResult(event), amount, previous, 1);
      render();
    } else if (event.type === 'featureStart') {
      state.auto = false;
      state.featureType = event.feature === 'blood' ? 'blood' : 'night';
      state.freeSpins = event.freeSpins || 10;
      state.presentation = { kind: 'trigger', positions: state.matrix.flatMap((row, rowIndex) => row.map((symbol, column) => symbol === 'bonus' ? `${rowIndex}-${column}` : null).filter(Boolean)), label: state.featureType === 'blood' ? 'BLOOD MOON' : 'NIGHT BONUS' };
      render();
      play('bonus');
      await delay(TIMING.triggerGlow);
      state.presentation = null;
      state.screen = 'batTransition';
      play('transition');
      render();
      await delay(TIMING.transition);
      state.screen = 'bonusIntro';
      render();
      await new Promise(resolve => { rgsBonusContinue = resolve; });
    } else if (event.type === 'totalWin') {
      state.win = Math.round(event.payoutMultiplier * state.bet) / 100;
    }
    const bookIndex = Number.isInteger(event.index) ? event.index : index;
    if (bookIndex >= resumeIndex) await rgs.event(bookIndex);
  }
  const ended = await rgs.end();
  if (ended.balance) state.balance = fromRgsAmount(ended.balance.amount);
  rgsRoundActive = false;
  state.spinning = false;
  if (round.state.some(event => event.type === 'featureStart')) {
    state.totalWin = state.win;
    state.freeSpins = 0;
    state.screen = 'featureOutro';
    play('celebration');
    render();
    animateCelebrationAmount(state.totalWin);
  } else if (state.win >= state.bet * 15) {
    state.screen = 'winFlash';
    play('celebration');
    render();
    animateCelebrationAmount(state.win);
  } else {
    state.screen = 'base';
    render();
    if (state.auto) setTimeout(() => spinRgs(), state.turbo ? 200 : 700);
  }
}
async function spinRgs(mode = state.activation || 'base') {
  if (!state.rgsReady || state.spinning || rgsRoundActive || state.modal || state.screen !== 'base') return;
  state.spinning = true;
  state.rgsError = null;
  render();
  try {
    const played = await rgs.play(mode, state.rgsCurrency, state.bet);
    if (played.balance) state.balance = fromRgsAmount(played.balance.amount);
    await playRgsRound(played.round);
  } catch (error) {
    rgsRoundActive = false;
    state.spinning = false;
    state.auto = false;
    state.rgsError = error.message;
    try {
      const auth = await rgs.authenticate();
      if (auth.balance) state.balance = fromRgsAmount(auth.balance.amount);
      if (auth.round?.active) state.pendingRound = auth.round;
    } catch { /* Keep the original failure visible. */ }
    render();
  }
}
async function initRgs() {
  if (!rgs) return;
  try {
    const auth = await rgs.authenticate();
    if (!auth.balance) throw new Error('RGS authentication returned no balance.');
    state.balance = fromRgsAmount(auth.balance.amount);
    state.rgsCurrency = auth.balance.currency;
    const levels = auth.config?.betLevels?.map(fromRgsAmount).filter(value => value > 0);
    if (levels?.length) state.betLevels = [...new Set(levels)].sort((a, b) => a - b);
    const defaultBet = fromRgsAmount(auth.config?.defaultBetLevel || 0);
    state.bet = state.betLevels.includes(defaultBet) ? defaultBet : state.betLevels[0];
    state.buyDisabled = !!auth.config?.jurisdiction?.disabledBuyFeature;
    state.turboDisabled = !!auth.config?.jurisdiction?.disabledTurbo;
    if (auth.round?.active) state.pendingRound = auth.round;
    state.rgsReady = true;
    state.rgsError = null;
  } catch (error) { state.rgsError = error.message; }
  render();
  if (state.screen === 'base' && state.pendingRound && state.rgsReady) resumeRgsRound();
}
function enterGame() {
  if (!introReady()) return;
  const cover = app.querySelector('.intro-screen')?.cloneNode(true);
  cover?.removeAttribute('data-action');
  cover?.classList.add('intro-cover');
  state.screen = 'base';
  startAmbience();
  play('bonus');
  render();
  if (cover) {
    app.querySelector('#stage')?.appendChild(cover);
    requestAnimationFrame(() => cover.classList.add('fade-out'));
    setTimeout(() => cover.remove(), 450);
  }
  resumeRgsRound();
}
function resumeRgsRound() {
  if (!rgs || !state.pendingRound || rgsRoundActive) return;
  const round = state.pendingRound;
  state.rgsError = null;
  playRgsRound(round).catch(error => {
    rgsRoundActive = false;
    state.rgsError = error.message;
    state.pendingRound = round;
    render();
  });
}
async function spin(forceBonus = false) {
  if (rgs) { await spinRgs(); return; }
  if (rgsError) return;
  if (state.spinning || state.modal || (state.screen !== 'base' && state.screen !== 'bonus')) return;
  const isBonus = state.screen === 'bonus';
  const activation = state.activation;
  state.presentation = null;
  if (!isBonus) {
    const cost = state.bet * (activation ? MODES.find(m => m.key === activation).cost : 1);
    if (!forceBonus && state.balance < cost) { state.auto = false; alert('Demo balance is too low.'); return; }
    if (!forceBonus) state.balance -= cost;
    state.win = 0;
    state.spinCount++;
  }
  state.spinning = true;
  render();
  play('spin');
  const trigger = forceBonus || (!isBonus && (activation === 'curtain' || activation === 'mystery' || state.spinCount % (activation === 'ante' ? 7 : 14) === 0));
  if (trigger && !forceBonus) state.featureType = activation === 'curtain' ? 'blood' : activation === 'mystery' ? pick(['night', 'blood']) : state.spinCount % 28 === 0 ? 'blood' : 'night';
  const target = makeMatrix(trigger ? 'trigger' : isBonus ? 'bonus' : 'normal');
  await animateReels(target);
  if (!isBonus && activation !== 'ante') state.activation = null;
  if (trigger) {
    state.auto = false;
    state.presentation = { kind: 'trigger', positions: target.flatMap((row,r) => row.map((id,c) => id === 'bonus' ? `${r}-${c}` : null).filter(Boolean)), label: state.featureType === 'blood' ? 'BLOOD MOON' : 'NIGHT BONUS' };
    play('bonus');
    render();
    await delay(TIMING.triggerGlow);
    state.presentation = null;
    state.spinning = false;
    state.screen = 'batTransition';
    play('transition');
    render();
    await delay(TIMING.transition);
    state.screen = 'bonusIntro';
    play('bonus');
    render();
    return;
  }
  if (isBonus) {
    if (state.freeSpins === 10) state.sticky.set('4-0','bat');
    for (let r=0;r<5;r++) for(let c=0;c<5;c++) if (target[r][c] === 'bat') state.sticky.set(`${r}-${c}`,'bat');
    state.multiplier = Math.min(state.featureType === 'blood' ? 12 : 4, 1 + Math.floor(state.sticky.size / (state.featureType === 'blood' ? 2 : 5)));
  }
  const result = evaluate(target);
  const payoutMultiplier = isBonus ? state.multiplier : 1;
  const amount = Math.round(result.amount * payoutMultiplier * 100) / 100;
  const previous = isBonus ? state.totalWin : 0;
  if (isBonus) {
    state.totalWin = Math.round((state.totalWin + amount) * 100) / 100;
    state.freeSpins--;
  } else {
    state.win = Math.round(amount * 100) / 100;
    state.balance += state.win;
  }
  await presentWins(result, amount, previous, payoutMultiplier);
  state.spinning = false;
  render();
  if (isBonus) {
    await delay(state.turbo ? 100 : amount > 0 ? 240 : 950);
    if (state.freeSpins <= 0) {
      state.screen = 'featureOutro';
      play('celebration');
      render();
      animateCelebrationAmount(state.totalWin);
    } else spin();
  } else if (state.win >= state.bet * 15) {
    await delay(450);
    state.screen = 'winFlash';
    play('celebration');
    render();
    animateCelebrationAmount(state.win);
  } else if (state.auto) {
    await delay(state.turbo ? 200 : 700);
    spin();
  }
}
function openMode(mode) {
  play();
  if (rgsRoundActive || state.spinning || (state.buyDisabled && ['night', 'blood'].includes(mode))) return;
  if (['ante','curtain','mystery'].includes(mode)) { state.activation = state.activation === mode ? null : mode; state.modal = null; state.auto = false; render(); return; }
  if (state.activation) return;
  state.pendingBuy = mode;
  state.modal = 'confirm';
  render();
}
function action(name) {
  if (name === 'enter') { enterGame(); return; }
  if (name === 'rgs-retry') { if (state.pendingRound) resumeRgsRound(); else initRgs(); return; }
  if (name === 'close') { state.modal = null; play(); render(); return; }
  if (name === 'back-to-modes') { state.modal = 'modes'; play(); render(); return; }
  if (name === 'modes') { state.modal = 'modes'; play(); render(); return; }
  if (name === 'rules') { state.modal = 'rules'; play(); render(); return; }
  if (name === 'menu') { state.modal = 'menu'; play(); render(); return; }
  if (name === 'sound') { state.sound = !state.sound; if (state.sound) startAmbience(); else { ambience?.pause(); for (const cue of activeCues) cue.pause(); activeCues.clear(); } render(); return; }
  if (name === 'turbo') { if (state.turboDisabled) return; state.turbo = !state.turbo; play(); render(); return; }
  if (name === 'auto') { state.auto = !state.auto; state.modal = null; play(); render(); if (state.auto && !state.spinning) spin(); return; }
  if (name === 'bet-up' || name === 'bet-down') { if (!state.spinning && !rgsRoundActive) { const bets = state.betLevels; let i = bets.indexOf(state.bet); state.bet = bets[Math.max(0,Math.min(bets.length-1,i+(name==='bet-up'?1:-1)))]; play(); render(); } return; }
  if (name === 'spin') { spin(); return; }
  if (name === 'confirm-buy') { const mode = MODES.find(m => m.key === state.pendingBuy); if (rgs) { if (state.buyDisabled || !mode || !state.rgsReady) return; const key = mode.key; state.pendingBuy=null; state.modal=null; play('bonus'); render(); spinRgs(key); return; } if (state.balance < state.bet*mode.cost) { alert('Demo balance is too low.'); return; } state.balance -= state.bet*mode.cost; state.featureType=state.pendingBuy; state.pendingBuy=null; state.modal=null; play('bonus'); render(); spin(true); return; }
  if (name === 'start-bonus') { state.screen='bonus'; state.freeSpins=10; state.totalWin=0; state.multiplier=1; state.sticky.clear(); play('bonus'); render(); if (rgs) { const continueRound = rgsBonusContinue; rgsBonusContinue = null; continueRound?.(); } else setTimeout(() => spin(), TIMING.bonusStart); return; }
  if (name === 'finish-bonus') { if (!rgs) state.balance += state.totalWin; state.win=state.totalWin; state.screen='base'; state.featureType='night'; state.sticky.clear(); state.multiplier=1; play('click'); render(); return; }
  if (name === 'dismiss-win') { state.screen='base'; render(); if (state.auto) spin(); }
}
export function mountGame(root) {
  if (mounted) return;
  if (!root) throw new Error('Game mount element is missing.');
  app = root;
  mounted = true;
  for (const [name, file] of Object.entries(SCENE_ASSETS)) {
    document.documentElement.style.setProperty(name, `url("${ASSET}${file}")`);
  }
  try { rgs = createRgsClient(); } catch (error) { rgsError = error.message; }
  state.rgsReady = !rgs && !rgsError;
  state.rgsError = rgsError;
  app.addEventListener('click', event => {
  const tab = event.target.closest('[data-tab]');
  if (tab) { state.rulesTab = tab.dataset.tab; play(); render(); return; }
  const mode = event.target.closest('[data-mode]');
  if (mode) { openMode(mode.dataset.mode); return; }
  const target = event.target.closest('[data-action]');
  if (target) action(target.dataset.action);
});
window.addEventListener('resize', applyScale);
window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && state.modal) action('close');
  else if ((event.key === ' ' || event.key === 'Enter') && state.screen === 'intro') action('enter');
  else if (event.key === ' ' && !state.modal && state.screen === 'base') { event.preventDefault(); spin(); }
});
render();
preloadGameAssets();
initRgs();
}
