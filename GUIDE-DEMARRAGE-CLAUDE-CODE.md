# Rejoindre Détours avec Claude Code

Guide à transmettre au nouveau collaborateur et à son Claude Code. Préparé le **9 octobre 2026**, fuseau Asia/Shanghai. Les offres et interfaces des services peuvent évoluer : vérifier les pages officielles avant de souscrire une offre ou changer des droits.

## 1. Objectif et projet à ouvrir

Tu vas travailler sur le même projet que ton ami, depuis ton PC et avec tes propres comptes. GitHub partage le code ; Vercel héberge le site ; Supabase gère les comptes et la base. Claude Code utilise tes droits après connexion à ces services.

| Élément | Valeur |
| --- | --- |
| Application | Détours, carnets de voyage |
| Dépôt GitHub | https://github.com/Gustor1/app-vacances-27 |
| Propriétaire GitHub | `Gustor1` |
| Base de collaboration | **`codex/carnets-universels`** |
| Révision partagée lors de la préparation | `9f4766d` ; récupérer ensuite les mises à jour de la branche |
| Équipe Vercel | `eliottle` |
| Projet Vercel | `app-vacances-27` |
| ID du projet Vercel | `prj_GdllwjlfvjDogyKdH2ABRJay350a` |
| ID de l'équipe Vercel | `team_lVeovobBaIvDqajTP8FZ3UvH` |
| Organisation Supabase | `eliottle'sOrg` |
| ID de l'organisation Supabase | `wnhjpyobnbhokicqcstb` |
| Projet Supabase | **`Detours-beta`** |
| Référence Supabase | **`ehvgecfakbxeatrcnfhm`** |
| URL Supabase | `https://ehvgecfakbxeatrcnfhm.supabase.co` |
| Adresse de la bêta | https://app-vacances-27-beta-eliottle.vercel.app/ |
| Technique | React 19, TypeScript, Vite, Leaflet, Supabase |

Au moment de la préparation, `main` contient l'ancienne application. Utiliser la branche indiquée pour récupérer la version récente. Les identifiants ci-dessus servent à sélectionner les bonnes ressources ; ce ne sont pas des secrets ni des preuves que ton compte a déjà accès.

Les conversations, mémoires et outils du Codex de ton ami ne sont pas transférés par Git. Le contexte commun est dans `README.md`, `AGENTS.md`, `CLAUDE.md` et `docs/`. Les données de carnets présentes dans son navigateur ne sont pas copiées par un clone Git.

## 2. Message à envoyer au propriétaire avant les invitations

