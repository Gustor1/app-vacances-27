// Unit-level pointer sequences; real browser rendering is checked separately.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeFloatingCompanion } from './floating.js';

test('floating companion: taps, drag threshold, cancellation, bounds and persistence', () => {
  const storage = new Map();
  const windowListeners = new Map();
  globalThis.window = { addEventListener: (name, fn) => windowListeners.set(name, fn) };
  globalThis.innerWidth = 800; globalThis.innerHeight = 600;
  globalThis.localStorage = { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) };
  const listeners = new Map(), classes = new Set();
  const element = { hidden: false, style: {}, classList: { add: name => classes.add(name), remove: name => classes.delete(name) }, getBoundingClientRect() { return { left: parseFloat(this.style.left) || 0, top: parseFloat(this.style.top) || 0, bottom: (parseFloat(this.style.top) || 0) + 100, width: 100, height: 100 }; } };
  let capture = null, drops = 0, closed = 0;
  const trigger = { addEventListener: (name, fn) => listeners.set(name, fn), setPointerCapture: id => { capture = id; }, hasPointerCapture: id => capture === id, releasePointerCapture: () => { capture = null; }, getBoundingClientRect: () => element.getBoundingClientRect() };
  const menu = { hidden: true, style: {}, getBoundingClientRect: () => ({ width: 242, height: 188 }) };
  const floating = makeFloatingCompanion({ element, trigger, menu, closeMenu: () => { closed++; menu.hidden = true; }, onDrop: () => { drops++; } });
  const send = (type, values = {}) => {
    const event = { pointerId: 1, isPrimary: true, button: 0, clientX: 720, clientY: 470, detail: 1, prevented: false, stopped: false, preventDefault() { this.prevented = true; }, stopImmediatePropagation() { this.stopped = true; }, ...values };
    listeners.get(type)(event); return event;
  };
  floating.render();
  const initial = { ...element.style };
  send('pointerdown'); send('pointermove', { clientX: 723 }); send('pointerup');
  assert.equal(send('click').stopped, false, 'small movement stays a click');
  assert.deepEqual(element.style, initial);
  send('pointerdown'); send('pointermove', { clientX: 400, clientY: 300 }); send('pointerup');
  assert.equal(send('click').stopped, true, 'drop must not open the menu');
  assert.equal(drops, 1); assert.ok(closed > 0);
  assert.ok(storage.has('detours-mascot-lab-position-v1'));
  const moved = { ...element.style };
  send('pointerdown'); send('pointermove', { clientX: 100 }); send('pointercancel');
  assert.deepEqual(element.style, moved, 'cancel restores the starting position');
  assert.equal(capture, null);
  send('pointerdown'); send('pointermove', { clientX: -1000, clientY: -1000 }); send('pointerup');
  assert.equal(element.style.left, '12px'); assert.equal(element.style.top, '12px');
  assert.equal(send('click', { detail: 0 }).stopped, false, 'keyboard activation is never swallowed');
  send('keydown', { shiftKey: true, key: 'ArrowRight' });
  assert.equal(element.style.left, '36px');
  menu.hidden = false; floating.placeMenu();
  assert.equal(menu.style.top, '120px', 'menu flips below a pet near the top edge');
  innerWidth = 320; innerHeight = 480; windowListeners.get('resize')();
  const rect = element.getBoundingClientRect();
  assert.ok(rect.left >= 12 && rect.left + 100 <= 308);
  assert.ok(rect.top >= 12 && rect.top + 100 <= 468);
  floating.reset();
  assert.equal(element.style.left, '208px');
  assert.equal(classes.has('is-dragging'), false);
});

