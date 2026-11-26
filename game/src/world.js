// Ember Sky Post — builds the dusk valley course: ember rings, Lantern Farm, Ember Field runway, ridge lines and villages.
import { createSeededRandom, randomBetween } from './random.js';
import { WORLD } from './config.js';

export function buildCourse() {
  const rand = createSeededRandom(20261126);
  const rings = [];
  const ringZ = [900, 2100, 3300, 4500, 5600, 6600];
  for (let i = 0; i < ringZ.length; i++) {
    rings.push({
      index: i,
      x: randomBetween(rand, -260, 260),
      y: 210 + randomBetween(rand, -60, 170),
      z: ringZ[i],
      radius: 78,
      passed: false,
      missed: false,
    });
  }
  const farm = { x: 150, y: 26, z: 7450, radius: 150, delivered: false, quality: '' };
  const runway = { x: 0, y: 8, z: 8600, length: 620, width: 64, headingDeg: 47 };
  const villages = [];
  for (let i = 0; i < 26; i++) {
    villages.push({
      x: randomBetween(rand, -560, 560),
      z: randomBetween(rand, 300, WORLD.courseLength - 200),
      size: randomBetween(rand, 14, 34),
      warm: rand() > 0.35,
    });
  }
  const ridgePeaks = [];
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i <= 28; i++) {
      ridgePeaks.push({
        side,
        z: i * 340,
        height: 190 + rand() * 260 + Math.sin(i * 0.7 + side) * 60,
        offset: 760 + rand() * 320,
      });
    }
  }
  const clouds = [];
  for (let i = 0; i < 34; i++) {
    clouds.push({ x: randomBetween(rand, -1400, 1400), y: randomBetween(rand, 330, 760), z: randomBetween(rand, 0, WORLD.courseLength), scale: randomBetween(rand, 0.6, 1.9), drift: randomBetween(rand, 1, 5) });
  }
  return { rings, farm, runway, villages, ridgePeaks, clouds };
}
export function nextRing(course, planeZ) {
  return course.rings.find((r) => !r.passed && !r.missed) || null;
}
export function courseProgress(planeZ) {
  return Math.max(0, Math.min(1, planeZ / WORLD.courseLength));
}
