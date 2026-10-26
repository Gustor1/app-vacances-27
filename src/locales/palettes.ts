const rows = `Couleurs|Colors|配色|Colores
Palette du mode clair|Light appearance palette|浅色模式配色|Paleta del modo claro
Palette du mode sombre|Dark appearance palette|深色模式配色|Paleta del modo oscuro
Plus de palettes|More palettes|更多配色|Más paletas
Chaque apparence garde sa palette sur cet appareil.|Each appearance keeps its own palette on this device.|此设备会分别记住浅色和深色模式的配色。|Cada apariencia conserva su paleta en este dispositivo.
Lin et vert le jour, prune et sable la nuit.|Linen and green by day, plum and sand by night.|白天用亚麻色与绿色，夜晚用梅紫色与沙色。|Lino y verde de día, ciruela y arena de noche.
Réinitialiser les palettes|Reset palettes|重置配色|Restablecer paletas
Signature Détours|Détours signature|Détours 经典|Firma Détours
Porcelaine|Porcelain|瓷白|Porcelana
Eucalyptus|Eucalyptus|桉叶绿|Eucalipto
Graphite & sauge|Graphite & sage|石墨与鼠尾草|Grafito y salvia
Nuit océan|Ocean night|海洋之夜|Noche oceánica
Encre & glacier|Ink & glacier|墨色与冰川|Tinta y glaciar
Forêt & jade|Forest & jade|森林与翡翠|Bosque y jade
Bordeaux & ivoire|Burgundy & ivory|酒红与象牙|Burdeos y marfil
Corail|Coral|珊瑚|Coral
Abricot & encre|Apricot & ink|杏色与墨色|Albaricoque y tinta
Soleil & pétrole|Sun & petrol|暖阳与石油蓝|Sol y petróleo
Violet origami|Origami violet|折纸紫|Violeta origami
Noir|Black|纯黑|Negro`;
export function paletteDictionary(index: 0 | 1 | 2): Record<string, string> {
  return Object.fromEntries(rows.split('\n').map(row => { const parts = row.split('|'); return [parts[0], parts[index + 1]]; }));
}