Créer les comptes manquants sur [GitHub](https://github.com/), [Vercel](https://vercel.com/) et [Supabase](https://supabase.com/dashboard). Tu peux utiliser la même adresse, mais indique les trois adresses si elles diffèrent. Le pseudo GitHub est particulièrement utile pour l'invitation.

Copier et compléter ce message :

```text
Salut, voici les informations pour m'inviter sur Détours :

Pseudo GitHub : ...
Lien de mon profil GitHub : https://github.com/...
Email du compte GitHub : ...
Email du compte Vercel : ...
Email du compte Supabase : ...
Adresse Google utilisée pour tester la connexion à l'application : ...

Mon système : Windows / macOS / Linux
Claude Code : déjà installé / à installer
J'ai un accès Claude Code fonctionnel : oui / non

Je souhaite pouvoir :
- modifier le code et proposer des pull requests ;
- publier et gérer le même projet Vercel ;
- travailler sur la base Supabase ;
- modifier les paramètres d'authentification si nécessaire : oui / non.
```

Ce message contient uniquement les informations d'invitation. **Ne pas envoyer de mot de passe, code de connexion, jeton, clé privée ou fichier de session.** Aucun email de ton compte Claude n'est nécessaire pour les invitations au projet ; tu utilises ton propre accès Claude Code.

## 3. Ce que le propriétaire doit faire

Ces étapes se font sur ses comptes. Ton Claude ne peut pas s'attribuer les droits du propriétaire.

### GitHub

- [ ] Ouvrir [les accès du dépôt](https://github.com/Gustor1/app-vacances-27/settings/access).
- [ ] Aller dans **Settings → Collaborators → Add people** et inviter ton pseudo GitHub.
- [ ] Te transmettre l'invitation si nécessaire ; tu l'acceptes avec ton propre compte.

L'accès collaborateur permet de contribuer au dépôt, y compris envoyer des branches. La base de vos pull requests est `codex/carnets-universels`. Référence : [GitHub](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/inviting-collaborators-to-a-personal-repository).

### Vercel

- [ ] Dans le tableau de bord, sélectionner **l'équipe `eliottle`**.
- [ ] Ouvrir **Settings → Members**, inviter l'email de ton compte Vercel avec le rôle **Member**.
- [ ] Vérifier les droits et le coût affichés avant de confirmer une offre payante.
- [ ] Tu acceptes l'invitation, puis connectes ton propre GitHub à ton compte Vercel.

Le rôle Member permet de gérer les projets et les publications. Il est disponible sur Pro/Enterprise. Hobby ne permet pas d'ajouter ce membre administrant les publications dans la même équipe. La collaboration Git sur un dépôt public est distincte de cet accès au tableau de bord.

Tarif Pro documenté à cette date : 20 $/mois avec un siège de publication inclus, puis 20 $/mois par siège supplémentaire de type Member/Owner. Pour deux sièges, prévoir **40 $/mois avant taxes et consommation supplémentaire**, si vous choisissez cette formule. L'abonnement actuel de l'équipe n'a pas été confirmé ; aucune souscription n'est autorisée par ce guide. Ton ami peut garder la publication et te laisser contribuer au code si vous ne voulez pas ajouter ce siège.

Références : [invitations](https://vercel.com/docs/rbac/managing-team-members), [rôles](https://vercel.com/docs/rbac/access-roles), [tarifs](https://vercel.com/docs/plans/pro-plan).

### Supabase

- [ ] Dans Supabase, sélectionner **`eliottle'sOrg`**, puis **Team → Invite**.
- [ ] Inviter l'email de ton compte Supabase.
- [ ] Choisir **Developer** pour travailler sur le contenu/la base, ou **Administrator** si tu dois aussi modifier les paramètres du projet et l'authentification. Le propriétaire peut conserver seul le rôle Owner.
- [ ] Tu acceptes l'invitation ; la documentation annonce une validité de 24 h, donc demander un renvoi si elle expire.

**Périmètre réel :** cette organisation contient aussi le projet `Mandarin 15M`. Un rôle au niveau de l'organisation s'applique à tous ses projets actuels et futurs. Les rôles limités à un projet sont disponibles sur Team/Enterprise. Si le propriétaire souhaite limiter ton accès à Détours, vérifier cette option ou préparer une organisation dédiée ; ce guide ne transfère aucun projet. Référence : [droits Supabase](https://supabase.com/docs/guides/platform/access-control).

### Configuration de développement et Google

- [ ] Le propriétaire te fournit la **clé publique Supabase publishable** de la cible de développement autorisée, ainsi que la valeur à utiliser pour `VITE_ENABLE_COLLABORATION`.
- [ ] Il confirme que tu peux utiliser `Detours-beta` pour les essais connectés et quel carnet d'essai employer.
- [ ] Pour tester OAuth localement, vérifier dans **Supabase → Authentication → URL Configuration** les URL de retour utilisées par le code. Les origines usuelles sont `http://localhost:5173/` et `http://127.0.0.1:5173/` ; autoriser la forme correspondant au retour réel, avec les chemins nécessaires. Ne pas remplacer l'adresse officielle du site par localhost.
- [ ] Si le client Google OAuth est toujours en audience de test, ajouter ton adresse Google aux utilisateurs de test.

L'administration Google Cloud n'est nécessaire que si tu dois modifier toi-même le client OAuth, son audience ou ses paramètres. Dans ce cas, le propriétaire donne séparément un accès adapté au projet Google Cloud. Le callback Google est celui indiqué par Supabase : ce n'est pas simplement l'adresse localhost. Références : [URL de retour](https://supabase.com/docs/guides/auth/redirect-urls), [connexion Google](https://supabase.com/docs/guides/auth/social-login/auth-google).

## 4. Installer les outils sur ton PC

Claude doit d'abord vérifier ce qui est installé et éviter les installations en double. Si tu utilises déjà Claude Code, tu peux lui donner ce fichier immédiatement. Sinon, installe d'abord Claude et connecte-toi pour qu'il prenne le relais.

| Outil | Utilité | Installation |
| --- | --- | --- |
| Git | Clone, branches, commits | [Git](https://git-scm.com/downloads) |
| Node.js et npm | Installer et lancer l'application | [Node.js](https://nodejs.org/en/download), version **24 recommandée**, minimum **22.18** |
| Chrome | Navigateur des tests Windows | [Chrome](https://www.google.com/chrome/) |
| Claude Code | Assistant sur ton PC | [Installation officielle](https://code.claude.com/docs/en/setup) |
| GitHub CLI, commande `gh` | Connexion GitHub et création de pull requests par Claude | [GitHub CLI](https://cli.github.com/) ; recommandé |

### Windows / PowerShell

Si WinGet est disponible, ces commandes permettent d'installer les outils absents, une commande à la fois :

```powershell
winget install --id Git.Git --exact
winget install --id GitHub.cli --exact
winget install --id Google.Chrome --exact
winget install --id Anthropic.ClaudeCode --exact
```

Pour Node, installer la version 24 depuis le site officiel ; Claude peut préparer l'installation correspondant à ton système. Après une installation, ouvrir un nouveau terminal pour actualiser le PATH, puis vérifier :

```powershell
git --version
node --version
npm --version
gh --version
claude --version
```

Si WinGet manque, utiliser les installateurs officiels. Claude Code propose aussi une installation native PowerShell sur sa page officielle. Si PowerShell bloque `npm.ps1`, utiliser `npm.cmd` pour les commandes npm plutôt que modifier globalement la politique d'exécution.

### macOS / Linux

Utiliser les installateurs officiels adaptés au système ; les commandes Git/npm/Claude suivantes restent les mêmes. Claude doit adapter les commandes PowerShell de variables d'environnement au shell Bash/Zsh.

Pour les tests, macOS peut installer le navigateur du Playwright du projet avec `npx playwright install chromium` après `npm ci`. Sous Linux, le projet attend `/usr/bin/chromium` ; sinon configurer `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` vers le Chromium réellement installé. Il n'est pas nécessaire d'installer un autre navigateur pour simplement ouvrir l'application locale.

### Connexions personnelles

```powershell
gh auth login
gh auth setup-git
claude
```

Avec `gh auth login`, choisir GitHub.com, HTTPS et la connexion dans le navigateur. Avec `claude`, utiliser ton propre accès Claude Code. Les étapes de login, 2FA et consentement OAuth restent à valider personnellement. Référence : [connexion GitHub CLI](https://cli.github.com/manual/gh_auth_login).

## 5. Récupérer et lancer l'application

Choisir un dossier sur ton PC. Ne pas utiliser le chemin personnel du propriétaire et ne pas écraser un dossier `app-vacances-27` déjà présent. Le dépôt étant public, l'installation locale peut avancer pendant l'attente des invitations ; l'envoi de modifications nécessite les droits GitHub.

```powershell
git clone --branch codex/carnets-universels https://github.com/Gustor1/app-vacances-27.git
cd app-vacances-27
git status
git branch --show-current
npm ci
```

Si le dépôt existe déjà : vérifier son origine, sa branche et son état avant d'agir. Préserver ses changements ; ne pas supprimer le dossier ni faire de reset pour recommencer.

Configurer ton identité dans ce dépôt ; remplacer les valeurs d'exemple par les tiennes :

```powershell
git config user.name "TON_PSEUDO_GITHUB"
git config user.email "TON_EMAIL_VERIFIE_GITHUB_OU_NOREPLY"
```

Créer une branche personnelle pour ton premier sujet :

```powershell
git switch -c claude/prise-en-main
npm run dev
```

Ouvrir l'adresse annoncée par Vite, normalement sur le port 5173. Laisser ce terminal ouvert. Dans un **deuxième terminal**, placé dans le même dossier, lancer `claude` et lui donner ce guide. Lire `CLAUDE.md`, qui importe les règles communes de `AGENTS.md`, puis `README.md`.

Le mode local fonctionne sans `.env.local`. Tu peux donc commencer à travailler même si les invitations Vercel/Supabase ou les paramètres connectés manquent.

## 6. Activer les comptes et la synchronisation sur ton installation locale

Seulement après réception des paramètres et confirmation de la cible de test. Créer ou compléter `.env.local` **sans écraser un fichier existant** :

```dotenv
VITE_SUPABASE_URL=https://ehvgecfakbxeatrcnfhm.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=REMPLACER_PAR_LA_CLE_PUBLIQUE_FOURNIE
VITE_ENABLE_COLLABORATION=false
```

La dernière ligne est une valeur de départ prudente. Utiliser `true` lorsque le propriétaire confirme que l'édition collaborative est autorisée pour ce backend déjà configuré. Ne pas essayer de créer ou réappliquer toute la base pour obtenir une connexion : `Detours-beta` existe et a déjà des migrations appliquées.

Vérifier que le fichier est ignoré :

```powershell
git check-ignore .env.local
```

Redémarrer Vite après modification des variables. Tester la connexion Google avec ton compte et un carnet d'essai convenu avec le propriétaire. Ne pas modifier ses carnets réels pour vérifier que l'installation marche.

Les variables `VITE_*` sont intégrées au navigateur : uniquement des paramètres publics ici. Ne jamais utiliser de clé `service_role`, de clé secrète Supabase ou de secret Google OAuth. Ne pas partager le `.env.local` complet du propriétaire et ne pas afficher des secrets dans les rapports.

## 7. Connecter Vercel et Supabase à ton Claude Code

Une invitation à un service et une connexion MCP sont deux étapes différentes. Après acceptation des invitations, lancer depuis le dossier du projet :

```powershell
claude mcp list
```

Si ces serveurs ne sont pas déjà configurés, les ajouter :

```powershell
claude mcp add --scope local --transport http vercel https://mcp.vercel.com
claude mcp add --scope local --transport http supabase "https://mcp.supabase.com/mcp?project_ref=ehvgecfakbxeatrcnfhm"
claude
```

Dans Claude, taper **`/mcp`** et choisir **Authenticate** pour chaque service. Se connecter dans le navigateur avec tes propres comptes Vercel/Supabase. La portée `local` conserve cette configuration personnelle hors des fichiers Git du projet. Ne pas ajouter une deuxième entrée si le serveur existe déjà ; vérifier sa cible et l'ajuster si nécessaire.

Le MCP Supabase est limité à `Detours-beta` par `project_ref`. Cela limite ce connecteur, mais ne change pas les droits de ton compte au niveau de l'organisation. Pour une première exploration uniquement en lecture, la même URL peut recevoir `&read_only=true` ; ce mode empêchera les écritures SQL.

Première vérification à demander à Claude :

> Vérifie en lecture seule mes accès au dépôt Gustor1/app-vacances-27, au projet Vercel app-vacances-27 de l'équipe eliottle et au projet Supabase Detours-beta, référence ehvgecfakbxeatrcnfhm. Rapporte la cible réellement trouvée et les accès refusés, sans publier, exécuter de migration, lire des données personnelles ou afficher des clés. N'interviens pas sur Mandarin 15M.

Références : [MCP Vercel](https://vercel.com/docs/agent-resources/vercel-mcp), [MCP Supabase](https://supabase.com/docs/guides/ai-tools/mcp), [configuration MCP Claude](https://code.claude.com/docs/en/mcp).

## 8. Vérifier que ton poste est prêt

Contrôles rapides depuis le dépôt :

```powershell
npm test
npm run typecheck
npm run lint
```

Pour le gate complet obligatoire avant une livraison de code, installer PGlite hors du dépôt :

```powershell
npm install --prefix ../detours-test-tools --no-save @electric-sql/pglite@0.5.8
$env:DETOURS_PGLITE_PATH = (Resolve-Path ../detours-test-tools/node_modules/@electric-sql/pglite/dist).Path
npm run verify:local
```

Exemple Bash/Zsh pour la variable, après la même installation PGlite :

```bash
export DETOURS_PGLITE_PATH="$(cd ../detours-test-tools/node_modules/@electric-sql/pglite/dist && pwd)"
npm run verify:local
```

Arrêter d'abord le serveur `npm run dev` pour libérer 5173. Le gate crée ses profils et son serveur, simule Supabase, teste le SQL dans une base isolée et s'arrête au premier échec. Conserver le rapport annoncé dans un dossier temporaire. En cas d'échec, diagnostiquer ; ne pas désactiver le test pour annoncer une réussite.

La version partagée `9f4766d` a été vérifiée le 9 octobre : 104 tests unitaires, 57 parcours navigateur retenus, neuf smokes compilés et 19 étapes du gate réussies. Installation et build sans configuration privée ont aussi réussi dans un dossier neuf. Ce sont les preuves de cette révision sur Windows ; Claude doit vérifier ton poste et ta révision, pas recopier ces chiffres comme ses propres résultats.

Le gate produit un `dist/` avec paramètres Supabase factices. **Reconstruire avec les paramètres de la cible avant une publication.** Ces tests ne valident pas OAuth réel, un iPhone physique ni la disponibilité des services distants.

## 9. Contribuer chaque jour

Avant un nouveau sujet, vérifier que ton dossier est propre, récupérer la base, puis créer une branche distincte. Remplacer le nom du sujet ; réutiliser une branche existante si le travail est déjà commencé.

```powershell
git status
git switch codex/carnets-universels
git pull --ff-only
git switch -c claude/nom-du-sujet
```

Se répartir les sujets avec ton ami. Préserver le mode local, les sauvegardes, les données, les droits serveur et les quatre langues. Les plans documentaires ne sont pas une autorisation de tout implémenter.

Après les modifications et contrôles, examiner `git diff`, sélectionner les seuls fichiers du sujet, puis :

```powershell
git add CHEMIN_DU_FICHIER_DU_SUJET
git commit -m "feat: description du changement"
git push -u origin claude/nom-du-sujet
gh pr create --base codex/carnets-universels --head claude/nom-du-sujet
```

La dernière commande ouvre un parcours interactif pour le titre et la description. Claude peut aussi préparer la pull request directement via GitHub CLI. Faire relire puis fusionner selon votre accord. Aucun push forcé, reset destructif ou fusion automatique dans `main`. GitHub ne force pas cette revue tant qu'une protection de branche n'a pas été configurée.

## 10. Publier ou modifier la base après la prise en main

L'installation et la vérification des accès ne doivent pas publier une nouvelle version, réassigner l'adresse bêta ou appliquer des migrations. Les futures demandes de publication et de migration doivent identifier la cible et le changement à livrer.

Pour une publication autorisée, Claude lit `docs/development/L8.md`, confirme le projet Vercel, la branche cible, les paramètres, les migrations nécessaires et la possibilité de retour arrière. Il prépare et teste le build, publie une preview, puis vérifie le build réellement servi avant de modifier l'adresse stable selon votre demande. Ne pas créer un autre projet Vercel en pensant remplacer celui de l'équipe. Les accès aux previews peuvent être protégés ; être membre permet de s'authentifier selon la configuration existante.

Pour le backend, créer des migrations versionnées dans `supabase/migrations/` et vérifier l'historique distant avant application. Préserver les politiques RLS, la compatibilité et les données. Ne pas réappliquer aveuglément les migrations déjà présentes, ni supprimer une table pour contourner une erreur. Les sauvegardes de carnets et les sauvegardes administrateur PostgreSQL sont deux mécanismes différents.

Un push peut déclencher une preview si Vercel est relié à Git ; une fusion dans la branche de production peut publier le site. Vérifier la configuration réelle avant de changer cette branche. Ne pas utiliser `main` comme cible de pull request par réflexe : votre base actuelle est `codex/carnets-universels`.

## 11. Prompt complet à donner à Claude Code

Copier ce prompt et fournir ce fichier à Claude depuis un dossier où il peut préparer l'installation :

```text
Je rejoins le projet Détours de mon ami. Lis entièrement GUIDE-DEMARRAGE-CLAUDE-CODE.md et utilise-le comme checklist de prise en main sur mon PC.

Ton objectif : installer les outils manquants, récupérer la bonne branche, lancer l'application, configurer mes connexions GitHub/Vercel/Supabase et vérifier mon environnement. Tu peux réaliser les installations nécessaires sur mon poste dans le cadre des permissions que je t'accorde. Vérifie l'existant avant chaque opération et préserve les fichiers/configurations déjà présents.

1. Identifie mon système, mon dossier de travail et les outils installés. Si une information manque, demande seulement ce qui est nécessaire et poursuis les étapes indépendantes.
2. Prépare le message à envoyer au propriétaire avec mon pseudo GitHub, les emails de mes comptes Vercel/Supabase et mon Google de test. Laisse-moi envoyer le message ; ne contacte personne automatiquement.
3. Installe les outils manquants avec les méthodes officielles. Guide-moi pour les connexions navigateur, 2FA et acceptations d'invitations que tu ne peux pas effectuer à ma place. Ne demande pas mes mots de passe ou jetons dans la conversation.
4. Clone Gustor1/app-vacances-27 sur codex/carnets-universels si nécessaire. Si le dossier existe, vérifie son état et préserve mon travail. Configure mon identité Git, installe avec npm ci et démarre Vite.
5. Lis CLAUDE.md, AGENTS.md, README.md et docs/development/COLLABORATION.md. Travaille sur une branche claude/<sujet> dédiée quand une modification est nécessaire.
6. Configure les MCP Vercel et Supabase en portée locale avec mes comptes. Supabase doit cibler uniquement ehvgecfakbxeatrcnfhm. Vérifie mes accès en lecture seule et signale clairement les invitations/droits encore manquants. Ne lis pas les carnets personnels pour tester la connexion et ne touche pas Mandarin 15M.
7. Configure .env.local uniquement après réception des paramètres publics et confirmation de la cible autorisée par le propriétaire. Sinon, continue en mode local. Préserve un fichier déjà présent et vérifie qu'il reste ignoré par Git.
8. Exécute les contrôles adaptés, puis le gate verify:local avec PGlite hors du dépôt et 5173 libre. Rapporte les résultats réels, les échecs et les étapes non exécutées. Le guide contient des preuves historiques ; elles ne remplacent pas tes vérifications.
9. Termine avec un bilan : étapes réalisées, ce que je dois encore faire, ce que le propriétaire doit encore faire, et les éventuels accès refusés. Si une invitation manque, continue l'installation locale plutôt que bloquer toute la prise en main.

Cette prise en main n'autorise aucune dépense, souscription payante, modification de droits par usurpation d'un autre compte, migration distante, déploiement du site, changement d'alias ou fusion dans main. Prépare ce qui peut l'être et distingue les opérations nécessitant ensuite une demande concrète de publication ou de migration. N'active pas de mode contournant les permissions pour finir l'installation.
```

## 12. Checklist finale à envoyer au propriétaire

- [ ] Mon pseudo GitHub et mes emails de services ont été communiqués.
- [ ] GitHub : invitation acceptée et droit de contribution vérifié.
- [ ] Vercel : invitation acceptée et projet de l'équipe trouvé, ou publication conservée par le propriétaire.
- [ ] Supabase : invitation acceptée et périmètre des droits compris, ou travail local seulement.
- [ ] Git, Node/npm, Claude et le navigateur des tests sont disponibles.
- [ ] Le projet est cloné depuis la bonne branche et mon identité Git est configurée.
- [ ] L'application locale s'ouvre.
- [ ] Les MCP sont connectés, ou leur refus/manque d'accès est documenté.
- [ ] La configuration connectée et Google ont été testés si les paramètres/droits étaient disponibles.
- [ ] Les contrôles exécutés ont un résultat consigné ; les autres restent marqués non exécutés.
- [ ] Je sais sur quelle branche contribuer et vers quelle base ouvrir la pull request.

Exemple de bilan : « Local prêt. GitHub prêt. Vercel : invitation en attente. Supabase : connecté au bon projet. Google local : URL de retour à autoriser par le propriétaire. Vérification locale : résultat et chemin du rapport. Aucune publication ni migration réalisée. »
