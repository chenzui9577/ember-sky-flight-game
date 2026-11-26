// Ember Sky Post — keyboard and mouse input: pitch, bank, throttle, mail drop and pause, all in one small state object.
export function createInput(target) {
  const keys = new Set();
  const input = {
    keys,
    mouseSteerX: 0,
    mouseSteerY: 0,
    dropPressed: false,
    pausePressed: false,
    consumeDrop() { const v = input.dropPressed; input.dropPressed = false; return v; },
    consumePause() { const v = input.pausePressed; input.pausePressed = false; return v; },
  };
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (e.code === 'Space' && !e.repeat) input.dropPressed = true;
    if (e.code === 'KeyP' && !e.repeat) input.pausePressed = true;
    keys.add(e.code);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());
  target.addEventListener('mousemove', (e) => {
    const r = target.getBoundingClientRect();
    input.mouseSteerX = ((e.clientX - r.left) / r.width - 0.5) * 2;
    input.mouseSteerY = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  target.addEventListener('mouseleave', () => { input.mouseSteerX = 0; input.mouseSteerY = 0; });
  return input;
}
export function readPitchInput(input) {
  let v = 0;
  if (input.keys.has('ArrowDown')) v += 1;
  if (input.keys.has('ArrowUp')) v -= 1;
  return v + input.mouseSteerY * 0.35;
}
export function readRollInput(input) {
  let v = 0;
  if (input.keys.has('ArrowRight')) v += 1;
  if (input.keys.has('ArrowLeft')) v -= 1;
  return v + input.mouseSteerX * 0.45;
}
export function readThrottleInput(input) {
  let v = 0;
  if (input.keys.has('KeyW')) v += 1;
  if (input.keys.has('KeyS')) v -= 1;
  return v;
}
