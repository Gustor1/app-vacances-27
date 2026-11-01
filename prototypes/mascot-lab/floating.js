// Floating companion, confined to the web app's viewport (not the OS desktop).
export function makeFloatingCompanion({ element, trigger, menu, closeMenu, onDrop }) {
  const key = 'detours-mascot-lab-position-v1';
  let position = { x: 1, y: .86 };
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) position = saved;
  } catch { /* Position remains usable without storage. */ }
  let gesture = null, suppressClick = false;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const viewport = () => ({ left: window.visualViewport?.offsetLeft || 0, top: window.visualViewport?.offsetTop || 0, width: window.visualViewport?.width || innerWidth, height: window.visualViewport?.height || innerHeight });
  const bounds = () => {
    const view = viewport();
    const rect = element.getBoundingClientRect();
    return { left: view.left + 12, top: view.top + 12, width: Math.max(0, view.width - rect.width - 24), height: Math.max(0, view.height - rect.height - 24) };
  };
  const save = () => { try { localStorage.setItem(key, JSON.stringify(position)); } catch { /* Session only. */ } };
  function placeMenu() {
    if (menu.hidden) return;
    const view = viewport(), pet = trigger.getBoundingClientRect();
    menu.style.maxHeight = `${Math.max(64, view.height - 24)}px`;
    menu.style.width = `${Math.min(242, view.width - 24)}px`;
    const size = menu.getBoundingClientRect();
    const top = pet.top - size.height - 8;
    menu.style.left = `${clamp(pet.left + pet.width / 2 - size.width / 2, view.left + 12, view.left + view.width - size.width - 12)}px`;
    menu.style.top = `${clamp(top >= view.top + 12 ? top : pet.bottom + 8, view.top + 12, view.top + view.height - size.height - 12)}px`;
  }
  function render() {
    if (element.hidden) return;
    const area = bounds();
    position = { x: clamp(position.x, 0, 1), y: clamp(position.y, 0, 1) };
    element.style.left = `${area.left + position.x * area.width}px`;
    element.style.top = `${area.top + position.y * area.height}px`;
    placeMenu();
  }
  function move(left, top) {
    const area = bounds();
    position = { x: area.width ? clamp((left - area.left) / area.width, 0, 1) : 0, y: area.height ? clamp((top - area.top) / area.height, 0, 1) : 0 };
    render();
  }
  function cancel() {
    if (!gesture) return;
    const previous = gesture;
    gesture = null;
    position = previous.position;
    element.classList.remove('is-dragging');
    render();
    if (trigger.hasPointerCapture(previous.id)) trigger.releasePointerCapture(previous.id);
  }
  trigger.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || gesture) return;
    suppressClick = false;
    const rect = element.getBoundingClientRect();
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, position: { ...position }, moved: false };
    trigger.setPointerCapture(event.pointerId);
  });
  trigger.addEventListener('pointermove', event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    if (!gesture.moved && Math.hypot(dx, dy) < 7) return;
    gesture.moved = true; suppressClick = true;
    closeMenu(); element.classList.add('is-dragging');
    move(gesture.left + dx, gesture.top + dy);
  });
  trigger.addEventListener('pointerup', event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const moved = gesture.moved;
    gesture = null; element.classList.remove('is-dragging');
    if (trigger.hasPointerCapture(event.pointerId)) trigger.releasePointerCapture(event.pointerId);
    if (moved) { save(); onDrop(); }
  });
  trigger.addEventListener('pointercancel', cancel);
  trigger.addEventListener('lostpointercapture', cancel);
  trigger.addEventListener('click', event => {
    if (suppressClick && event.detail !== 0) { suppressClick = false; event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  trigger.addEventListener('keydown', event => {
    if (event.key === 'Escape' && gesture) { cancel(); event.preventDefault(); return; }
    const directions = { ArrowLeft: [-24, 0], ArrowRight: [24, 0], ArrowUp: [0, -24], ArrowDown: [0, 24] };
    if (!event.shiftKey || !directions[event.key]) return;
    event.preventDefault(); closeMenu();
    const rect = element.getBoundingClientRect(), [dx, dy] = directions[event.key];
    move(rect.left + dx, rect.top + dy); save();
  });
  window.addEventListener('resize', render);
  window.visualViewport?.addEventListener('resize', render);
  window.visualViewport?.addEventListener('scroll', render);
  return { render, placeMenu, reset() { cancel(); position = { x: 1, y: .86 }; render(); save(); } };
}
