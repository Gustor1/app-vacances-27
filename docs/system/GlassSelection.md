<!-- Documentation fondée sur les sources du composant, 2026-11-01. -->
# Indicateur de sélection

## Description
`GlassSelection` suit le bouton sélectionné d'un groupe sans porter son état métier.

`import GlassSelection from './GlassSelection'` dans `src/components/JourneysApp.tsx` ; composant client dans `src/components/GlassSelection.tsx`. Pas de registre de composants.

## Examples
Exemple réel de l'accueil, simplifié depuis `src/components/JourneysApp.tsx` :

```tsx
<GlassSelection selection={tab}/>
```

Exemple réel de la navigation du carnet, depuis `src/App.tsx` :

```tsx
<GlassSelection selection={view}/>
```

### Example files
| Fichier | Usage |
| --- | --- |
| `src/components/JourneysApp.tsx` | Onglets Mes voyages / Mon monde |
| `src/App.tsx` | Navigation latérale et navigation mobile |
| `tests/e2e/iphone-glass.spec.ts` | Déplacement au toucher et phases |
| `tests/e2e/editorial-ui.spec.ts` | Navigation clavier de la collection |

## Variants
Aucune prop de variante. La présentation dépend du groupe parent dans `src/apple-design.css`.

## States
- Au repos : l'indicateur couvre la boîte du bouton sélectionné.
- Déplacement : `data-phase` passe par `opening` puis `closing` avant `rest`.
- Aucun bouton mesurable : indicateur transparent et attribut `data-glass-ready` retiré.
- Mouvement réduit : position appliquée immédiatement, sans boucle d'animation.
- Redimensionnement : `ResizeObserver` recalcule les dimensions du groupe et de ses boutons.

## Props
| Nom | Type | Défaut | Rôle |
| --- | --- | --- | --- |
| `selection` | `string` | Aucun, obligatoire | Déclenche une nouvelle mesure lors d'un changement de sélection |

## Usage
### When to use
Pour rendre visible la position courante dans les groupes de navigation existants.
### When not to use
Pour un bouton isolé, utiliser son état natif. Pour une opération en cours, utiliser le retour de cette opération.
### Rules
- `rule/selection-owned-by-buttons` : dans un groupe, conserver `aria-selected` ou `aria-current` sur les boutons, car le composant cherche ces attributs pour déterminer sa cible. Sources : `GlassSelection.tsx`, usages dans `JourneysApp.tsx` et `App.tsx`. Vérification : onglets au clavier dans `editorial-ui.spec.ts`.
  - Don't: `<GlassSelection selection={tab}/>` seul, sans groupe ni boutons porteurs de sélection.
### Content
Pas de texte : les libellés appartiennent aux boutons et restent traduits par leurs propriétaires.
### Anti-slop
Ne pas ajouter de halo ou de seconde animation de sélection à ce composant. La direction éditoriale emploie un filet pour les onglets et un repère latéral pour le carnet.
### Limits
Mesures supplémentaires nécessaires pour des groupes imbriqués : les usages actuels ont des boutons enfants directs.

## Accessibility
Le `span` porte `aria-hidden="true"` et ne reçoit pas le focus. Les boutons conservent la sémantique, la sélection et la navigation clavier ; l'indicateur n'en remplace aucune. Le composant observe `prefers-reduced-motion` et arrête la boucle lorsqu'il devient actif.

## Tokens
`--glass-radius` est lu par le moteur de positionnement. Couleurs et géométrie visuelle sont définies par les règles `.glass-selection` et leurs groupes dans `src/apple-design.css`, à partir des variables sémantiques des palettes.

## Related
`PreferencesButton` utilise des contrôles radio natifs ; ne pas lui substituer cet indicateur de navigation.

Sources : `src/components/GlassSelection.tsx`, `src/components/JourneysApp.tsx`, `src/App.tsx`, `src/apple-design.css`, tests cités.

Conflits : le nom historique GlassSelection reste conservé malgré la nouvelle présentation sans verre.

Guessed at : la recommandation contre le halo relève de la direction artistique retenue ; ce n'est pas une restriction technique du composant.
