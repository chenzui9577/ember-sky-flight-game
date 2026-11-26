// Ember Sky Post — scoring: ring centres, combo chains, mail-drop accuracy, landing kindness, and the three-star verdict.
import { SCORE } from './config.js';

export function createScoreCard() {
  return { score: 0, ringsHit: 0, ringsMissed: 0, combo: 0, bestCombo: 0, delivered: false, deliveryQuality: '', landed: false, landingQuality: '', timeLeft: 0 };
}
export function scoreRingPass(card, centreOffsetRatio) {
  card.combo += 1;
  card.bestCombo = Math.max(card.bestCombo, card.combo);
  const centre = centreOffsetRatio < 0.38;
  const pts = (centre ? SCORE.ringCentre : SCORE.ringEdge) + (card.combo - 1) * SCORE.comboStep;
  card.score += pts; card.ringsHit += 1;
  return { points: pts, centre };
}
export function scoreRingMiss(card) {
  card.combo = 0; card.ringsMissed += 1;
}
export function scoreDelivery(card, distanceRatio) {
  card.delivered = true;
  if (distanceRatio < 0.35) { card.deliveryQuality = 'Right on the farmhouse doorstep'; card.score += SCORE.deliveryPerfect; return SCORE.deliveryPerfect; }
  if (distanceRatio < 0.8) { card.deliveryQuality = 'In the farmyard — the dog approves'; card.score += SCORE.deliveryGood; return SCORE.deliveryGood; }
  card.deliveryQuality = 'In the field nearby — close enough at dusk'; card.score += 90; return 90;
}
export function scoreLanding(card, plane, onStrip) {
  card.landed = true;
  const gentle = Math.abs(plane.verticalSpeed) < 9 && plane.speed < 58 && Math.abs(plane.roll) < 0.22;
  if (onStrip && gentle) { card.landingQuality = 'A feather would be jealous'; card.score += SCORE.landingPerfect; return SCORE.landingPerfect; }
  if (onStrip) { card.landingQuality = 'Firm, honest, and in one piece'; card.score += SCORE.landingFirm; return SCORE.landingFirm; }
  card.landingQuality = 'Down safely in the meadow grass'; card.score += 80; return 80;
}
export function starRating(card) {
  let stars = 1;
  if (card.ringsHit >= 4 && card.delivered) stars = 2;
  if (card.ringsHit >= 5 && card.delivered && card.landingQuality.includes('feather')) stars = 3;
  else if (card.ringsHit >= 6 && card.delivered && card.landed) stars = 3;
  return stars;
}
export function verdictLine(card) {
  if (!card.delivered && !card.landed) return 'The valley kept its letters tonight. Fly again, Mara — dawn is patient.';
  if (!card.delivered) return 'Down safe, but the pouch never fell. Lantern Farm will wait one more night.';
  if (card.landingQuality.includes('feather')) return 'The lighthouse keeper waves. Every letter made it home, and the landing was poetry.';
  return 'Mail delivered and home before dark. The valley settles in, smelling of rain and woodsmoke.';
}
