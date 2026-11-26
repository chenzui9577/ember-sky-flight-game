// Ember Sky Post — tuning constants for the valley, the plane, and the scoring rules.
export const WORLD = {
  courseLength: 9200,
  valleyHalfWidth: 620,
  groundLevel: 0,
  ceiling: 900,
  startAltitude: 260,
  timeLimit: 240,
};
export const PLANE = {
  minSpeed: 28,
  cruiseSpeed: 62,
  maxSpeed: 118,
  startSpeed: 64,
  throttleRate: 26,
  dragPerSecond: 3.2,
  pitchRate: 1.15,
  rollRate: 1.9,
  turnRate: 0.85,
  liftPerSpeed: 0.55,
  gravity: 21,
  stallSpeed: 34,
};
export const SCORE = {
  ringCentre: 300,
  ringEdge: 140,
  comboStep: 50,
  deliveryPerfect: 500,
  deliveryGood: 260,
  landingPerfect: 600,
  landingFirm: 260,
  secondBonus: 4,
};
export const STRINGS = {
  gameTitle: 'Ember Sky Post',
  pilotName: 'Mara Venn',
  farmName: 'Lantern Farm',
  fieldName: 'Ember Field',
};
