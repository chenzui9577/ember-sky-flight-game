// Ember Sky Post — the sortie orchestrator: states, ring checks, the mail drop, landing judgement, timing, and the HUD wiring.
import { WORLD } from './config.js';
import { buildCourse, nextRing } from './world.js';
import { createPlane, stepPlane } from './flight-model.js';
import { createScoreCard, scoreRingPass, scoreRingMiss, scoreDelivery, scoreLanding, starRating, verdictLine } from './scoring.js';
import { createParticleSystem } from './particles.js';
import { makeProjector, drawSky, drawClouds, drawTerrain, drawCourseObjects, drawMailPouch } from './render-scene.js';
import { drawCockpit, drawCentreMarker } from './render-cockpit.js';

export const GameState = { MENU: 'menu', BRIEFING: 'briefing', FLYING: 'flying', PAUSED: 'paused', DONE: 'done' };

export function createGame(canvas, ui, audio, input) {
  const ctx = canvas.getContext('2d');
  const game = {
    state: GameState.MENU,
    course: buildCourse(),
    plane: createPlane(),
    card: createScoreCard(),
    particles: createParticleSystem(),
    pouch: null,
    time: 0,
    timeLeft: WORLD.timeLimit,
    shake: 0,
    toastTimer: 0,
    finished: false,
    events: {},
  };
  function show(id, on) { ui[id].classList.toggle('hidden', !on); }
  function setScreens() {
    show('menu', game.state === GameState.MENU);
    show('briefing', game.state === GameState.BRIEFING);
    show('pause', game.state === GameState.PAUSED);
    show('result', game.state === GameState.DONE);
    show('hud', game.state === GameState.FLYING || game.state === GameState.PAUSED);
    const best = Number(localStorage.getItem('ember-sky-best') || 0);
    ui.bestLine.textContent = best > 0 ? `Best sortie so far: ${best.toLocaleString()} points. The valley remembers.` : 'No flights logged yet — the valley is waiting.';
  }
  game.startSortie = function startSortie() {
    game.course = buildCourse();
    game.plane = createPlane();
    game.card = createScoreCard();
    game.particles.clear();
    game.pouch = null; game.timeLeft = WORLD.timeLimit; game.finished = false; game.shake = 0;
    game.state = GameState.FLYING;
    audio.startEngine();
    setScreens();
  };
  game.openBriefing = function openBriefing() { game.state = GameState.BRIEFING; setScreens(); };
  game.togglePause = function togglePause() {
    if (game.state === GameState.FLYING) game.state = GameState.PAUSED;
    else if (game.state === GameState.PAUSED) game.state = GameState.FLYING;
    setScreens();
  };
  function toast(text) { ui.combo.textContent = text; ui.combo.classList.remove('hidden'); game.toastTimer = 2.2; }
  function finishSortie(reason) {
    if (game.finished) return;
    game.finished = true;
    game.card.timeLeft = Math.max(0, Math.round(game.timeLeft));
    if (game.card.landed) game.card.score += game.card.timeLeft * 4;
    game.state = GameState.DONE;
    audio.stopEngine(); audio.landingSigh();
    const stars = starRating(game.card);
    ui.resultTitle.textContent = game.card.delivered ? 'Mail delivered!' : reason === 'landed' ? 'Down safe — pouch still aboard' : 'Sortie over';
    ui.resultStars.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    ui.resultVerdict.textContent = verdictLine(game.card);
    const rows = [
      ['Final score', game.card.score.toLocaleString()],
      ['Rings threaded', `${game.card.ringsHit} / 6`],
      ['Best combo', `×${game.card.bestCombo}`],
      ['Mail drop', game.card.delivered ? game.card.deliveryQuality : 'Not delivered'],
      ['Landing', game.card.landed ? game.card.landingQuality : 'Still airborne at dusk'],
      ['Fuel left', `${Math.round(game.plane.fuel)}%`],
    ];
    ui.resultStats.innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    const best = Number(localStorage.getItem('ember-sky-best') || 0);
    if (game.card.score > best) localStorage.setItem('ember-sky-best', String(game.card.score));
    setScreens();
  }
  game.finishSortie = finishSortie;
  function checkRings() {
    for (const ring of game.course.rings) {
      if (ring.passed || ring.missed) continue;
      if (game.plane.z >= ring.z) {
        const dx = game.plane.x - ring.x, dy = game.plane.y - ring.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= ring.radius) {
          ring.passed = true;
          const res = scoreRingPass(game.card, dist / ring.radius);
          game.particles.ringBurst(ring); audio.ringChime(game.card.combo);
          toast(res.centre ? `DEAD CENTRE +${res.points} · Combo ×${game.card.combo}` : `RING +${res.points} · Combo ×${game.card.combo}`);
        } else if (dist <= ring.radius * 2.6) {
          ring.missed = true; scoreRingMiss(game.card); audio.missWhoosh(); toast('Ring missed — combo reset. Chin up, pilot.');
        } else {
          ring.missed = true; scoreRingMiss(game.card);
        }
      }
    }
  }
  function dropPouch() {
    if (game.pouch || game.course.farm.delivered) return;
    game.pouch = { x: game.plane.x, y: game.plane.y - 8, z: game.plane.z + 30, vy: 0, falling: true, spin: 0 };
    ui.mail.textContent = '✉ away!';
  }
  function stepPouch(dt) {
    const p = game.pouch; if (!p) return;
    p.vy -= 55 * dt; p.y += p.vy * dt; p.z += game.plane.speed * dt * 1.4; p.spin += dt * 3;
    if (p.y <= 24) {
      const farm = game.course.farm;
      const dist = Math.hypot(p.x - farm.x, p.z - farm.z);
      const ratio = dist / (farm.radius * 1.6);
      const pts = scoreDelivery(game.card, ratio);
      farm.delivered = true; audio.dropThud(); audio.deliverChime();
      toast(`MAIL DELIVERED +${pts} — ${game.card.deliveryQuality}!`);
      ui.mail.textContent = '✉ delivered';
      game.pouch = null;
    }
  }
  function checkLanding() {
    const plane = game.plane, rw = game.course.runway;
    if (!game.events.touchedGround) return;
    const nearRunwayZ = plane.z > rw.z - 120 && plane.z < rw.z + rw.length + 160;
    const onStrip = nearRunwayZ && Math.abs(plane.x - rw.x) < rw.width;
    if (plane.z > 7000) {
      scoreLanding(game.card, plane, onStrip);
      game.particles.dustPuff(plane.x, 8, plane.z);
      if (!onStrip || plane.speed > 74) { game.shake = 0.5; audio.bump(); }
      finishSortie('landed');
    } else if (plane.verticalSpeed < -16) {
      // A rough meadow arrival early ends the sortie, scored as a safe put-down.
      scoreLanding(game.card, plane, false);
      game.shake = 0.6; audio.bump();
      finishSortie('meadow');
    } else {
      plane.y = 8; plane.verticalSpeed = Math.abs(plane.verticalSpeed) * 0.25;
    }
  }
  game.update = function update(dt) {
    game.time += dt;
    if (game.toastTimer > 0) { game.toastTimer -= dt; if (game.toastTimer <= 0) ui.combo.classList.add('hidden'); }
    if (input.consumePause()) game.togglePause();
    if (game.state !== GameState.FLYING) return;
    game.timeLeft -= dt;
    if (game.timeLeft <= 0) { finishSortie('time'); return; }
    game.events = {};
    stepPlane(game.plane, input, dt, game.events);
    if (game.events.scraping) game.shake = Math.max(game.shake, 0.18);
    game.shake = Math.max(0, game.shake - dt * 1.4);
    if (input.consumeDrop()) dropPouch();
    stepPouch(dt);
    checkRings();
    checkLanding();
    game.particles.trail(game.plane.x, game.plane.y, game.plane.z, game.plane.roll);
    game.particles.update(dt);
    audio.setEngine(game.plane.speed / 118);
    updateHud();
  };
  function updateHud() {
    const p = game.plane;
    ui.alt.textContent = Math.round(p.y * 4.8).toLocaleString();
    ui.speed.textContent = String(Math.round(p.speed * 1.45));
    const deg = ((Math.round(p.headingDeg) % 360) + 360) % 360;
    ui.heading.textContent = `${String(deg).padStart(3, '0')}°`;
    ui.score.textContent = game.card.score.toLocaleString();
    ui.fuel.textContent = `${Math.round(p.fuel)}%`;
    const ring = nextRing(game.course, p.z);
    if (!game.course.farm.delivered && p.z > 6800) ui.objective.textContent = 'Drop the mail over Lantern Farm — press SPACE in the circle';
    else if (p.z > 7900) ui.objective.textContent = 'Ember Field ahead — slow down, wings level, land on the strip';
    else if (ring) ui.objective.textContent = `Next: ember ring ${ring.index + 1} of 6 · then Lantern Farm`;
    else ui.objective.textContent = 'All rings done — Lantern Farm, then home to Ember Field';
    const t = Math.max(0, Math.ceil(game.timeLeft));
    ui.timer.textContent = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  }
  game.render = function render() {
    const w = canvas.width, h = canvas.height;
    ctx.save();
    if (game.shake > 0) ctx.translate((Math.random() - 0.5) * game.shake * 14, (Math.random() - 0.5) * game.shake * 10);
    const project = makeProjector(game.plane, w, h);
    const horizonY = drawSky(ctx, w, h, game.plane, game.time);
    drawClouds(ctx, game.course, game.plane, project);
    drawTerrain(ctx, w, h, game.plane, project, game.course, horizonY);
    drawCourseObjects(ctx, game.course, game.plane, project, game.time);
    drawMailPouch(ctx, game.pouch, project);
    game.particles.draw(ctx, project);
    drawCentreMarker(ctx, w, h, game.plane);
    drawCockpit(ctx, w, h, game.plane, game.time);
    ctx.restore();
    if (game.state === GameState.MENU || game.state === GameState.BRIEFING) {
      // Idle valley drift behind the panels: the plane gently cruises.
      game.plane.z += 12 * 0.016; game.plane.x = Math.sin(game.time * 0.24) * 60;
      game.plane.y = 300 + Math.sin(game.time * 0.5) * 18;
    }
  };
  // Deterministic scene presets used to take honest screenshots of real gameplay states.
  game.presetScene = function presetScene(name) {
    game.startSortie();
    const p = game.plane;
    if (name === 'ring') {
      const ring = game.course.rings[1];
      p.z = ring.z - 620; p.x = ring.x - 40; p.y = ring.y + 26; p.speed = 82; p.roll = 0.18;
      game.card.score = 650; game.card.combo = 2; game.course.rings[0].passed = true; game.card.ringsHit = 1;
    } else if (name === 'approach') {
      p.z = 7950; p.x = 18; p.y = 120; p.speed = 54; p.roll = 0.03;
      game.card.score = 2150; game.card.ringsHit = 5; game.course.rings.forEach((r, i) => { r.passed = i < 5; r.missed = i === 5; });
      game.course.farm.delivered = true; game.card.delivered = true; ui.mail.textContent = '✉ delivered';
    } else if (name === 'farm') {
      p.z = 6400; p.x = 60; p.y = 190; p.speed = 70; p.roll = -0.12;
      game.card.score = 1800; game.card.ringsHit = 6; game.course.rings.forEach((r) => { r.passed = true; });
    } else {
      p.z = 120; p.x = -30; p.y = 285; p.speed = 76;
    }
    for (let i = 0; i < 26; i++) game.update(1 / 30);
    game.render();
    updateHud();
  };
  setScreens();
  return game;
}
