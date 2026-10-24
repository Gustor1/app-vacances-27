// App sprite player: original atlases stay intact. Theme accents are rendered locally.
const assets = new Map();
const names = ['pico', 'mochi', 'bivouac'];
const sequences = {
  idle: [[0, 3600], [1, 85], [2, 110], [3, 1400], [4, 800], [5, 3400]],
  greet: [[6, 100], [7, 150], [8, 160], [9, 320], [10, 150], [11, 240]],
  map: [[12, 220], [13, 250], [14, 1400], [15, 1700], [16, 1800]],
  sleep: [[18, 500], [19, 650], [20, 1100], [21, 1800], [22, 1800], [23, 1800]],
};
const stillFrames = { idle: 0, greet: 9, map: 14, sleep: 21 };

function runs(values, gap = 8) {
  const ranges = []; let start = -1; let last = -1;
  for (let i = 0; i < values.length; i++) {
    if (!values[i]) continue;
    if (start < 0) start = i;
    else if (i - last > gap) { ranges.push([start, last + 1]); start = i; }
    last = i;
  }
  if (start >= 0) ranges.push([start, last + 1]);
  return ranges;
}

async function loadAtlas(character) {
  if (assets.has(character)) return assets.get(character);
  const pending = (async () => {
    const image = new Image(); image.src = new URL(`./assets/${character}.png`, import.meta.url).href;
    await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext('2d', { willReadFrequently: true }); context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    // Locate actual transparent gutters, including frames crossing a nominal grid line.
    const rows = new Uint8Array(canvas.height);
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
      if (pixels.data[(y * canvas.width + x) * 4 + 3] > 190) { rows[y] = 1; break; }
    }
    const rowRuns = runs(rows);
    if (rowRuns.length !== 4) throw new Error(`Atlas ${character}: ${rowRuns.length} rows, expected 4`);
    const frames = [];
    for (const [top, bottom] of rowRuns) {
      const columns = new Uint8Array(canvas.width);
      for (let x = 0; x < canvas.width; x++) for (let y = top; y < bottom; y++) {
        if (pixels.data[(y * canvas.width + x) * 4 + 3] > 190) { columns[x] = 1; break; }
      }
      const columnRuns = runs(columns, 5);
      if (columnRuns.length !== 6) throw new Error(`Atlas ${character}: ${columnRuns.length} columns, expected 6`);
      for (const [left, right] of columnRuns) {
        let minY = bottom, maxY = top;
        for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
          if (pixels.data[(y * canvas.width + x) * 4 + 3] > 190) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
        }
        frames.push({ x: Math.max(0, left - 1), y: Math.max(0, minY - 1), w: right - left + 2, h: maxY - minY + 3 });
      }
    }
    return { canvas, pixels, frames, scale: 220 / Math.max(...frames.map(frame => Math.max(frame.w, frame.h))), colors: new Map() };
  })();
  assets.set(character, pending); return pending;
}

