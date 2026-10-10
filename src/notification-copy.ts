type Language = 'fr' | 'en' | 'es' | 'zh-CN';

// Personal notification UI copy is separate from the shared journal translations.
const copy = {
  disableDevice: ['Désactiver cet appareil', 'Disable this device', 'Desactivar este dispositivo', '停用此设备'],
  disableAll: ['Désactiver tous mes appareils', 'Disable all my devices', 'Desactivar todos mis dispositivos', '停用我的所有设备'],
  dateMissing: ['Date à renseigner', 'Date needed', 'Falta la fecha', '请填写日期'],
  quantity: ['Durée personnalisée', 'Custom duration', 'Duración personalizada', '自定义时长'],
  unit: ['Unité de durée', 'Duration unit', 'Unidad de duración', '时长单位'],
  minutes: ['Minutes', 'Minutes', 'Minutos', '分钟'],
  hours: ['Heures', 'Hours', 'Horas', '小时'],
  days: ['Jours (24 heures)', 'Days (24 hours)', 'Días (24 horas)', '天（24小时）'],
  addDelay: ['Ajouter ce délai', 'Add this offset', 'Añadir esta antelación', '添加此提前时间'],
  title: ['Mes récaps', 'My recaps', 'Mis resúmenes', '我的每日概要'],
  close: ['Fermer', 'Close', 'Cerrar', '关闭'],
  today: ['Aujourd’hui', 'Today', 'Hoy', '今天'],
  tomorrow: ['Demain', 'Tomorrow', 'Mañana', '明天'],
  history: ['Historique (30 jours)', 'History (30 days)', 'Historial (30 días)', '历史（30天）'],
  empty: ['Aucun programme pour cette date.', 'No program for this date.', 'No hay programa para esta fecha.', '此日期没有行程。'],
  unread: ['Récap disponible non lu', 'Unread recap available', 'Resumen disponible sin leer', '有未读概要'],
  missingTarget: ['Cet élément du voyage n’est plus disponible.', 'This trip item is no longer available.', 'Este elemento del viaje ya no está disponible.', '此行程项目已不可用。'],
  changed: ['Programme modifié depuis le récap du soir.', 'Program changed since the evening recap.', 'Programa modificado desde el resumen nocturno.', '行程在晚间概要后发生了变化。'],
  day: ['Voir la journée', 'View day', 'Ver el día', '查看当天'],
  settings: ['Mes préférences pour ce voyage', 'My preferences for this trip', 'Mis preferencias para este viaje', '此旅程的个人偏好'],
  timezone: ['Fuseau du récap (IANA)', 'Recap time zone (IANA)', 'Zona horaria del resumen (IANA)', '概要时区（IANA）'],
  timezoneMissing: ['Renseigne un fuseau fiable pour Aujourd’hui et Demain.', 'Set a reliable time zone for Today and Tomorrow.', 'Indica una zona horaria fiable para Hoy y Mañana.', '请设置可靠时区以显示今天和明天。'],
  time: ['Heure du récap la veille', 'Recap time on the previous day', 'Hora del resumen del día anterior', '前一天的概要时间'],
  follow: ['Suivre ce voyage pour les envois', 'Follow this trip for deliveries', 'Seguir este viaje para los envíos', '为此旅程启用发送'],
  offsets: ['Délais (minutes, 5 maximum ; 1440 = 24 h)', 'Offsets (minutes, at most 5; 1440 = 24 h)', 'Antelación (minutos, máximo 5; 1440 = 24 h)', '提前时间（分钟，最多5项；1440为24小时）'],
  categories: ['Types d’activités', 'Activity types', 'Tipos de actividades', '活动类别'],
  push: ['Rappels d’activités sur cet appareil', 'Activity reminders on this device', 'Recordatorios de actividades en este dispositivo', '在此设备上接收活动提醒'],
  recapPush: ['Push : le programme de demain est prêt', 'Push: tomorrow’s program is ready', 'Push: el programa de mañana está listo', '推送：明天的行程已就绪'],
  email: ['Email quotidien à mon adresse vérifiée', 'Daily email to my verified address', 'Email diario a mi dirección verificada', '发送每日邮件至已验证邮箱'],
  unavailable: ['Les canaux distants ne sont pas configurés ou activés. Les récaps restent disponibles ici.', 'Remote channels are not configured or enabled. Recaps remain available here.', 'Los canales remotos no están configurados o activados. Los resúmenes siguen disponibles aquí.', '远程渠道尚未配置或启用，仍可在此查看概要。'],
  deferred: ['Hors ligne, les changements du planning ne peuvent pas annuler un envoi que le serveur ignore.', 'Offline planning changes cannot cancel a delivery the server does not know about.', 'Los cambios sin conexión no pueden cancelar un envío que el servidor desconoce.', '离线行程变更无法取消服务器尚未知晓的发送。'],
  local: ['Ces réglages sont personnels, pour ce voyage et ce compte ou espace local.', 'These settings are personal to this trip and account or local space.', 'Estos ajustes son personales para este viaje y cuenta o espacio local.', '这些设置仅属于此旅程及当前账户或本地空间。'],
  save: ['Enregistrer', 'Save', 'Guardar', '保存'],
  saved: ['Préférences enregistrées.', 'Preferences saved.', 'Preferencias guardadas.', '偏好已保存。'],
  error: ['Impossible d’enregistrer. Vérifie le fuseau, les délais et la connexion. Les canaux ne sont pas activés.', 'Could not save. Check the time zone, offsets and connection. Channels were not enabled.', 'No se pudo guardar. Comprueba la zona horaria, la antelación y la conexión. Los canales no se activaron.', '保存失败，请检查时区、提前时间及网络。渠道未启用。'],
  storageError: ['Cache personnel illisible ou sauvegarde impossible. La source est conservée.', 'Personal cache is unreadable or cannot be saved. The source is preserved.', 'La caché personal es ilegible o no se puede guardar. Se conserva el original.', '个人缓存无法读取或保存，原始数据已保留。'],
  weather: ['Météo du programme', 'Program weather', 'Tiempo del programa', '行程所在地天气'],
  weatherLoad: ['Charger la météo', 'Load weather', 'Cargar el tiempo', '加载天气'],
  weatherInfo: ['Les coordonnées du programme sont envoyées à Open-Meteo à ta demande. Sans GPS. Prévisions jusqu’à 16 jours.', 'Program coordinates are sent to Open-Meteo at your request. No GPS. Forecasts up to 16 days.', 'Las coordenadas del programa se envían a Open-Meteo cuando lo solicitas. Sin GPS. Previsiones hasta 16 días.', '仅在你请求时向Open-Meteo发送行程坐标，无需GPS，最多预报16天。'],
  weatherMissing: ['Prévisions indisponibles pour tout ou partie du programme.', 'Forecasts unavailable for all or part of the program.', 'Previsiones no disponibles para todo o parte del programa.', '部分或全部行程无法获取预报。'],
  stale: ['Données en cache : elles peuvent être périmées.', 'Cached data: it may be outdated.', 'Datos en caché: pueden estar desactualizados.', '缓存数据可能已过期。'],
  updated: ['Consulté le', 'Fetched on', 'Consultado el', '获取时间'],
  checklist: ['Affaires conseillées', 'Suggested items', 'Objetos recomendados', '建议携带'],
  checklistInfo: ['Conseils dérivés du programme : pluie ≥ 50 %, UV ≥ 3 à l’extérieur, marche déclarée. Les coches de valise ne sont pas modifiées.', 'Suggestions based on the program: rain ≥ 50%, UV ≥ 3 outdoors, declared walking. Packing checkmarks are unchanged.', 'Consejos según el programa: lluvia ≥ 50%, UV ≥ 3 al aire libre, caminata declarada. No se modifican las marcas de equipaje.', '根据行程建议：降雨概率≥50%、户外紫外线≥3或安排步行。不会修改行李勾选状态。'],
  reminder: ['Mon rappel', 'My reminder', 'Mi recordatorio', '我的提醒'],
  default: ['Selon mes préférences', 'Use my preferences', 'Según mis preferencias', '使用个人偏好'],
  off: ['Désactivé', 'Off', 'Desactivado', '关闭'],
  custom: ['Personnalisé', 'Custom', 'Personalizado', '自定义'],
  noTime: ['Pas d’horaire précis et de fuseau fiable : aucun rappel horaire. Voir la journée pour renseigner le planning avec les droits nécessaires.', 'No precise time and reliable time zone: no timed reminder. View the day to edit the program if authorized.', 'Sin hora precisa y zona horaria fiable: no hay recordatorio horario. Abre el día para editar el programa si tienes permiso.', '缺少准确时间或可靠时区，无法定时提醒。有权限时可打开当天编辑行程。'],
  booked: ['Réservé', 'Booked', 'Reservado', '已预订'],
  done: ['Fait : aucun rappel', 'Done: no reminder', 'Hecho: sin recordatorio', '已完成，不提醒'],
  loading: ['Chargement…', 'Loading…', 'Cargando…', '加载中…'],
  rain: ['Pluie', 'Rain', 'Lluvia', '降雨'],
  'Protection contre la pluie': ['Protection contre la pluie', 'Rain protection', 'Protección contra la lluvia', '雨具'],
  'Protection solaire': ['Protection solaire', 'Sun protection', 'Protección solar', '防晒用品'],
  'Chaussures adaptées à la marche': ['Chaussures adaptées à la marche', 'Suitable walking shoes', 'Calzado para caminar', '适合步行的鞋'],
} as const;
export type NotificationCopyKey = keyof typeof copy;
export function notificationCopy(language: Language, key: NotificationCopyKey) {
  const index = { fr: 0, en: 1, es: 2, 'zh-CN': 3 }[language];
  return copy[key][index];
}
export function checklistCopy(language: Language, text: string) {
  return text in copy ? notificationCopy(language, text as NotificationCopyKey) : text;
}
