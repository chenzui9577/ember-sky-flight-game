// Ember Sky Post — scene renderer: dusk sky, layered ridges, the river valley, villages, clouds, rings, farm and runway, all projected from the cockpit.
import { clampValue, smoothStep } from './random.js';
import { WORLD } from './config.js';

export function makeProjector(plane, width, height) {
  const horizonY = height * 0.46 + plane.pitch * 120;
  const cx = width / 2 - plane.roll * 46;
  return function project(x, y, z) {
    const dz = z - plane.z;
    if (dz < 8) return null;
    const scale = 700 / dz;
    return {
      x: cx + (x - plane.x) * scale + plane.roll * dz * 0.012,
      y: horizonY + (plane.y - y) * scale,
      scale,
      dz,
    };
  };
}
export function drawSky(ctx, w, h, plane, time) {
  const horizonY = h * 0.46 + plane.pitch * 120;
  const grad = ctx.createLinearGradient(0, 0, 0, horizonY * 1.25);
  grad.addColorStop(0, '#2b1d4e');
  grad.addColorStop(0.42, '#7a3b69');
  grad.addColorStop(0.72, '#d96f4e');
  grad.addColorStop(1, '#ffb35c');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
  // Sun, low and kind.
  const sunX = w * 0.68 - plane.roll * 30, sunY = horizonY - h * 0.13;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 120);
  sunGrad.addColorStop(0, 'rgba(255,236,180,0.95)'); sunGrad.addColorStop(0.25, 'rgba(255,190,110,0.75)'); sunGrad.addColorStop(1, 'rgba(255,150,80,0)');
  ctx.fillStyle = sunGrad; ctx.beginPath(); ctx.arc(sunX, sunY, 120, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffe9b8'; ctx.beginPath(); ctx.arc(sunX, sunY, 34, 0, Math.PI * 2); ctx.fill();
  // Early stars up top.
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  for (let i = 0; i < 40; i++) {
    const sx = ((i * 173.3) % w), sy = ((i * 97.7) % (h * 0.2));
    ctx.fillRect(sx, sy, 1.6, 1.6);
  }
  return horizonY;
}
export function drawClouds(ctx, course, plane, project) {
  for (const c of course.clouds) {
    const s = project(c.x + Math.sin(c.z * 0.01) * 8, c.y, c.z);
    if (!s || s.dz > 5200 || s.dz < 500) continue;
    const rw = 120 * c.scale * s.scale * 0.14 + 22, rh = rw * 0.22;
    ctx.fillStyle = 'rgba(255,196,160,0.30)';
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, rw, rh, 0, 0, Math.PI * 2);
    ctx.ellipse(s.x + rw * 0.48, s.y + rh * 0.3, rw * 0.66, rh * 0.85, 0, 0, Math.PI * 2);
    ctx.ellipse(s.x - rw * 0.5, s.y + rh * 0.24, rw * 0.55, rh * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
export function drawRidgeSilhouettes(ctx, w, horizonY, plane) {
  // Two layered ridge lines in screen space, scrolling gently with the flight — soft dusk silhouettes, never spikes.
  const layers = [
    { base: horizonY - 6, amp: 54, color: 'rgba(112,58,92,0.75)', scroll: plane.z * 0.012 + plane.x * 0.05, seed: 1.7 },
    { base: horizonY + 4, amp: 88, color: 'rgba(62,36,66,0.92)', scroll: plane.z * 0.03 + plane.x * 0.11, seed: 4.2 },
  ];
  for (const L of layers) {
    ctx.fillStyle = L.color;
    ctx.beginPath();
    ctx.moveTo(0, horizonY + 30);
    for (let x = 0; x <= w; x += 16) {
      const t = (x + L.scroll) * 0.006 + L.seed;
      const y = L.base - (Math.sin(t) * 0.5 + Math.sin(t * 2.33 + 1.3) * 0.3 + Math.sin(t * 0.37 + 0.6) * 0.45 + 0.75) * L.amp;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, horizonY + 30); ctx.closePath(); ctx.fill();
    // Snow-kissed ember rim light along the far ridge.
    if (L.seed < 2) {
      ctx.strokeStyle = 'rgba(255,170,110,0.5)'; ctx.lineWidth = 2; ctx.beginPath();
      for (let x = 0; x <= w; x += 16) {
        const t = (x + L.scroll) * 0.006 + L.seed;
        const y = L.base - (Math.sin(t) * 0.5 + Math.sin(t * 2.33 + 1.3) * 0.3 + Math.sin(t * 0.37 + 0.6) * 0.45 + 0.75) * L.amp;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
}
export function drawTerrain(ctx, w, h, plane, project, course, horizonY) {
  // Valley floor.
  const floor = ctx.createLinearGradient(0, horizonY, 0, h);
  floor.addColorStop(0, '#8a5a44'); floor.addColorStop(0.25, '#5f6b3a'); floor.addColorStop(1, '#2f4426');
  ctx.fillStyle = floor; ctx.fillRect(0, horizonY, w, h - horizonY);
  // River ribbon winding down the valley.
  ctx.strokeStyle = 'rgba(140,200,235,0.65)'; ctx.lineCap = 'round';
  for (let seg = 0; seg < 22; seg++) {
    const z1 = plane.z + seg * 130, z2 = z1 + 130;
    const x1 = Math.sin(z1 * 0.0016) * 210, x2 = Math.sin(z2 * 0.0016) * 210;
    const a = project(x1, 2, z1), b = project(x2, 2, z2);
    if (!a || !b) continue;
    ctx.lineWidth = Math.max(1.5, 26 * a.scale * 0.05);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  // Field patches.
  for (let i = 0; i < 30; i++) {
    const z = plane.z + ((i * 613) % 2600) + 60;
    const x = ((i * 389) % 900) - 450;
    const s = project(x, 1, z); if (!s) continue;
    const pw = 90 * s.scale * 0.06 + 4;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(214,164,84,0.5)' : i % 3 === 1 ? 'rgba(110,140,62,0.55)' : 'rgba(150,104,58,0.5)';
    ctx.fillRect(s.x - pw / 2, s.y - pw * 0.12, pw, pw * 0.24);
  }
  // Ridges as layered screen-space silhouettes hugging the horizon.
  drawRidgeSilhouettes(ctx, w, horizonY, plane);
  // Village lights.
  for (const v of course.villages) {
    const s = project(v.x, 6, v.z); if (!s || s.dz > 3600) continue;
    ctx.fillStyle = v.warm ? '#ffd27a' : '#cfe8ff';
    const n = 4;
    for (let k = 0; k < n; k++) ctx.fillRect(s.x + (k - 2) * v.size * s.scale * 0.03, s.y - (k % 2) * 3, 2.4, 2.4);
    ctx.fillStyle = 'rgba(38,26,40,0.9)';
    ctx.fillRect(s.x - v.size * s.scale * 0.04, s.y - 5 * s.scale * 0.05, v.size * s.scale * 0.08, 5 * s.scale * 0.05 + 2);
  }
}
export function drawCourseObjects(ctx, course, plane, project, time) {
  // Ember rings. Only the next ring gets a label, so the view ahead stays clean.
  const labelled = course.rings.find((r) => !r.passed && !r.missed);
  for (const ring of course.rings) {
    // Keep the view ahead readable: show the next two rings, plus any already judged.
    if (labelled && !ring.passed && !ring.missed && ring.index > labelled.index + 1) continue;
    const s = project(ring.x, ring.y, ring.z);
    if (!s || s.dz > 4200) continue;
    const r = ring.radius * s.scale;
    if (r < 3) continue;
    const pulse = 1 + Math.sin(time * 3 + ring.index) * 0.03;
    ctx.lineWidth = Math.max(2, 9 * s.scale * 0.12);
    ctx.strokeStyle = ring.passed ? 'rgba(120,255,170,0.85)' : ring.missed ? 'rgba(150,140,160,0.5)' : '#ffb35c';
    ctx.shadowColor = '#ff7a45'; ctx.shadowBlur = ring.passed ? 0 : 18;
    ctx.beginPath(); ctx.arc(s.x, s.y, r * pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,247,234,0.75)'; ctx.lineWidth = Math.max(1, 2.4 * s.scale * 0.1);
    ctx.beginPath(); ctx.arc(s.x, s.y, r * 0.82 * pulse, 0, Math.PI * 2); ctx.stroke();
    if (ring === labelled && s.dz < 2400) {
      ctx.fillStyle = 'rgba(24,16,32,0.65)';
      const label = `RING ${ring.index + 1}`;
      ctx.font = '700 13px system-ui'; const tw = ctx.measureText(label).width;
      ctx.fillRect(s.x - tw / 2 - 7, s.y - r - 30, tw + 14, 20);
      ctx.fillStyle = '#ffd9ae'; ctx.textAlign = 'center'; ctx.fillText(label, s.x, s.y - r - 16);
    }
  }
  // Lantern Farm delivery circle.
  const farm = course.farm;
  const fs = project(farm.x, farm.y, farm.z);
  if (fs && fs.dz < 5600) {
    const r = farm.radius * fs.scale;
    ctx.strokeStyle = farm.delivered ? '#7dffa8' : '#ffe28a'; ctx.lineWidth = 3; ctx.setLineDash([10, 7]);
    ctx.beginPath(); ctx.ellipse(fs.x, fs.y, r, r * 0.32, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#3a2430'; ctx.fillRect(fs.x - r * 0.22, fs.y - r * 0.34, r * 0.44, r * 0.26);
    ctx.fillStyle = '#5a2f2a'; ctx.beginPath(); ctx.moveTo(fs.x - r * 0.28, fs.y - r * 0.34); ctx.lineTo(fs.x, fs.y - r * 0.55); ctx.lineTo(fs.x + r * 0.28, fs.y - r * 0.34); ctx.fill();
    ctx.fillStyle = '#ffd27a'; ctx.fillRect(fs.x - 3, fs.y - r * 0.26, 6, 6);
    ctx.fillStyle = '#fff7ea'; ctx.font = '700 13px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('LANTERN FARM — DROP MAIL HERE (SPACE)', fs.x, fs.y - r - 12);
  }
  // Ember Field runway.
  const rw = course.runway;
  const near = project(rw.x, rw.y, rw.z), far = project(rw.x, rw.y, rw.z + rw.length);
  if (near && far && near.dz < 5200) {
    const nw = rw.width * near.scale, fw = Math.max(2, rw.width * far.scale);
    ctx.fillStyle = '#4b423e';
    ctx.beginPath(); ctx.moveTo(near.x - nw / 2, near.y); ctx.lineTo(near.x + nw / 2, near.y); ctx.lineTo(far.x + fw / 2, far.y); ctx.lineTo(far.x - fw / 2, far.y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#fff7ea'; ctx.lineWidth = 2; ctx.setLineDash([16, 14]);
    ctx.beginPath(); ctx.moveTo(near.x, near.y); ctx.lineTo(far.x, far.y); ctx.stroke(); ctx.setLineDash([]);
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#7dffa8';
      for (let i = 0; i < 6; i++) {
        const t = i / 5, zz = rw.z + t * rw.length, pp = project(rw.x + side * rw.width * 0.55, rw.y, zz);
        if (pp) { ctx.beginPath(); ctx.arc(pp.x, pp.y, Math.max(1.6, 3 * pp.scale * 0.08), 0, Math.PI * 2); ctx.fill(); }
      }
    }
    if (near.dz < 1500) {
      ctx.fillStyle = '#fff7ea'; ctx.font = '800 15px system-ui'; ctx.textAlign = 'center';
      ctx.fillText('EMBER FIELD · 04', near.x, near.y + 26);
    }
  }
}
export function drawMailPouch(ctx, pouch, project) {
  if (!pouch || !pouch.falling) return;
  const s = project(pouch.x, pouch.y, pouch.z); if (!s) return;
  ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(pouch.spin);
  ctx.fillStyle = '#c98d4e'; const sz = Math.max(7, 15 * s.scale * 0.12);
  ctx.fillRect(-sz / 2, -sz / 2, sz, sz * 0.8);
  ctx.fillStyle = '#fff7ea'; ctx.fillRect(-sz / 2, -sz / 2, sz, sz * 0.22);
  ctx.restore();
}
export function altitudeTint(plane) {
  return smoothStep(clampValue(plane.y / 900, 0, 1));
}
