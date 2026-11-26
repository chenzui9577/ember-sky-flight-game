// Ember Sky Post — cockpit renderer: nose, glareshield, and fully live instruments (attitude, altitude, speed, heading, fuel, vertical speed).
import { clampValue } from './random.js';
import { headingCardinal } from './flight-model.js';

function dial(ctx, x, y, r, label, drawFace) {
  ctx.save();
  ctx.fillStyle = '#191021';
  ctx.strokeStyle = '#ffb35c'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,247,234,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(x, y, r - 5, 0, Math.PI * 2); ctx.stroke();
  drawFace(ctx, x, y, r);
  ctx.fillStyle = '#ffd9ae'; ctx.font = `700 ${Math.round(r * 0.22)}px system-ui`; ctx.textAlign = 'center';
  ctx.fillText(label, x, y + r - 7);
  ctx.restore();
}
function needle(ctx, x, y, r, angle, color) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  ctx.strokeStyle = color || '#ff7a45'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, r * 0.18); ctx.lineTo(0, -r * 0.72); ctx.stroke();
  ctx.fillStyle = '#fff7ea'; ctx.beginPath(); ctx.arc(0, 0, 3.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
export function drawCockpit(ctx, w, h, plane, time) {
  const baseY = h * 0.80;
  // Wings left and right, banking with the plane.
  ctx.save();
  ctx.translate(w / 2, baseY + 66); ctx.rotate(plane.roll * 0.16);
  ctx.fillStyle = '#7a3327';
  ctx.beginPath(); ctx.moveTo(-w * 0.52, 40); ctx.lineTo(-90, -6); ctx.lineTo(-70, 22); ctx.lineTo(-w * 0.52, 86); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(w * 0.52, 40); ctx.lineTo(90, -6); ctx.lineTo(70, 22); ctx.lineTo(w * 0.52, 86); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffb35c'; ctx.fillRect(-w * 0.52, 38, 120, 7); ctx.fillRect(w * 0.52 - 120, 38, 120, 7);
  ctx.restore();
  // Nose cowling with a slowly spinning prop arc.
  ctx.fillStyle = '#8c3b2a';
  ctx.beginPath(); ctx.moveTo(w / 2 - 92, h); ctx.quadraticCurveTo(w / 2, baseY - 8, w / 2 + 92, h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#a34a30';
  ctx.beginPath(); ctx.moveTo(w / 2 - 58, h); ctx.quadraticCurveTo(w / 2, baseY + 26, w / 2 + 58, h); ctx.closePath(); ctx.fill();
  const propAlpha = 0.10 + Math.min(0.16, plane.speed / 700);
  ctx.strokeStyle = `rgba(30,16,26,${propAlpha + 0.14})`; ctx.lineWidth = 9;
  ctx.beginPath(); ctx.arc(w / 2, baseY + 58, 64, time * 22, time * 22 + 2.4); ctx.stroke();
  ctx.beginPath(); ctx.arc(w / 2, baseY + 58, 64, time * 22 + Math.PI, time * 22 + Math.PI + 2.4); ctx.stroke();
  // Dashboard panel.
  const panelGrad = ctx.createLinearGradient(0, baseY + 44, 0, h);
  panelGrad.addColorStop(0, '#2c1c34'); panelGrad.addColorStop(1, '#140b1c');
  ctx.fillStyle = panelGrad;
  ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, baseY + 74); ctx.quadraticCurveTo(w / 2, baseY + 28, w, baseY + 74); ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,179,92,0.55)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, baseY + 74); ctx.quadraticCurveTo(w / 2, baseY + 28, w, baseY + 74); ctx.stroke();

  const cy = h - 62, r = 47;
  // Attitude indicator — sky/ground ball that rolls and pitches with the plane.
  dial(ctx, w / 2 - 190, cy, r, 'ATTITUDE', (c, x, y, rr) => {
    c.save(); c.beginPath(); c.arc(x, y, rr - 6, 0, Math.PI * 2); c.clip();
    c.translate(x, y); c.rotate(-plane.roll * 0.85); c.translate(0, plane.pitch * 26);
    c.fillStyle = '#3f7fbf'; c.fillRect(-rr, -rr * 2, rr * 2, rr * 2);
    c.fillStyle = '#7a4b2a'; c.fillRect(-rr, 0, rr * 2, rr * 2);
    c.strokeStyle = '#fff7ea'; c.beginPath(); c.moveTo(-rr, 0); c.lineTo(rr, 0); c.stroke();
    c.restore();
    c.strokeStyle = '#ffd27a'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(x - 16, y); c.lineTo(x - 5, y); c.moveTo(x + 5, y); c.lineTo(x + 16, y); c.stroke();
    c.fillStyle = '#ffd27a'; c.beginPath(); c.arc(x, y, 2.6, 0, Math.PI * 2); c.fill();
  });
  // Altimeter.
  dial(ctx, w / 2 - 62, cy, r, 'ALT ft', (c, x, y, rr) => {
    const a = (plane.y / 1000) * Math.PI * 2 - Math.PI / 2;
    needle(c, x, y, rr, a + Math.PI / 2);
    c.fillStyle = '#fff7ea'; c.font = '800 15px system-ui'; c.textAlign = 'center';
    c.fillText(String(Math.round(plane.y * 4.8)), x, y + 22);
  });
  // Airspeed.
  dial(ctx, w / 2 + 62, cy, r, 'SPEED kt', (c, x, y, rr) => {
    const frac = clampValue((plane.speed - 20) / 110, 0, 1);
    needle(c, x, y, rr, -Math.PI * 0.75 + frac * Math.PI * 1.5 + Math.PI / 2, plane.speed < 36 ? '#ff5c5c' : '#ff7a45');
    c.fillStyle = plane.speed < 36 ? '#ff8a8a' : '#fff7ea'; c.font = '800 15px system-ui'; c.textAlign = 'center';
    c.fillText(String(Math.round(plane.speed * 1.45)), x, y + 22);
  });
  // Heading compass.
  dial(ctx, w / 2 + 190, cy, r, 'HEADING', (c, x, y, rr) => {
    const deg = ((plane.headingDeg % 360) + 360) % 360;
    needle(c, x, y, rr, (deg * Math.PI) / 180, '#7dffa8');
    c.fillStyle = '#fff7ea'; c.font = '800 14px system-ui'; c.textAlign = 'center';
    c.fillText(`${String(Math.round(deg)).padStart(3, '0')}° ${headingCardinal(deg)}`, x, y + 22);
  });
  // Fuel + vertical speed as slim bars on the panel edges.
  drawBar(ctx, 42, h - 96, 150, 13, plane.fuel / 100, '#ffb35c', `FUEL ${Math.round(plane.fuel)}%`);
  drawBar(ctx, w - 192, h - 96, 150, 13, clampValue((plane.verticalSpeed + 30) / 60, 0, 1), '#7dc4ff', `CLIMB ${plane.verticalSpeed >= 0 ? '+' : ''}${Math.round(plane.verticalSpeed * 22)} fpm`);
  // Stall warning lamp.
  if (plane.speed < 36) {
    ctx.fillStyle = Math.sin(time * 9) > 0 ? '#ff4d4d' : '#7a1f1f';
    ctx.beginPath(); ctx.arc(w / 2, baseY + 52, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff7ea'; ctx.font = '800 11px system-ui'; ctx.textAlign = 'center'; ctx.fillText('STALL', w / 2, baseY + 78);
  }
}
function drawBar(ctx, x, y, wdt, hgt, frac, color, label) {
  ctx.fillStyle = 'rgba(255,247,234,0.14)'; ctx.fillRect(x, y, wdt, hgt);
  ctx.fillStyle = color; ctx.fillRect(x, y, wdt * clampValue(frac, 0, 1), hgt);
  ctx.strokeStyle = 'rgba(255,179,92,0.5)'; ctx.strokeRect(x, y, wdt, hgt);
  ctx.fillStyle = '#ffd9ae'; ctx.font = '700 11px system-ui'; ctx.textAlign = 'left'; ctx.fillText(label, x, y - 6);
}
export function drawCentreMarker(ctx, w, h, plane) {
  const cx = w / 2, cy = h * 0.44 + plane.pitch * 60;
  ctx.strokeStyle = 'rgba(255,247,234,0.85)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 26, cy); ctx.lineTo(cx - 15, cy); ctx.moveTo(cx + 15, cy); ctx.lineTo(cx + 26, cy); ctx.stroke();
}
