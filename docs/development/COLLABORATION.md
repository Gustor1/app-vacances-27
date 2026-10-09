# Collaborer sur Détours avec Codex et Claude Code

Pour transmettre toutes les étapes au nouveau collaborateur et à Claude : [guide complet de démarrage](../../GUIDE-DEMARRAGE-CLAUDE-CODE.md), avec les informations d'invitation, les comptes, les installations, les connecteurs et le prompt de prise en main.

Base de collaboration : **`codex/carnets-universels`**, dans [Gustor1/app-vacances-27](https://github.com/Gustor1/app-vacances-27). `main` conserve la version ancienne ; cloner la branche indiquée pour récupérer le travail récent. Le code, les tests, les migrations et les documents se partagent par Git ; chaque personne garde son PC, son compte IA et ses conversations.

## 1. Invitation GitHub par le propriétaire

Ouvrir [les accès au dépôt](https://github.com/Gustor1/app-vacances-27/settings/access), puis **Settings → Collaborators → Add people**. Saisir le pseudo GitHub de l'ami et envoyer l'invitation. Il doit l'accepter avec son compte GitHub pour obtenir l'accès en écriture. Pas besoin de partager un compte Codex, Claude, un mot de passe ou un jeton.

Référence : [inviter un collaborateur](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/inviting-collaborators-to-a-personal-repository).

## 2. Installation sur le PC de l'ami

Installer Git, Node.js **22.18 ou plus récent** (Node 24 utilisé pour les validations Windows), Chrome pour les tests Windows et Claude Code. Se connecter à GitHub avec son propre compte pour le clone/push et à Claude Code avec son propre accès.

```powershell
git clone --branch codex/carnets-universels https://github.com/Gustor1/app-vacances-27.git
cd app-vacances-27
npm ci
git switch -c claude/mon-premier-sujet
npm run dev
```

Ouvrir l'adresse locale affichée par Vite. Dans un deuxième terminal placé dans ce dossier :

```powershell
claude
```

Claude Code charge `CLAUDE.md`, qui importe les règles communes `AGENTS.md`. Lire aussi le README. Installation/connexion Claude : [guide officiel](https://code.claude.com/docs/en/quickstart) ; instructions du projet : [CLAUDE.md](https://code.claude.com/docs/en/memory).

Configurer également son identité Git dans ce dépôt pour les commits (son nom et une adresse vérifiée sur son compte GitHub, éventuellement l'adresse privée `noreply` fournie par GitHub) :

```powershell
git config user.name "Son pseudo"
git config user.email "Son adresse GitHub vérifiée"
```

Le **mode local marche sans `.env.local`**. Ne pas copier `.env.example` tel quel pour travailler uniquement en local : ses paramètres sont des exemples. Pour tester les comptes/synchronisation, demander au propriétaire les paramètres publics de développement et la cible autorisée, puis créer un `.env.local` ignoré par Git. Ne jamais y placer une clé serveur secrète. Les accès administrateur au backend et à l'hébergement sont distincts de l'accès au code.

## 3. Contrôles reproductibles

```powershell
npm test
npm run typecheck
npm run lint
```

Pour le gate complet, installer PGlite **hors du dépôt** dans un dossier d'outillage dédié. Exemple PowerShell depuis la racine du projet :

```powershell
npm install --prefix ../detours-test-tools --no-save @electric-sql/pglite@0.5.8
$env:DETOURS_PGLITE_PATH = (Resolve-Path ../detours-test-tools/node_modules/@electric-sql/pglite/dist).Path
npm run verify:local
```

Arrêter `npm run dev` avant le gate : il démarre son propre serveur sur 5173. Le gate couvre types/lint, tests unitaires, SQL isolé, build, parcours navigateur retenus et smokes compilés. Son rapport indique les étapes passées/échouées/non exécutées dans un dossier temporaire. Il utilise des profils jetables et des paramètres Supabase factices. Il ne valide pas les services distants ni OAuth réel, et son `dist/` n'est pas un candidat à publier.

Windows utilise Chrome installé. Sous Linux, la configuration attend `/usr/bin/chromium` ; `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` permet de choisir un autre Chromium installé. Sous macOS, installer le navigateur Playwright avec `npx playwright install chromium` après `npm ci`. Voir le README pour les autres contrôles et limites.

## 4. Travail à deux

Avant un nouveau sujet, partir d'un dossier propre et mettre la base à jour :

```powershell
git switch codex/carnets-universels
git pull --ff-only
git switch -c claude/nom-du-sujet
```

Si des changements locaux sont présents, les conserver sur leur branche avant de changer de branche. Se répartir des sujets concrets ; prévenir l'autre si les mêmes fichiers doivent être modifiés. Après développement et contrôles, examiner le diff, ajouter uniquement les fichiers du sujet, puis :

```powershell
git commit -m "feat: description du changement"
git push -u origin claude/nom-du-sujet
```

Sur GitHub, ouvrir une pull request avec **base `codex/carnets-universels`** et **compare la branche du sujet**. Décrire le résultat, les tests et les limites ; faire relire puis fusionner selon votre accord. GitHub ne force pas cette règle de revue sans configuration de protection supplémentaire. Récupérer ensuite la base à jour sur chaque PC. Aucun push forcé sur la base commune.

Premier prompt pour Claude Code :

> Lis CLAUDE.md, AGENTS.md, README.md et docs/development/COLLABORATION.md. Vérifie la branche et les changements locaux. Le sujet est : [décrire la tâche]. Travaille sur une branche dédiée issue de codex/carnets-universels, préserve l'expérience et les données existantes, exécute les contrôles adaptés et prépare une pull request vers codex/carnets-universels. Ne publie pas le site ni une migration distante dans cette tâche.

## 5. Publier le même site

L'accès GitHub permet de contribuer au code. Le dépôt est actuellement public ; Vercel indique que la collaboration Git sur les dépôts publics est gratuite. Pour que l'ami dispose aussi de son propre accès à l'administration et aux publications dans **la même équipe Vercel**, vérifier les invitations et rôles disponibles dans l'équipe ; la collaboration par membres d'équipe est documentée sur **Pro**. Les restrictions Hobby sur les auteurs de commits décrites pour les dépôts privés ne doivent pas être généralisées au dépôt public sans vérifier sa configuration. Chaque membre invité doit connecter son compte GitHub à son compte Vercel. Ne pas partager le jeton personnel du propriétaire. Voir [les règles actuelles](https://vercel.com/docs/deployments/troubleshoot-project-collaboration) et [les déploiements Git](https://vercel.com/docs/git).

Si le propriétaire reste seul à publier, l'ami peut déjà travailler et soumettre ses changements sans accès Vercel. Pour administrer les migrations/droits serveur, prévoir séparément un accès adapté au projet backend ; aucune invitation voyage dans l'application ne donne ces droits.

Une publication nécessite une configuration de cible vérifiée et les contrôles du protocole `L8.md`. Ce guide n'active aucun déploiement automatique et ne change pas la branche de production.
