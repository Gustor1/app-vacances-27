import { createSprite } from './sprites.js';
import { makeFloatingCompanion } from './floating.js';

const KEY = 'detours-mascot-lab-preferences-v1';
const characters = {
  pico: { name: 'Pico', note: 'Une hirondelle curieuse, toujours prête à repartir.' },
  mochi: { name: 'Mochi', note: 'Un petit explorateur qui prend le temps de s’émerveiller.' },
  bivouac: { name: 'Bivouac', note: 'Tout pour l’aventure, et un peu de place pour les souvenirs.' },
};
// Palette seeds copied from src/palettes.ts. This isolated demo never writes app settings.
const palettes = {
  signature: ['Signature Détours', ['#e8dfd0','#f7f2e9','#f2ebdf','#dce6d8','#3c6e59','#596459','#71806f'], ['#19151b','#27222b','#302a33','#40313d','#e5c39d','#bdb0bd','#8c7e89']],
  porcelaine: ['Porcelaine', ['#e9eeeb','#f8faf8','#eef3ef','#dbe9df','#31634f','#52645a','#728577'], ['#161b19','#222c27','#2a352f','#33483b','#cadbcc','#aebfb3','#7b8f80']],
  eucalyptus: ['Eucalyptus', ['#e8dfd0','#f7f2e9','#f2ebdf','#deeadf','#41755f','#596459','#71806f'], ['#17221e','#24352d','#2c4035','#375342','#b2cfbb','#b4c6ba','#82998a']],
  sauge: ['Graphite & sauge', ['#e3e8dc','#f3f6ee','#eaf0e3','#d5e3cc','#456640','#576650','#74856c'], ['#111614','#1e2722','#26312a','#324538','#b6cdb0','#a9b6a9','#7c8f7b']],
  ocean: ['Nuit océan', ['#e1e9ef','#f3f7f9','#e9f0f5','#d0e4ef','#315d78','#526775','#718695'], ['#182b3a','#263e50','#304b5e','#345268','#a2cdeb','#b7c7cd','#8199aa']],
  glacier: ['Encre & glacier', ['#e4eaf0','#f5f8fb','#ecf2f8','#d9e7f2','#365e7c','#536779','#74879a'], ['#11151b','#202832','#27323e','#304458','#abcbe7','#abb7c3','#7b8e9f']],
  foret: ['Forêt & jade', ['#e2e9df','#f3f7f0','#e9f0e5','#d2e5d8','#2d6554','#4f6559','#6d8575'], ['#132b25','#203c32','#28483d','#335849','#b1cfc0','#b0c6ba','#809d8d']],
  bordeaux: ['Bordeaux & ivoire', ['#efdfdf','#faf2ef','#f4e8e5','#ead3d9','#7b334c','#73565e','#9b747f'], ['#2b1420','#3a2330','#452b3a','#573545','#e1b8b3','#cfb4c0','#a18290']],
  corail: ['Corail', ['#f0dfd3','#fcf3ec','#f5e8dd','#efcfc0','#a3432c','#775b4f','#a07c69'], ['#251a17','#362622','#402e29','#54392f','#e7ac96','#c9b5aa','#a08679']],
  abricot: ['Abricot & encre', ['#f1d8c1','#fcf1e6','#f7e5d4','#eac8a9','#70472f','#705b4c','#9b7b62'], ['#221c18','#322a22','#3c3227','#4d3b2c','#e3bd96','#c7b7a4','#9a8977']],
  soleil: ['Soleil & pétrole', ['#eae4cf','#faf6e9','#f2ecd9','#ecdfb4','#376963','#5b6555','#7a866e'], ['#102a30','#193c41','#23494b','#335b55','#e7c767','#b3c6bd','#809b93']],
  violet: ['Violet origami', ['#eae0ef','#f8f2fa','#f0e6f4','#e2cfe9','#71447d','#6b5672','#92729b'], ['#21182c','#30223f','#3a2b49','#4b355a','#dac0e7','#c3b2ce','#9580a6']],
};
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let preferences = { character: 'pico', palette: 'porcelaine', appearance: 'light', animated: true, visible: true };
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (saved && typeof saved === 'object') preferences = {
    character: Object.hasOwn(characters, saved.character) ? saved.character : 'pico',
    palette: Object.hasOwn(palettes, saved.palette) ? saved.palette : 'porcelaine',
    appearance: saved.appearance === 'dark' ? 'dark' : 'light',
    animated: saved.animated !== false,
    visible: saved.visible !== false,
  };
} catch { /* Unavailable browser storage does not block the demo. */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(preferences)); } catch { /* Session only. */ } };
let currentState = 'idle';
let currentTime = '09:30';
let currentMenu = null;
let lastActionTrigger = null;
const stateLabels = { idle: 'Se repose', greet: 'Te dit bonjour', map: 'Prépare la suite', sleep: 'Fait une pause' };
const floating = makeFloatingCompanion({ element: $('.travel-companion'), trigger: $('#trip-pet'), menu: $('#trip-menu'), closeMenu: () => closeMenu(), onDrop: () => setState('greet') });
const sprites = [$('#hero-sprite'), $('#trip-sprite')].map(element => createSprite(element, { character: preferences.character, accent: palettes[preferences.palette][preferences.appearance === 'dark' ? 2 : 1][4], animated: preferences.animated && !reducedMotion.matches }));
const previewSprites = Object.keys(characters).map(character => createSprite($(`#preview-${character}`), { character, accent: palettes[preferences.palette][preferences.appearance === 'dark' ? 2 : 1][4], animated: false }));
for (const element of [$('#hero-sprite'), $('#trip-sprite')]) {
  element.addEventListener('sprite-statechange', event => {
    // Either visible character may finish first while the other is off screen.
    if (currentState === 'greet' && event.detail?.state === 'idle') setState('idle');
  });
}

