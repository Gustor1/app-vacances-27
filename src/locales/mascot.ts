const rows: [string, string, string, string][] = [
  ['Choisir la mascotte', 'Choose the mascot', '选择吉祥物', 'Elegir la mascota'],
  ['Animer la mascotte', 'Animate the mascot', '播放吉祥物动画', 'Animar la mascota'],
  ['Ouvrir les raccourcis de la mascotte', 'Open mascot shortcuts', '打开吉祥物快捷操作', 'Abrir accesos de la mascota'],
  ['Raccourcis', 'Shortcuts', '快捷操作', 'Accesos rápidos'],
  ['Déplace la mascotte avec le doigt ou la souris. Au clavier : Maj + flèches.', 'Drag the mascot with your finger or mouse. Keyboard: Shift + arrows.', '用手指或鼠标拖动吉祥物。键盘：Shift + 方向键。', 'Arrastra la mascota con el dedo o el ratón. Teclado: Mayús + flechas.'],
  ['Afficher la mascotte', 'Show the mascot', '显示吉祥物', 'Mostrar la mascota'],
  ['Une hirondelle discrète pour les premiers pas, la relecture et le hors-ligne. Ce choix reste personnel sur cet appareil.', 'A quiet swallow for first steps, review and offline preparation. This choice stays personal on this device.', '小燕子在初次使用、检查导入和离线准备时提供提示。此设置仅保存在本设备，属于个人偏好。', 'Una golondrina discreta para los primeros pasos, la revisión y la preparación sin conexión. Esta elección es personal en este dispositivo.'],
  ['Un premier détour ? Crée ton carnet ou pars d’un planning à vérifier.', 'Your first detour? Create a notebook or start with a plan to review.', '第一次启程？创建手册，或从待检查的行程开始。', '¿Tu primer desvío? Crea un cuaderno o empieza con un plan para revisar.'],
  ['Un passage demande ta relecture. Compare avec la source avant de créer le carnet.', 'A passage needs your review. Compare it with the source before creating the notebook.', '有一段内容需要检查。创建手册前请对照原文。', 'Un pasaje necesita tu revisión. Compáralo con la fuente antes de crear el cuaderno.'],
  ['Cette copie du carnet et l’application sont disponibles hors ligne ici. Les liens et cartes de rues demandent Internet ; garde aussi une sauvegarde.', 'This copy of the notebook and the app are available offline here. Links and street maps need Internet; keep a backup too.', '此手册副本和应用已可在本设备离线使用。链接和街道地图需要网络；请另存备份。', 'Esta copia del cuaderno y la aplicación están disponibles sin conexión aquí. Los enlaces y mapas de calles requieren Internet; guarda también una copia de seguridad.'],
  ['La mascotte suit ton choix pour cette session, mais son réglage n’a pas pu être sauvegardé. Réessaie dans Préférences.', 'The mascot follows your choice for this session, but its setting could not be saved. Try again in Preferences.', '吉祥物设置在本次使用中有效，但未能保存。请在偏好设置中重试。', 'La mascota respeta tu elección durante esta sesión, pero no se pudo guardar el ajuste. Vuelve a intentarlo en Preferencias.'],
];
export function mascotDictionary(index: number): Record<string, string> { return Object.fromEntries(rows.map(row => [row[0], row[index + 1]])); }
