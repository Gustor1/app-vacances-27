const rows=`Application de cartes préférée|Preferred maps app|首选地图应用|Aplicación de mapas preferida
Ce choix s’applique aux lieux et aux trajets de tous tes carnets. Amap est surtout utile en Chine.|This choice applies to places and routes in all your journals. Amap is especially useful in China.|此选项适用于所有旅行笔记中的地点和路线。高德地图尤其适合在中国使用。|Esta elección se aplica a los lugares y rutas de todos tus cuadernos. Amap es especialmente útil en China.
Ce choix est mémorisé pour ton compte sur cet appareil. Sans compte, il reste local à cet appareil.|This choice is saved for your account on this device. Without an account, it stays local to this device.|此选项保存在本设备的帐户中。未登录时，它仅保存在本设备上。|Esta elección se guarda para tu cuenta en este dispositivo. Sin cuenta, queda guardada solo en este dispositivo.
Ce choix reste actif pour cette session, mais sa sauvegarde est indisponible.|This choice remains active for this session, but could not be saved.|此选项在本次会话中仍然有效，但无法保存。|Esta elección sigue activa durante esta sesión, pero no se ha podido guardar.
Calculer un trajet|Plan a route|规划路线|Calcular una ruta
De ce lieu au suivant|From this place to the next|从此处前往下一站|De este lugar al siguiente
Le mode choisi concerne le trajet, pas la recherche du lieu.|The selected mode applies to the route, not the place search.|所选方式用于路线，不影响地点搜索。|El modo elegido se aplica a la ruta, no a la búsqueda del lugar.
Choisis ton trajet et ton mode de transport dans Amap.|Choose your route and travel mode in Amap.|请在高德地图中选择路线和出行方式。|Elige la ruta y el modo de transporte en Amap.
Maintenant|Now|现在|Ahora
Voir Maintenant|Open Now|查看现在|Ver Ahora
Les informations du carnet, au bon endroit|Your journal essentials in one place|旅行笔记中的实用信息|Lo esencial de tu cuaderno en un lugar
Sans suivi de position. Choisis la journée que tu veux consulter.|No location tracking. Choose the day to consult.|不跟踪位置。请选择要查看的日程。|Sin seguimiento de ubicación. Elige el día que quieres consultar.
Date choisie|Selected date|所选日期|Fecha elegida
Aujourd’hui dans le fuseau de chaque étape|Today in each stop’s time zone|各站点时区的今天|Hoy en la zona horaria de cada etapa
Journée à consulter|Day to consult|要查看的日程|Día para consultar
Choisir une journée|Choose a day|选择一天|Elegir un día
Journée sans date : sélection manuelle|Undated day: manual selection|未注明日期：手动选择|Día sin fecha: selección manual
Aucune journée datée ne correspond. Choisis une journée ou attribue ses dates dans la vue d’ensemble.|No dated day matches. Select a day or add its date in the overview.|没有匹配日期的日程。请选择日程或在概览中填写日期。|Ningún día con fecha coincide. Elige un día o añade su fecha en la vista general.
Mon hébergement|My accommodation|我的住宿|Mi alojamiento
Nom local non renseigné|Local name not provided|尚未填写当地名称|Nombre local sin indicar
Adresse non renseignée|Address not provided|尚未填写地址|Dirección sin indicar
Adresse recopiée du carnet : langue à vérifier, aucune traduction automatique.|Address copied from the journal: verify its language; no automatic translation.|地址按旅行笔记原样显示：请确认语言，不进行自动翻译。|Dirección copiada del cuaderno: comprueba el idioma; sin traducción automática.
Les dates de cet hébergement ne couvrent pas cette journée.|This accommodation’s dates do not cover this day.|住宿日期不包含此日。|Las fechas de este alojamiento no incluyen este día.
À montrer|Show this|出示|Para mostrar
Aucun hébergement renseigné pour cette ville.|No accommodation provided for this city.|尚未填写此城市的住宿。|Sin alojamiento indicado para esta ciudad.
Ouvrir les hébergements|Open accommodation|查看住宿|Ver alojamientos
Prochaine étape du planning|Next planned stop|日程中的下一站|Próxima etapa del plan
Première activité encore à faire dans l’ordre saisi, sans estimation horaire.|First unfinished activity in the entered order, without estimated timing.|按填写顺序显示首个未完成活动，不估算时间。|Primera actividad pendiente en el orden indicado, sin estimar horarios.
Aucune activité restante pour cette journée.|No activities remaining for this day.|此日已无待完成活动。|No quedan actividades para este día.
Ouvrir cette journée|Open this day|查看此日|Ver este día
Réservation du jour|Today’s booking|当日预订|Reserva del día
Aucune réservation confirmée renseignée pour cette journée.|No confirmed booking entered for this day.|尚未填写此日的已确认预订。|Sin reserva confirmada indicada para este día.
Ouvrir mes transports|Open my transport|查看我的交通|Ver mis transportes
Note du jour|Day’s note|当日备注|Nota del día
Aucune note saisie pour cette journée.|No note entered for this day.|尚未填写此日的备注。|Sin nota para este día.
Copier le texte|Copy text|复制文字|Copiar texto
Revenir au carnet|Back to journal|返回旅行笔记|Volver al cuaderno`;
export function nowDictionary(index:number):Record<string,string>{return Object.fromEntries(rows.split('\n').map(row=>{const parts=row.split('|');return [parts[0],parts[index+1]];}));}
