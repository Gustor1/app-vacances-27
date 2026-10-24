## Summary

Un programme colle dispose maintenant d'un apercu corrigible puis d'une creation durable de nouveau carnet dans Detours. L'IA reelle reste desactivee : aucune cle, route hebergee, verification d'identite et quota durable ne sont configures. Les exemples synthetiques et l'analyse interceptee sont explicitement distingues.

```text
Accueil -> texte -> analyse (service requis) / saisie manuelle
        -> brouillon avec provenance -> correction
        -> journal verifie -> nouveau carnet local -> planning/carte/export
```

## Evidence

- **Before:** pas de parcours texte ; tests de creation/reprise echouaient sur les fonctions non implementees et les regressions observees.
- **After:** gate complet 21/21 : 123 tests unitaires, 70 tests navigateur, SQL en memoire, build/integrite et dix smokes compiles dont carte/hors ligne/export-restauration. `sourceUnchanged: true`. Voir `IMPORT-PLANNING-IA.md` et `import-planning-validation.json`.
- Extraction reelle, OAuth et telephone physique non verifies. Aucun deploiement ni changement distant.

## Merge Danger

**Door:** two-way. Format de carnet existant, aucune migration SQL. Sauvegarder les imports locaux avant de revenir a une ancienne version connectee qui ignore localOnly.

**Blast Radius:** storage. Les capsules importees sont locales jusqu'au consentement explicite de rattachement. Les carnets existants gardent leur comportement. Cible de PR : `codex/carnets-universels`. Ne pas fusionner automatiquement.