for (const [id, palette] of Object.entries(palettes)) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'palette-swatch';
  button.dataset.palette = id;
  button.setAttribute('aria-label', palette[0]);
  button.setAttribute('title', palette[0]);
  button.setAttribute('aria-pressed', String(id === preferences.palette));
  const swatch = document.createElement('span');
  swatch.setAttribute('aria-hidden', 'true');
  swatch.style.setProperty('--swatch', palette[1][4]);
  button.append(swatch);
  $('#palette-buttons').append(button);
}

function announce(message) { $('#announcement').textContent = message; }
function closeMenu(restoreFocus = false) {
  if (!currentMenu) return;
  const trigger = currentMenu.trigger;
  currentMenu.element.hidden = true;
  currentMenu.element.classList.remove('is-below');
  trigger.setAttribute('aria-expanded', 'false');
  currentMenu = null;
  if (restoreFocus) trigger.focus();
}
function syncState(state) {
  currentState = state;
  $('#state-label').textContent = preferences.visible ? stateLabels[state] : 'Masqué';
  $$('button[data-state]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.state === state)));
}
function setState(state) {
  syncState(state);
  sprites.forEach(sprite => sprite.play(state));
}
function applyPreferences() {
  const palette = palettes[preferences.palette];
  const tokens = palette[preferences.appearance === 'dark' ? 2 : 1];
  const root = document.documentElement;
  ['bg','surface','field','selected','accent','muted','line'].forEach((key, index) => root.style.setProperty(`--${key}`, tokens[index]));
  root.style.setProperty('--text', preferences.appearance === 'dark' ? '#f0ede3' : '#253b32');
  root.style.setProperty('--on-accent', preferences.appearance === 'dark' ? '#211c20' : '#faf6ee');
  root.style.colorScheme = preferences.appearance;
  document.querySelector('meta[name="theme-color"]').content = tokens[1];
  root.dataset.appearance = preferences.appearance;
  root.dataset.character = preferences.character;
  $('#character-name').textContent = characters[preferences.character].name;
  $('#character-note').textContent = characters[preferences.character].note;
  $('#click-hint').textContent = preferences.visible ? `Clique sur ${characters[preferences.character].name}` : 'Réactive-le dans les préférences';
  $('#hero-pet').setAttribute('aria-label', `Ouvrir les raccourcis de ${characters[preferences.character].name}`);
  $('#trip-pet').setAttribute('aria-label', `Ouvrir les raccourcis de ${characters[preferences.character].name}, compagnon flottant`);
  $('#palette-label').textContent = palette[0];
  $$('button[data-character]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.character === preferences.character)));
  $$('button[data-palette]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.palette === preferences.palette)));
  $$('button[data-appearance]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.appearance === preferences.appearance)));
  $('#animate').checked = preferences.animated && !reducedMotion.matches;
  $('#animate').disabled = reducedMotion.matches;
  $('#motion-note').textContent = reducedMotion.matches ? 'Mouvements réduits selon ton appareil.' : 'Des mouvements doux et espacés.';
  $('#visible').checked = preferences.visible;
  $('.hero-wrap').hidden = !preferences.visible;
  $('.travel-companion').hidden = !preferences.visible;
  floating.render();
  $('#hidden-pet').hidden = preferences.visible;
  $$('button[data-state]').forEach(button => { button.disabled = !preferences.visible; });
  for (const sprite of sprites) {
    sprite.setCharacter(preferences.character);
    sprite.setAccent(tokens[4]);
    sprite.setAnimated(preferences.animated && preferences.visible && !reducedMotion.matches && !document.hidden);
    sprite.play(currentState);
  }
  previewSprites.forEach(sprite => sprite.setAccent(tokens[4]));
  $('#state-label').textContent = preferences.visible ? stateLabels[currentState] : 'Masqué';
}
function setClock(time) {
  currentTime = time;
  $$('button[data-time]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.time === time)));
  $$('[data-slot]').forEach(item => item.classList.toggle('is-current', item.dataset.slot === time));
  $$('.now-label').forEach(label => { label.textContent = time === 'unknown' ? 'Voir ma journée' : 'En ce moment'; });
  $$('.trip-time').forEach(label => {
    if (!label.dataset.knownTime) label.dataset.knownTime = label.textContent;
    label.textContent = time === 'unknown' ? 'Sans horaire' : label.dataset.knownTime;
  });
  $('#action-panel').hidden = true;
  closeMenu();
}
function addParagraph(text) { const node = document.createElement('p'); node.textContent = text; $('#action-content').append(node); }
function addList(items) { const list = document.createElement('ul'); for (const text of items) { const item = document.createElement('li'); item.textContent = text; list.append(item); } $('#action-content').append(list); }
function showAction(action, trigger) {
  lastActionTrigger = trigger.closest('.pet-menu') ? currentMenu?.trigger : trigger;
  closeMenu();
  $('#action-content').replaceChildren();
  let title;
  if (action === 'now') {
    if (currentTime === 'unknown') {
      title = 'Ta journée, à ton rythme';
      addParagraph('Aucun horaire n’est renseigné dans cette variante. Le compagnon ouvre la journée sans prétendre savoir quelle activité est en cours.');
      addList(['Flâner au marché Nishiki', 'Une pause déjeuner', 'Balade du côté de Yasaka']);
    } else {
      const selected = $(`[data-slot="${currentTime}"]`);
      title = selected.querySelector('strong').textContent;
      addParagraph(`Au programme dans cet exemple à ${currentTime} : ${selected.querySelector('.trip-time').textContent}. Cette heure est simulée ; le calcul réel selon le fuseau du voyage reste à intégrer.`);
      addParagraph(selected.querySelector('p').textContent);
    }
    setState('greet');
  } else if (action === 'ideas') {
    title = 'Quelques idées mises de côté';
    addParagraph('Le compagnon retrouve les idées déjà enregistrées pour Kyoto. Ces exemples n’indiquent ni disponibilité ni temps de trajet.');
    addList(['Se poser au bord de la rivière Kamo', 'Chercher une petite papeterie', 'Faire une pause thé si l’envie est là']);
    setState('map');
  } else {
    title = 'Un coup de main, sans quitter le voyage';
    addParagraph('Dans Détours, ce raccourci ouvrira l’assistant existant. Ici, il montre seulement les pistes possibles :');
    addList(['Retrouver une adresse enregistrée', 'Préparer une modification du programme', 'Revoir les choses à emporter']);
    addParagraph('Aucune IA n’est appelée et aucune modification n’est appliquée dans cette démonstration.');
    setState('map');
  }
  $('#action-heading').textContent = title;
  $('#action-panel').hidden = false;
  $('#action-heading').focus({ preventScroll: true });
  $('#action-panel').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'nearest' });
  announce(title);
}
for (const id of ['hero', 'trip']) {
  const trigger = $(`#${id}-pet`);
  const element = $(`#${id}-menu`);
  trigger.addEventListener('click', () => {
    const wasOpen = currentMenu?.trigger === trigger;
    closeMenu();
    if (wasOpen) return;
    setState('greet');
    element.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    currentMenu = { trigger, element };
    if (id === 'trip') floating.placeMenu();
    if (id === 'hero') {
      const margin = 12;
      if (element.getBoundingClientRect().top < margin) element.classList.add('is-below');
      const bounds = element.getBoundingClientRect();
      if (bounds.top < margin || bounds.bottom > window.innerHeight - margin) element.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    }
    element.querySelector('button').focus({ preventScroll: true });
  });
}
document.addEventListener('click', event => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest('button');
  if (button?.dataset.character) {
    closeMenu(); preferences.character = button.dataset.character; currentState = 'idle'; applyPreferences(); setState('idle'); save();
    announce(`${characters[preferences.character].name} t’accompagne.`);
  } else if (button?.dataset.palette) {
    preferences.palette = button.dataset.palette; applyPreferences(); save();
  } else if (button?.dataset.appearance) {
    preferences.appearance = button.dataset.appearance; applyPreferences(); save();
  } else if (button?.dataset.state) {
    closeMenu(); setState(button.dataset.state);
  } else if (button?.dataset.time) {
    setClock(button.dataset.time);
  } else if (button?.dataset.action) {
    showAction(button.dataset.action, button);
  }
  if (currentMenu && !currentMenu.element.contains(event.target) && !currentMenu.trigger.contains(event.target)) closeMenu();
});
document.addEventListener('keydown', event => { if (event.key === 'Escape' && currentMenu) { closeMenu(true); event.preventDefault(); } });
document.addEventListener('focusin', event => { if (currentMenu && !currentMenu.element.contains(event.target) && !currentMenu.trigger.contains(event.target)) closeMenu(); });
$('#animate').addEventListener('change', () => { preferences.animated = $('#animate').checked; applyPreferences(); save(); });
$('#visible').addEventListener('change', () => { closeMenu(); preferences.visible = $('#visible').checked; applyPreferences(); save(); announce(preferences.visible ? 'Compagnon affiché.' : 'Compagnon masqué. Les raccourcis du carnet restent disponibles.'); });
$('#reset-position').addEventListener('click', () => { closeMenu(); floating.reset(); announce('Compagnon replacé sur le côté.'); });
$('#close-panel').addEventListener('click', () => { $('#action-panel').hidden = true; (lastActionTrigger?.isConnected && lastActionTrigger.getClientRects().length ? lastActionTrigger : $('.trip-navigation button')).focus(); });
reducedMotion.addEventListener('change', applyPreferences);
document.addEventListener('visibilitychange', () => sprites.forEach(sprite => sprite.setAnimated(preferences.animated && preferences.visible && !reducedMotion.matches && !document.hidden)));
window.addEventListener('pagehide', event => { if (!event.persisted) [...sprites, ...previewSprites].forEach(sprite => sprite.destroy()); });
applyPreferences();
setClock(currentTime);
