// Ember Sky Post — browser entry: wires the canvas, HUD, panels and buttons to the game, and runs the animation loop.
import { createGame, GameState } from './game.js';
import { createInput } from './input.js';
import { createAudioEngine } from './audio.js';

const canvas = document.getElementById('sky-canvas');
const ui = {
  menu: document.getElementById('menu-screen'),
  briefing: document.getElementById('briefing-screen'),
  pause: document.getElementById('pause-screen'),
  result: document.getElementById('result-screen'),
  hud: document.getElementById('hud'),
  alt: document.getElementById('hud-alt'),
  speed: document.getElementById('hud-speed'),
  heading: document.getElementById('hud-heading'),
  score: document.getElementById('hud-score'),
  fuel: document.getElementById('hud-fuel'),
  mail: document.getElementById('hud-mail'),
  objective: document.getElementById('hud-objective'),
  timer: document.getElementById('hud-timer'),
  combo: document.getElementById('combo-toast'),
  bestLine: document.getElementById('best-line'),
  resultTitle: document.getElementById('result-title'),
  resultStars: document.getElementById('result-stars'),
  resultVerdict: document.getElementById('result-verdict'),
  resultStats: document.getElementById('result-stats'),
};
const audio = createAudioEngine();
const input = createInput(canvas);
const game = createGame(canvas, ui, audio, input);
window.__emberSky = game;

document.getElementById('btn-briefing').addEventListener('click', () => game.openBriefing());
document.getElementById('btn-takeoff').addEventListener('click', () => game.startSortie());
document.getElementById('btn-resume').addEventListener('click', () => game.togglePause());
document.getElementById('btn-restart-pause').addEventListener('click', () => game.startSortie());
document.getElementById('btn-again').addEventListener('click', () => game.startSortie());
canvas.addEventListener('click', () => { if (game.state === GameState.FLYING) audio.startEngine(); });

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  requestAnimationFrame(() => { game.presetScene(shot); document.title = 'shot-ready'; });
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    game.update(dt);
    game.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
