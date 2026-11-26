// Ember Sky Post — the flight model: throttle, pitch, banked turns, lift, stall, fuel burn, and gentle ridge bumps.
import { PLANE, WORLD } from './config.js';
import { clampValue } from './random.js';
import { readPitchInput, readRollInput, readThrottleInput } from './input.js';

export function createPlane() {
  return {
    x: 0, y: WORLD.startAltitude, z: 0,
    speed: PLANE.startSpeed, pitch: 0, roll: 0, headingDeg: 47,
    verticalSpeed: 0, fuel: 100, hull: 100, airborne: true, landed: false, crashed: false,
  };
}
export function stepPlane(plane, input, dt, events) {
  const throttle = readThrottleInput(input);
  plane.speed += throttle * PLANE.throttleRate * dt - PLANE.dragPerSecond * dt * (plane.speed / PLANE.maxSpeed);
  if (throttle > 0) plane.fuel = Math.max(0, plane.fuel - dt * 0.55);
  else plane.fuel = Math.max(0, plane.fuel - dt * 0.22);

  const targetPitch = readPitchInput(input) * 0.55;
  plane.pitch += (targetPitch - plane.pitch) * Math.min(1, dt * 5.2);
  const targetRoll = readRollInput(input) * 0.95;
  plane.roll += (targetRoll - plane.roll) * Math.min(1, dt * 5.6);

  plane.headingDeg += plane.roll * PLANE.turnRate * dt * 38;
  plane.x += plane.roll * plane.speed * dt * 1.55;
  plane.x = clampValue(plane.x, -WORLD.valleyHalfWidth, WORLD.valleyHalfWidth);

  const lift = (plane.speed - PLANE.stallSpeed) * PLANE.liftPerSpeed;
  plane.verticalSpeed = plane.pitch * -34 + lift * 0.32 - PLANE.gravity * 0.28;
  if (plane.speed < PLANE.stallSpeed) { plane.verticalSpeed -= (PLANE.stallSpeed - plane.speed) * 0.55; if (events) events.stalling = true; }
  plane.y += plane.verticalSpeed * dt;
  plane.z += plane.speed * dt * 2.15;
  plane.speed = clampValue(plane.speed, PLANE.minSpeed * 0.6, PLANE.maxSpeed);

  // Ridge shoulders: brushing the valley walls costs hull and speed, never an instant end.
  const wallDist = WORLD.valleyHalfWidth - Math.abs(plane.x);
  if (wallDist < 26 && plane.y < 300) {
    plane.hull = Math.max(35, plane.hull - dt * 9);
    plane.speed = Math.max(PLANE.minSpeed, plane.speed - dt * 7);
    if (events) events.scraping = true;
  }
  if (plane.y > WORLD.ceiling) { plane.y = WORLD.ceiling; plane.verticalSpeed = Math.min(0, plane.verticalSpeed); }
  if (plane.y <= 6) {
    plane.y = 6;
    if (events) events.touchedGround = true;
  }
  return plane;
}
export function headingCardinal(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const d = ((deg % 360) + 360) % 360;
  return dirs[Math.round(d / 45) % 8];
}
