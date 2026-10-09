const rows = `Enregistrement local impossible|Local saving failed|本地保存失败|No se pudo guardar en este dispositivo
Enregistrement sur cet appareil…|Saving on this device…|正在保存到此设备…|Guardando en este dispositivo…
Carnet non téléchargé|Journal not downloaded|旅行笔记尚未下载|Cuaderno sin descargar
Accès retiré|Access removed|访问权限已撤销|Acceso retirado
En attente d’envoi|Waiting to send|等待发送|Pendiente de envío
Synchronisation en cours…|Sync in progress…|正在同步…|Sincronización en curso…
Synchronisation à vérifier|Sync needs checking|需要检查同步状态|Sincronización por comprobar
Dernier échange avec le compte :|Last exchange with the account:|最近一次账户数据交换：|Último intercambio con la cuenta:
Internet disponible. Cela ne confirme ni un envoi ni une sauvegarde externe.|Internet is available. This does not confirm an upload or an external backup.|有网络连接，但这不代表数据已上传或已备份到其他设备。|Hay conexión. Esto no confirma un envío ni una copia externa.
Internet indisponible. Les changements peuvent rester enregistrés ici en attendant l’envoi.|No Internet. Changes can remain saved here while waiting to send.|没有网络连接。更改可以保存在此设备上，等待发送。|Sin conexión. Los cambios pueden quedar guardados aquí hasta su envío.
Disponible ici|Available here|此处可用|Disponible aquí
À vérifier|Needs checking|待检查|Por comprobar
Planning, adresses, réservations et notes|Planning, addresses, bookings and notes|行程、地址、预订和笔记|Planificación, direcciones, reservas y notas
Documents joints : {count}|Attached documents: {count}|内嵌文档：{count}|Documentos adjuntos: {count}
Application, polices et vues différées|App, fonts and deferred views|应用、字体和延迟加载的页面|Aplicación, fuentes y vistas diferidas
Contours locaux du monde|Local world outlines|本地世界轮廓地图|Contornos locales del mundo
Cartes de rues, liens et couvertures externes|Street maps, links and external covers|街道地图、链接和外部封面|Mapas de calles, enlaces y portadas externas
Internet requis|Internet required|需要网络|Requiere conexión
Dernier contrôle :|Last check:|最近检查：|Última comprobación:
Aucun contrôle enregistré pour ce carnet.|No recorded check for this journal.|此旅行笔记尚无检查记录。|No hay comprobación guardada para este cuaderno.
Carnet modifié : vérifie de nouveau avant le départ.|Journal changed: check again before leaving.|旅行笔记已更改，出发前请再次检查。|Cuaderno modificado: comprueba de nuevo antes de salir.
Ce contrôle relit cette copie et les ressources de la version ouverte. Il ne constitue pas une sauvegarde sur un autre appareil.|This check rereads this copy and the resources of the open version. It is not a backup on another device.|此检查会重新读取本机副本和当前版本的资源，并不是其他设备上的备份。|Esta comprobación relee esta copia y los recursos de la versión abierta. No es una copia en otro dispositivo.
Retrouver mes données|Find my data|找回我的数据|Recuperar mis datos
Reviens sur le même site, dans le même navigateur et le même compte.|Return to the same site, browser and account.|返回同一网站，使用同一浏览器和账户。|Vuelve al mismo sitio, navegador y cuenta.
Sans Internet, seuls les carnets déjà téléchargés sont disponibles ici.|Without Internet, only previously downloaded journals are available here.|没有网络时，只有已下载的旅行笔记可用。|Sin conexión, solo están disponibles los cuadernos ya descargados.
Avant de vider l’application, télécharge une sauvegarde complète et conserve-la sur un autre support.|Before clearing the app, download a complete backup and keep it elsewhere.|清除应用数据前，请下载完整备份并保存到其他存储介质。|Antes de vaciar la aplicación, descarga una copia completa y guárdala en otro soporte.
Une erreur d’enregistrement ? Exporte le carnet affiché avant de fermer.|Saving failed? Export the displayed journal before closing.|保存失败时，请在关闭前导出当前显示的旅行笔记。|Si falla el guardado, exporta el cuaderno mostrado antes de cerrar.
En cas de conflit, conserve les deux sources et compare les valeurs avant de choisir.|In a conflict, keep both sources and compare values before choosing.|发生冲突时，保留两个来源，比较内容后再选择。|En caso de conflicto, conserva ambas fuentes y compara los valores antes de elegir.
Un accès retiré bloque les échanges futurs ; des copies déjà téléchargées peuvent subsister.|Removed access blocks future exchanges; previously downloaded copies may remain.|撤销权限会阻止后续数据交换，但已下载的副本仍可能保留。|El acceso retirado bloquea futuros intercambios; pueden conservarse copias ya descargadas.`;
export function offlineDictionary(index: number): Record<string,string> {
  return Object.fromEntries(rows.split('\n').map(row => { const parts = row.split('|'); return [parts[0], parts[index+1]]; }));
}
