// Ember Sky Post — WebAudio sound made on the spot: engine hum, ring chimes, a soft thud for the mail pouch, and a landing sigh. No audio files.
export function createAudioEngine() {
  let ctx = null;
  let engineOsc = null;
  let engineGain = null;
  function ensureContext() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    engineOsc = ctx.createOscillator();
    engineGain = ctx.createGain();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 72;
    engineGain.gain.value = 0.0;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 420;
    engineOsc.connect(filter); filter.connect(engineGain); engineGain.connect(ctx.destination);
    engineOsc.start();
    return ctx;
  }
  function tone(freq, dur, type, vol, slideTo) {
    const c = ensureContext(); if (!c) return;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.12, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  }
  return {
    startEngine() { ensureContext(); },
    setEngine(speedRatio) {
      if (!ctx || !engineOsc) return;
      engineOsc.frequency.value = 58 + speedRatio * 68;
      engineGain.gain.value = 0.015 + speedRatio * 0.03;
    },
    stopEngine() { if (engineGain) engineGain.gain.value = 0; },
    ringChime(combo) { tone(620 + combo * 60, 0.28, 'sine', 0.14, 940 + combo * 70); tone(930 + combo * 60, 0.4, 'triangle', 0.08); },
    missWhoosh() { tone(220, 0.3, 'sine', 0.07, 110); },
    dropThud() { tone(180, 0.22, 'triangle', 0.16, 70); },
    deliverChime() { tone(523, 0.2, 'sine', 0.13); setTimeout(() => tone(784, 0.34, 'sine', 0.13), 110); },
    landingSigh() { tone(330, 0.5, 'sine', 0.1, 196); },
    bump() { tone(90, 0.25, 'square', 0.12, 55); },
  };
}
