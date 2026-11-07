const rows = [
["Voir la couverture","View the cover","查看封面","Ver la portada"],
  [
    "Enregistrement et connexion",
    "Saving and connection",
    "保存与连接",
    "Guardado y conexión"
  ],
  [
    "Programme compact à vérifier",
    "Compact programme to review",
    "待检查的紧凑行程",
    "Programa compacto por revisar"
  ],
  [
    "Plusieurs moments ou lieux semblent réunis dans un titre. Vérifie les activités : cette ligne n’a pas été découpée automatiquement.",
    "Several times or places may be grouped in one title. Review the activities: this line was not split automatically.",
    "一个标题中可能包含多个时段或地点。请检查活动：此行未自动拆分。",
    "Un título puede agrupar varios momentos o lugares. Revisa las actividades: esta línea no se dividió automáticamente."
  ],
  [
    "J’ai vérifié ce regroupement",
    "I reviewed this grouping",
    "我已检查此分组",
    "He revisado esta agrupación"
  ],
  [
    "Détails de l’activité",
    "Activity details",
    "活动详情",
    "Detalles de la actividad"
  ],
  [
    "Bilan détaillé",
    "Detailed summary",
    "详细摘要",
    "Resumen detallado"
  ],
  [
    "Carnets, documents, visites et pays de Mon monde et préférences dans un fichier vérifié (64 Mo maximum). Pour les photos et légendes quotidiennes, conserve aussi le paquet souvenirs de chaque carnet.",
    "Notebooks, documents, My world visits and countries, and preferences in one verified file (64 MB maximum). For daily photos and captions, also keep each notebook’s memory package.",
    "手册、文档、“我的世界”的到访记录与国家及偏好设置保存在一个经验证的文件中（最大 64 MB）。每日照片和说明请另存各手册的回忆包。",
    "Cuadernos, documentos, visitas y países de Mi mundo y preferencias en un archivo verificado (máximo 64 MB). Para las fotos y leyendas diarias, guarda también el paquete de recuerdos de cada cuaderno."
  ],
  [
    "{count} journée",
    "{count} day",
    "{count} 天",
    "{count} día"
  ],
  [
    "{count} journées",
    "{count} days",
    "{count} 天",
    "{count} días"
  ],
  [
    "{count} proposition",
    "{count} proposal",
    "{count} 项建议",
    "{count} propuesta"
  ],
  [
    "{count} propositions",
    "{count} proposals",
    "{count} 项建议",
    "{count} propuestas"
  ],
  [
    "{count} passage à vérifier",
    "{count} passage to review",
    "{count} 处待检查",
    "{count} pasaje por revisar"
  ],
  [
    "{count} passages à vérifier",
    "{count} passages to review",
    "{count} 处待检查",
    "{count} pasajes por revisar"
  ],
["Exporter mes visites et pays", "Export my visits and countries", "导出到访记录与国家", "Exportar mis visitas y países"],
["Restaurer mes visites et pays", "Restore my visits and countries", "恢复到访记录与国家", "Restaurar mis visitas y países"],
["Journées : {count}", "Days : {count}", "天数 : {count}", "Días : {count}"],
["Activités : {count}", "Activities : {count}", "活动 : {count}", "Actividades : {count}"],
["Suggestions : {count}", "Suggestions : {count}", "建议 : {count}", "Sugerencias : {count}"],
["Notes : {count}", "Notes : {count}", "备注 : {count}", "Notas : {count}"],
["Informations absentes : {count}", "Missing information : {count}", "缺失信息 : {count}", "Información ausente : {count}"],
["Conflits : {count}", "Conflicts : {count}", "冲突 : {count}", "Conflictos : {count}"],
["Lieux à préciser : {count}", "Places to clarify : {count}", "待确认地点 : {count}", "Lugares por precisar : {count}"]
];
export const auditCorrectionsDictionary = (index: number): Record<string,string> => Object.fromEntries(rows.map(row => [row[0],row[index+1]]));
