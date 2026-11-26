// Ember Sky Post — a tiny seeded random generator so every pilot flies the same fair valley.
export function createSeededRandom(seed) {
  let state = seed >>> 0 || 1;
  return function nextRandom() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
export function randomBetween(rand, min, max) {
  return min + rand() * (max - min);
}
export function clampValue(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
export function lerpValue(a, b, t) {
  return a + (b - a) * t;
}
export function smoothStep(t) {
  const x = clampValue(t, 0, 1);
  return x * x * (3 - 2 * x);
}
