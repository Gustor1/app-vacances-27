const rows = [
  [
    "Départ demain",
    "Departure tomorrow",
    "明天出发",
    "Salida mañana"
  ],
  [
    "Départ dans {count} jours",
    "Departure in {count} days",
    "距出发还有 {count} 天",
    "Salida en {count} días"
  ],
  [
    "Jour {day} sur {total}",
    "Day {day} of {total}",
    "第 {day} 天，共 {total} 天",
    "Día {day} de {total}"
  ],
  [
    "Jour {day}",
    "Day {day}",
    "第 {day} 天",
    "Día {day}"
  ],
  [
    "Dates prévues passées",
    "Scheduled dates have passed",
    "计划日期已过",
    "Fechas previstas pasadas"
  ],
  [
    "Voyage terminé",
    "Trip completed",
    "旅行已结束",
    "Viaje finalizado"
  ],
  [
    "Voyage annulé",
    "Trip cancelled",
    "旅行已取消",
    "Viaje cancelado"
  ],
  [
    "Dates à vérifier",
    "Check the dates",
    "请检查日期",
    "Revisar las fechas"
  ],
  [
    "Dates à préciser",
    "Dates to be added",
    "待补充日期",
    "Fechas por definir"
  ],
  [
    "Revoir mes souvenirs",
    "Revisit my memories",
    "回顾旅行回忆",
    "Revisitar mis recuerdos"
  ],
  [
    "Voir ma journée",
    "View my day",
    "查看今日行程",
    "Ver mi día"
  ],
  [
    "Préparer mon voyage",
    "Prepare my trip",
    "准备旅行",
    "Preparar mi viaje"
  ],
  [
    "J−{count}",
    "{count} days to go",
    "还有 {count} 天",
    "Faltan {count} días"
  ],
  [
    "C’est le jour du départ !",
    "Departure day is here!",
    "今天出发！",
    "¡Hoy es el día de salida!"
  ],
  [
    "Un voyage à se remémorer",
    "A trip to look back on",
    "值得回味的旅行",
    "Un viaje para recordar"
  ],
  [
    "Le voyage au fil des jours",
    "Your trip through the days",
    "旅行日历",
    "Tu viaje día a día"
  ],
  [
    "Fin prévue il y a 1 jour",
    "Scheduled end was 1 day ago",
    "计划结束日期是昨天",
    "Fin previsto hace 1 día"
  ],
  [
    "Fin prévue il y a {count} jours",
    "Scheduled end was {count} days ago",
    "计划结束日期已过 {count} 天",
    "Fin previsto hace {count} días"
  ],
  [
    "Retrouve le carnet et ses souvenirs.",
    "Return to your journal and memories.",
    "重温手册和回忆。",
    "Vuelve a tu cuaderno y sus recuerdos."
  ],
  [
    "Départ le {date}",
    "Departure on {date}",
    "出发日期：{date}",
    "Salida el {date}"
  ],
  [
    "1 jour prévu",
    "1 day planned",
    "计划 1 天",
    "1 día previsto"
  ],
  [
    "{count} jours prévus",
    "{count} days planned",
    "计划 {count} 天",
    "{count} días previstos"
  ],
  [
    "Durée non précisée",
    "Duration not specified",
    "未指定天数",
    "Duración sin definir"
  ],
  [
    "Selon les dates prévues du carnet.",
    "Based on the journal’s scheduled dates.",
    "根据手册中的计划日期。",
    "Según las fechas previstas del cuaderno."
  ],
  [
    "Fuseau non précisé ou invalide : calendrier UTC.",
    "Missing or invalid time zone: UTC calendar.",
    "时区未指定或无效：使用 UTC 日期。",
    "Zona horaria ausente o no válida: calendario UTC."
  ],
  [
    "Choisir le voyage",
    "Choose a trip",
    "选择旅行",
    "Elegir el viaje"
  ],
  [
    "Choix automatique",
    "Automatic selection",
    "自动选择",
    "Selección automática"
  ],
  [
    "Choix conservé jusqu’au rechargement de l’accueil.",
    "Selection kept until the home page reloads.",
    "选择保留至首页重新加载。",
    "Selección guardada hasta recargar el inicio."
  ]
];
export const tripTimingDictionary = (index: number): Record<string, string> => Object.fromEntries(rows.map(row => [row[0], row[index + 1]]));
