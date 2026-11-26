// Ember Sky Post — lightweight particles: wingtip ribbons, ring sparkles, and the little dust puff on touchdown.
import { clampValue } from './random.js';

export function createParticleSystem() {
  const particles = [];
  function spawn(p) {
    if (particles.length < 420) particles.push({ life: 0, maxLife: 1, size: 3, color: '#ffb35c', vx: 0, vy: 0, vz: 0, gravity: 0, ...p });
  }
  return {
    trail(x, y, z, roll) {
      spawn({ x: x - 26, y: y - 4, z: z - 6, vz: -14, maxLife: 0.7, size: 3.5, color: 'rgba(255,214,160,0.8)' });
      spawn({ x: x + 26, y: y - 4, z: z - 6, vz: -14, maxLife: 0.7, size: 3.5, color: 'rgba(255,214,160,0.8)' });
    },
    ringBurst(ring) {
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        spawn({ x: ring.x + Math.cos(a) * ring.radius * 0.7, y: ring.y + Math.sin(a) * ring.radius * 0.7, z: ring.z, vx: Math.cos(a) * 22, vy: Math.sin(a) * 22, maxLife: 0.9, size: 4.5, color: '#ffd27a' });
      }
    },
    dustPuff(x, y, z) {
      for (let i = 0; i < 18; i++) spawn({ x: x + (Math.random() - 0.5) * 30, y, z: z + (Math.random() - 0.5) * 40, vx: (Math.random() - 0.5) * 16, vy: 9 + Math.random() * 10, maxLife: 1.1, size: 6, color: 'rgba(232,190,150,0.75)', gravity: -4 });
    },
    update(dt) {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt; p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt + (p.gravity || 0) * dt; p.z += (p.vz || 0) * dt;
        if (p.life >= p.maxLife) particles.splice(i, 1);
      }
    },
    draw(ctx2d, project) {
      for (const p of particles) {
        const s = project(p.x, p.y, p.z);
        if (!s) continue;
        const fade = 1 - p.life / p.maxLife;
        ctx2d.globalAlpha = clampValue(fade, 0, 1) * 0.85;
        ctx2d.fillStyle = p.color;
        ctx2d.beginPath(); ctx2d.arc(s.x, s.y, Math.max(1, p.size * s.scale * 0.02), 0, Math.PI * 2); ctx2d.fill();
      }
      ctx2d.globalAlpha = 1;
    },
    clear() { particles.length = 0; },
  };
}