function coloredAtlas(atlas, accent) {
  if (!/^#[0-9a-f]{6}$/i.test(accent)) return atlas.canvas;
  if (atlas.colors.has(accent)) return atlas.colors.get(accent);
  const target = accent.slice(1).match(/../g).map(v => parseInt(v, 16));
  const output = document.createElement('canvas'); output.width = atlas.canvas.width; output.height = atlas.canvas.height;
  const context = output.getContext('2d');
  const data = new Uint8ClampedArray(atlas.pixels.data);
  for (let p = 0; p < data.length; p += 4) {
    if (data[p + 3] < 30) continue;
    const [r, g, b] = [data[p], data[p + 1], data[p + 2]].map(v => v / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
    if (delta < .12 || delta / max < .35) continue;
    let hue = max === r ? (g - b) / delta : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
    hue = (hue * 60 + 360) % 360;
    if (hue < 150 || hue > 205) continue;
    const shade = max / .70;
    for (let c = 0; c < 3; c++) data[p + c] = shade <= 1 ? target[c] * shade : target[c] + (255 - target[c]) * Math.min(.55, (shade - 1) * .65);
  }
  context.putImageData(new ImageData(data, output.width, output.height), 0, 0);
  // Limit palette cache: source + 4 variants per character, independent of clicks.
  if (atlas.colors.size >= 4) atlas.colors.delete(atlas.colors.keys().next().value);
  atlas.colors.set(accent, output); return output;
}

export function createSprite(element, { character = 'pico', accent = '#31634f', animated = true } = {}) {
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'display:block;width:100%;height:100%;object-fit:contain;image-rendering:pixelated;';
  element.replaceChildren(canvas);
  const trigger = element.closest('button.pet-button');
  const context = canvas.getContext('2d'); context.imageSmoothingEnabled = false;
  let atlas, colored, state = 'idle', index = 0, timer, destroyed = false, generation = 0, inView = true;
  let activeCharacter, activeAccent = accent, animationEnabled = animated;
  function draw() {
    if (!atlas || destroyed) return;
    const frameIndex = animationEnabled ? sequences[state][index][0] : stillFrames[state];
    const frame = atlas.frames[frameIndex];
    const width = Math.round(frame.w * atlas.scale), height = Math.round(frame.h * atlas.scale);
    const jump = state === 'greet' && animationEnabled ? [0, 0, 6, 14, 3, 0][index] : 0;
    context.clearRect(0, 0, 256, 256);
    const left = Math.round((256 - width) / 2), top = 238 - height - jump;
    context.drawImage(colored || atlas.canvas, frame.x, frame.y, frame.w, frame.h, left, top, width, height);
    // Restrict pointer hit testing to the drawn pose, with a small touch margin.
    // clip-path on the button lets empty space pass through to the page below.
    if (trigger) {
      const margin = 8; // About 3 CSS px for the small floating companion.
      const inset = [top - margin, 256 - left - width - margin, 256 - top - height - margin, left - margin];
      trigger.style.clipPath = `inset(${inset.map(value => `${Math.max(0, value) / 256 * 100}%`).join(' ')})`;
    }
    element.dataset.frame = String(frameIndex); element.dataset.state = state;
  }
  function schedule() {
    clearTimeout(timer);
    if (destroyed || !atlas || !animationEnabled || document.hidden || !inView) return;
    timer = setTimeout(() => {
      index++;
      if (index >= sequences[state].length) {
        if (state === 'greet') {
          state = 'idle'; index = 0;
          element.dispatchEvent(new CustomEvent('sprite-statechange', { detail: { state } }));
        } else index = state === 'map' ? 2 : state === 'sleep' ? 3 : 0;
      }
      draw(); schedule();
    }, sequences[state][index][1]);
  }
  async function setCharacter(next) {
    if (!names.includes(next) || next === activeCharacter || destroyed) return;
    activeCharacter = next; const token = ++generation; clearTimeout(timer); atlas = null;
    element.dataset.ready = 'loading'; context.clearRect(0, 0, 256, 256);
    if (trigger) trigger.style.clipPath = 'inset(50%)';
    try {
      const loaded = await loadAtlas(next);
      if (token !== generation || destroyed) return;
      atlas = loaded; colored = coloredAtlas(atlas, activeAccent); index = 0;
      element.dataset.ready = 'true'; draw(); schedule();
    } catch (error) {
      if (token !== generation || destroyed) return;
      element.dataset.ready = 'error'; if (trigger) trigger.style.clipPath = '';
      console.error(error);
    }
  }
  function setAccent(next) {
    if (next === activeAccent) return;
    activeAccent = next;
    if (atlas) { colored = coloredAtlas(atlas, activeAccent); draw(); }
  }
  function play(next) {
    if (!Object.hasOwn(sequences, next) || destroyed) return;
    state = next; index = 0; draw(); schedule();
  }
  function setAnimated(next) { animationEnabled = Boolean(next); draw(); schedule(); }
  function visibility() { schedule(); }
  document.addEventListener('visibilitychange', visibility);
  const observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; schedule(); });
  observer.observe(element);
  setCharacter(character);
  return { setCharacter, setAccent, play, setAnimated, destroy() { destroyed = true; generation++; clearTimeout(timer); observer.disconnect(); document.removeEventListener('visibilitychange', visibility); element.replaceChildren(); } };
}
