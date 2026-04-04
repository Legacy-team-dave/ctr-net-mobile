# Fonctionnement complet — Web + ENROL.NET

Ce document décrit le fonctionnement combiné du backend `CTR.NET-FARDC` et de l’application mobile `ENROL.NET`, dédiée à l’**enrôlement des militaires vivants**.

---

## 1. Vue d'ensemble du système

L’écosystème comporte désormais **trois briques complémentaires** :

```text
┌──────────────────────────┐
│   APPLICATION WEB        │
│   CTR.NET-FARDC          │
│   Profils web :          │
│   - ADMIN_IG             │
│   - OPERATEUR            │
└─────────────┬────────────┘
              │ API REST
      ┌───────┴────────┬───────────────────────┐
      ▼                ▼                       ▼
┌───────────────┐ ┌───────────────┐   ┌─────────────────────┐
│ CTR.NET       │ │ ENROL.NET     │   │ Base MySQL          │
│ CONTROLEUR    │ │ ENROLEUR      │   │ + enrollements      │
│ Contrôle      │ │ Enrôlement    │   │ + logs + utilisateurs│
└───────────────┘ └───────────────┘   └─────────────────────┘
```

`ENROL.NET` est l’application mobile spécialisée dans l’enrôlement avec **photo, empreintes et synchronisation différée**.

---

## 2. Application Web — Fonctionnement détaillé

### 2.1. Technologies

| Composant | Technologie | Version |
| --- | --- | --- |
| Langage serveur | PHP | 8.x |
| Base de données | MySQL | 8.x (via Laragon) |
| Serveur HTTP | Apache | (via Laragon) |
| UI Framework | AdminLTE | 3.2 |
| CSS Framework | Bootstrap | 5.1.3 |
| JavaScript | jQuery | 3.6 |
| Chiffrement | AES-256-CBC | OpenSSL |

### 2.2. Profils utilisateurs

L'application web gère quatre profils avec des accès distincts :

#### ADMIN_IG (Administrateur Inspectorat Général)

- Accès complet à tous les modules.
- Redirection après login vers `index.php` (dashboard).
- Gestion des utilisateurs, des militaires, des contrôles et des paramètres.
- Consultation des logs d'audit et des rapports.

#### OPERATEUR

- Accès opérationnel avec tableau de bord.
- Redirection conditionnelle selon les préférences et équipes configurées.
- Saisie de contrôles, consultation de listes et exports.
- Accès limité aux modules d'administration.

#### CONTROLEUR

- Profil réservé exclusivement à l'application mobile `CTR.NET`.
- Connexion web bloquée.
- Accès uniquement via l'app de contrôle terrain.

#### ENROLEUR

- Profil réservé exclusivement à l'application mobile `ENROL.NET`.
- Connexion web bloquée.
- Accès uniquement via l'app d’enrôlement terrain.

### 2.3. Authentification web

1. L'utilisateur accède à `login.php`.
2. Il saisit son identifiant (login, nom ou email) et son mot de passe.
3. Le système vérifie les identifiants dans la base MySQL (mot de passe hashé bcrypt).
4. Si valide, une session PHP est créée avec les informations utilisateur.
5. Option "Se souvenir de moi" : un cookie de session persistant est défini.
6. Redirection selon le profil (ADMIN_IG → dashboard, OPERATEUR → flux web, CONTROLEUR/ENROLEUR → **bloqués côté web** et orientés vers leurs applications mobiles dédiées).
7. En cas d'échec, un log d'échec de connexion est enregistré.

### 2.4. Flux de contrôle (web)

#### Saisie d'un contrôle depuis le web

1. **Recherche** : Le contrôleur saisit un matricule ou nom dans le champ de recherche (AJAX autocomplete).
1. **Résultats** : Les militaires correspondants s'affichent avec leur catégorie, grade, unité.
1. **Sélection** : Cliquer sur un militaire ouvre sa fiche détaillée.
1. **Vérification doublon** : Le système marque les militaires déjà contrôlés dans les résultats avec un badge `Déjà contrôlé` et les rend non sélectionnables.
1. **Statut** : Cases à cocher "Vivant" ou "Décédé" (automatique selon la catégorie).
1. **Militaire vivant** : mention automatique "Présent", lien de parenté automatique "Militaire lui-même" et un seul bouton "Présent" pour valider. Une fois enregistré, un **QR d’enrôlement** devient disponible dans `modules/controles/liste.php`.
1. **Militaire décédé** : bénéficiaire existant affiché si présent, champ nouveau bénéficiaire disponible, sélection obligatoire d'un lien parmi `Epouse`, `Epoux`, `Fils`, `Fille`, `Père`, `Mère`, `Frère`, `Sœur`, champ observations optionnel et deux boutons "Favorable" / "Défavorable". **Aucun QR d’enrôlement n’est généré dans ce cas.**
1. **Enregistrement** : Insertion en base avec horodatage, ID contrôleur, coordonnées GPS (si mobile).
1. **Toast de confirmation** : Notification visuelle de succès.

### 2.5. Modules principaux

- **Administration** : Gestion des utilisateurs, des rôles et des logs d'audit.
- **Militaires** : Référentiel des militaires (import, consultation, export).
- **Contrôles** : Saisie et consultation des contrôles avec filtres, recherche et exports.
- **Équipes / Synchronisation** : Préparation et envoi des `equipes` et `controles` en attente vers l'instance centrale.
- **Rapports** : Tableaux de bord et statistiques consolidées.
- **Paramètres** : Configuration système et préférences utilisateur.

### 2.6. Sécurité web

- **Session PHP** : Vérification d'authentification sur chaque page (`require_login()`).
- **Contrôle de profil** : Fonctions `check_profil()` et `verifier_acces()` limitent l'accès par rôle.
- **Chiffrement AES-256-CBC** (v1.1.0+) : la commande `php bin/encrypt.php encrypt` cible par défaut 8 fichiers sensibles ; le chiffrement n'est pas activé automatiquement à l'installation.
- **Mots de passe** : Hashage bcrypt, réinitialisation par token temporaire.
- **Logs** : Connexions, échecs, ajouts, exports, modifications sont journalisés.
- **CSRF** : Protection des formulaires sensibles.

### 2.7. Sauvegardes automatiques

- **Fréquence** : Toutes les 8 heures (tâche planifiée Windows).
- **Format** : CSV (Excel compatible) + XLSX.
- **Mode** : Consolidé (ancienne + nouvelles données dans la même archive ZIP mise à jour).
- **Archive principale** : `backups/backup_consolide_latest.zip`.
- **Sources principales** : tables `controles` et `equipes` pour le périmètre actif de synchronisation (les flux liés aux litiges ne font plus partie du circuit actif).
- **Purge** : Suppression automatique des archives de plus de 60 jours + conservation des 30 dernières archives non identiques + déduplication SHA256.
- **Scripts** : `setup_backup_task.bat`, `setup_backup_task.ps1`, `run_backup_job.ps1`.

---

## 3. Application Mobile — Fonctionnement détaillé

### 3.1. Technologies

| Composant | Technologie | Version |
| --- | --- | --- |
| UI Framework | Ionic | 8.0.0 |
| Applicatif | Angular (standalone) | 20.0.0 |
| Bridge natif | Capacitor | 8.2.0 |
| Langage | TypeScript | 5.9.0 |
| Build | Angular CLI | 20.0.0 |
| CI/CD | GitHub Actions | Node 22, Java 21 |
| Cible Android | SDK API | 36 (minSdk 24) |

### 3.2. Profil unique : ENROLEUR

L'application `ENROL.NET` est conçue exclusivement pour le profil `ENROLEUR`.
Le backend refuse les autres profils et renvoie des messages explicites si le compte est absent, inactif ou non autorisé.

### 3.3. Flux complet de l'application

#### 3.3.1. Écran splash

- Au lancement, le splash Capacitor natif s'affiche brièvement (`launchShowDuration: 2000`).
- Ensuite, le splash Angular `ENROL.NET` s'affiche avec une animation de fondu.
- Le splash Angular dure 5 secondes, puis redirige vers `/login`.
- La redirection vers `/config` intervient plus tard via `authGuard` lorsqu'un accès protégé est tenté sans IP configurée.

#### 3.3.2. Page de configuration IP (design identique au login)

- **Design** : Même fond d'image (fardc2.jpg) avec overlay sombre à 60%, même carte blanche avec border-radius 16px et backdrop-filter blur.
- **Logo** : `ENROL.NET` en haut (même présentation que le login).
- **Saisie manuelle** : L'adresse IP du serveur est saisie manuellement par l'utilisateur sur le réseau Wi-Fi local.
- **Champ IP** : `.input-group-modern` avec icône Wi-Fi intégrée, préfixe visuel fixe `http://` et champ éditable (ex. `10.71.62.9` ou `10.71.62.9:8080` si un port personnalisé est réellement utilisé).
- **Bouton "Tester la connexion"** : Jaune (#ffc107), même taille que le bouton de connexion (padding 12px, width 100%).
- **Test** : Envoie une requête GET à `http://{IP}/ctr.net-fardc/api/auth.php?action=check` avec timeout de 8 secondes. Si le serveur répond (même avec 401), la connexion est considérée comme réussie.
- **Laragon** : en configuration standard, il n’est pas nécessaire de saisir `:port` car Apache écoute déjà sur `80`.
- **Bouton "Continuer"** : Bleu profond (#003C8F), même taille, activé uniquement après un test réussi.
- **Stockage** : L'IP est sauvegardée via `Capacitor Preferences` sous la clé `server_ip`, sans conserver le préfixe `http://`.

#### 3.3.3. Page de connexion

- **Design** : Fond d'image fardc2.jpg avec overlay sombre, logo `ENROL.NET`, carte `.card-modern`.
- **Champs** :
  - Identifiant : `.input-group-modern` avec icône "person", autocomplete "username".
  - Mot de passe : `.input-group-modern` avec icône "lock-closed", bouton eye/eye-off pour afficher/masquer.
- **Bouton "Se connecter"** : Jaune (#ffc107), pleine largeur, padding 12px.
- **Séparateur** : Ligne "ou" pour accéder à la config serveur.
- **Bouton "Configurer le serveur"** : Bleu profond (#003C8F), même taille.
- **Processus** :
  1. Envoi POST à `api/auth.php?action=login` avec `{login, password}`.
  2. Le serveur vérifie les identifiants et le profil (`ENROLEUR` uniquement).
  3. Si succès : token Bearer retourné, stocké localement, redirection vers `/tabs/controle`.
  4. Si échec : toast d'erreur en haut de l'écran ; les erreurs de validation locale restent affichées inline.

#### 3.3.4. Navigation par onglets

Trois onglets sont disponibles après connexion :

1. **ENROL.NET** (onglet par défaut) : assistant d’enrôlement terrain.
2. **Profil** : affichage des informations de l’utilisateur connecté (lecture seule avec avatar).
3. **Quitter** : déconnexion avec confirmation → retour au login.

Les onglets sont protégés par `authGuard` : si le token est invalide ou la session expirée, l'utilisateur est redirigé vers le login. Le guard `noAuthGuard` empêche un utilisateur déjà connecté d'accéder au login.

#### 3.3.5. Assistant d’enrôlement — Étape 1 : Photo

- **Objectif** : démarrer le dossier avec la photo du militaire.
- **Action** : capture caméra ou import d’image selon l’équipement disponible.
- **Contrôle** : une photo valide est exigée avant de poursuivre.

#### 3.3.6. Assistant d’enrôlement — Étapes 2 à 5 : biométrie, QR et synchronisation

- **Étape 2 : Empreintes** — saisie/association des empreintes selon l’équipement disponible.
- **Étape 3 : QR / informations** — scan du QR affiché côté web, sans import d’image QR et sans saisie manuelle/externe.
- **Étape 4 : Validation** — vérification des données personnelles récupérées puis validation finale du dossier.
- **Étape 5 : Sync** — envoi immédiat ou mise en file locale pour synchronisation en fin de journée.

### Données locales

- Les enrôlements non encore envoyés sont conservés via `enrollement-local.service.ts`.
- La reprise d’un dossier interrompu est possible tant qu’il n’a pas été synchronisé.
- Le backend enregistre les soumissions via `api/controles.php?action=enroll_vivant`.

#### 3.3.7. Page Profil

La page **Profil** affiche les informations du compte `ENROLEUR` connecté dans une carte en lecture seule :
identité utilisateur, rôle/profil, état du compte, avatar et résumé de session.

Cette page n’est pas destinée à la saisie des enrôlements : elle sert uniquement à la consultation du profil et à la vérification du contexte de connexion.

**Statut Vivant (catégorie Actif, RETRAITES, INTEGRES)** :

- La case "Vivant" est cochée automatiquement.
- Un seul bouton vert "Présent" est affiché.
- Au clic : `{matricule, mention: 'Présent', lien: 'Militaire lui-même', statut_vivant: true}`.

**Statut Décédé (catégorie DCD_AV_BIO, DCD_AP_BIO)** :

- La case "Décédé" est cochée automatiquement.
- Le bénéficiaire existant est affiché dans un cadre vert clair.
- Un champ "Nouveau bénéficiaire" est disponible.
- Les liens de parenté sont présentés individuellement en grille : `Epouse`, `Epoux`, `Fils`, `Fille`, `Père`, `Mère`, `Frère`, `Sœur`.
- Chaque lien est une case à cocher visuelle (div/span, pas d'input natif) avec exclusion mutuelle.
- Champ observations en textarea (optionnel).
- Deux boutons :
  - "Favorable" (jaune #ffc107) → `{mention: 'Favorable'}`.
  - "Défavorable" (rouge #dc3545) → `{mention: 'Défavorable'}`.

**GPS** :

- Avant l'envoi, l'app demande la position GPS via `@capacitor/geolocation`.
- Timeout de 5 secondes. Si le GPS n'est pas disponible, le contrôle est envoyé sans coordonnées.
- Les champs `latitude` et `longitude` sont ajoutés au payload s'ils sont disponibles.

**Envoi** :

- POST à `api/controles.php?action=valider` avec le payload complet.
- En cas de succès : toast Ionic vert de confirmation + retour à la recherche.
- En cas d'échec : toast rouge avec le message d'erreur.
- Si le militaire est déjà contrôlé : toast `warning` avec le nom du militaire en gras.

#### 3.3.7. Page Profil

- Affiche les informations du contrôleur connecté : nom, login, email, profil, dernier accès.
- Avatar affiché (image depuis le serveur ou placeholder).
- Lecture seule. La modification du profil se fait depuis l'application web.

#### 3.3.8. Déconnexion

- L'action de déconnexion est portée par l'onglet "Déconnexion".
- Si confirmé : POST à `api/auth.php?action=logout`, suppression du token local, redirection vers `/login`.
- Le guard `noAuthGuard` empêche de revenir sur le login si déjà connecté.

### 3.4. Services Angular

#### ApiService (`api.service.ts`)

- Client HTTP central. Toutes les requêtes passent par la méthode `request<T>(method, endpoint, body?)`.
- Construit l'URL de base dynamiquement : `http://{IP stockée}/ctr.net-fardc/api`.
- Ajoute automatiquement le header `Authorization: Bearer {token}`.
- Timeout de 15 secondes sur chaque requête.
- Gestion d'erreurs : messages lisibles pour erreur réseau (status 0), session expirée (401), accès refusé (403), timeout.
- Stockage : `setServerIP()`, `getServerIP()`, `setToken()`, `getToken()`, `clearToken()` via Capacitor Preferences.

#### AuthService (`auth.service.ts`)

- Gère l'état de l'utilisateur connecté via `BehaviorSubject<User | null>`.
- `checkSession()` : Vérifie le token et l'IP stockés, puis appelle `auth.php?action=check`. Si valide, met à jour le subject utilisateur. Si invalide, efface le token.
- `login(login, password)` : Appelle `auth.php?action=login`, stocke le token, met à jour le subject.
- `logout()` : Appelle `auth.php?action=logout`, efface le token, redirige vers `/login`.
- `hasServerConfigured()` : Vérifie si une IP serveur est stockée.

### 3.5. Guards de navigation

- **authGuard** : Vérifie que l'utilisateur est connecté. Si non, vérifie si un serveur est configuré. Si oui → `/login`. Si non → `/config`.
- **noAuthGuard** : Empêche un utilisateur connecté d'accéder au login. Si connecté → `/tabs/controle`.

### 3.6. Interfaces TypeScript

```typescript
interface Militaire {
  matricule: string; noms: string; grade: string; unite: string;
  garnison: string; province: string; statut: string; categorie: string;
  beneficiaire: string; age?: number; deja_controle?: boolean;
}

interface User {
  id_utilisateur: number; login: string; nom_complet: string;
  email: string; avatar: string; profil: string;
  dernier_acces: string; created_at: string;
}

interface LoginResponse {
  success: boolean; message?: string; token?: string;
  user?: { id: number; nom: string; login: string; profil: string; };
}

interface ApiResponse<T = unknown> {
  success: boolean; message?: string; data?: T; user?: User;
}

interface ControleData {
  matricule: string; mention: string; lien: string;
  beneficiaire?: string; new_beneficiaire?: string;
  observations?: string; statut_vivant?: boolean; statut_decede?: boolean;
}
```

### 3.7. Plugins Capacitor

| Plugin | Utilisation |
| --- | --- |
| `@capacitor/geolocation` | Capture GPS lors de la validation (timeout 5s, non bloquant) |
| `@capacitor/network` | Vérification de la connectivité réseau |
| `@capacitor/preferences` | Stockage local de l'IP serveur et du token Bearer |
| `@capacitor/splash-screen` | Écran de démarrage natif (2s, fond kaki #3F5A2E) |
| `@capacitor/status-bar` | Barre d'état Android (couleur kaki, texte clair) |

### 3.8. Build et CI/CD

Le workflow GitHub Actions (`.github/workflows/build-apk.yml`) :

1. Déclenché par push sur `main` ou déclenchement manuel (`workflow_dispatch`).
2. Ubuntu-latest + Node.js 22 (avec cache npm) + Java JDK 21 Temurin.
3. Installation Android SDK : `platforms;android-36` + `build-tools;35.0.0`.
4. `npm ci` → `npx ng build --configuration production` → `npx cap sync android`.
5. `chmod +x gradlew && ./gradlew assembleDebug`.
6. L'APK est uploadé en artifact sous le nom `ctr-net-enrollement-mobile-apk-v<version>`.
7. En local, `BUILD_APK.bat` et `build_apk.ps1` copient aussi un APK distribuable vers `dist/apk/ctr-net-enrollement-mobile-latest-debug.apk`.

---

## 4. Communication entre Web et Mobile

### 4.1. API REST

L'application web expose une API REST dans le dossier `api/` pour le mobile :

| Fichier | Endpoints | Description |
| --- | --- | --- |
| `api/auth.php` | `?action=login`, `?action=logout`, `?action=check` | Authentification par token Bearer |
| `api/controles.php` | `?action=search`, `?action=valider`, `?action=historique` | Recherche, validation et historique des contrôles |
| `api/profil.php` | `?action=get`, `?action=update` | Lecture et mise à jour du profil |
| `api/controles_poll.php` | `?since_id={id}` | Polling pour notifications temps réel |
| `api/.htaccess` | — | Headers CORS + Authorization pour les appels cross-origin |

### 4.2. Authentification API

1. Le mobile envoie POST `{login, password}` à `api/auth.php?action=login`.
2. Le serveur vérifie les identifiants et le profil (`ENROLEUR` requis).
3. Si valide : génère un token Bearer unique, le stocke en base, le retourne dans la réponse.
4. Pour chaque requête suivante, le mobile envoie le header `Authorization: Bearer {token}`.
5. Le serveur valide le token à chaque requête. Si invalide/expiré → réponse 401.
6. Le mobile détecte le 401 et déconnecte automatiquement l'utilisateur.

### 4.3. Synchronisation temps réel

1. Un contrôle est validé depuis le mobile → enregistré en base MySQL avec un ID auto-incrémenté.
2. Le web (`modules/controles/liste.php`) exécute un polling JavaScript toutes les 10 secondes.
3. Le polling appelle `api/controles_poll.php?since_id={dernier_id_connu}`.
4. Si de nouveaux contrôles existent, le serveur retourne la liste avec `source: 'mobile'`.
5. Le web affiche une notification toast (design gradient kaki, animation slideIn, durée 3s).
6. Le DataTable est rechargé automatiquement pour afficher les nouveaux contrôles.

### 4.4. Schéma réseau

```text
Smartphone Android          PC Serveur (Laragon)
┌─────────────┐             ┌─────────────────────┐
│ ENROL.NET   │   Wi-Fi     │ Apache              │
│ Mobile      │◄───────────►│ ├── api/auth.php     │
│ (APK)       │   HTTP      │ ├── api/controles.php│
│             │   REST      │ ├── api/profil.php   │
│ GPS         │             │ └── api/poll.php     │
│ Token       │             │                     │
│ IP config   │             │ MySQL               │
└─────────────┘             │ ├── utilisateurs    │
                            │ ├── militaires      │
                            │ ├── controles       │
                            │ └── logs            │
                            └─────────────────────┘
```

---

## 5. Thème visuel unifié

Les deux applications partagent le même thème visuel :

| Élément | Web | Mobile |
| --- | --- | --- |
| Couleur primaire | #5C7A4D | #0057B8 |
| Couleur secondaire | #3F5A2E | #003C8F |
| Police | Barlow | Barlow |
| Logo | CTR.NET-FARDC | ENROL.NET |
| Cards | `.card-modern` (AdminLTE) | `.card-modern` (CSS natif) |
| Bouton principal | Jaune #ffc107 | Jaune #ffc107 |
| Bouton secondaire | Kaki #3F5A2E | Bleu #003C8F |
| Fond login | fardc2.jpg + overlay | fardc2.jpg + overlay |
| Fond config | — | fardc2.jpg + overlay |
| Toast succès | Gradient kaki + slideIn | Ionic toast vert |

---

## 6. Sécurité comparée

| Aspect | Web | Mobile |
| --- | --- | --- |
| Authentification | Session PHP + cookies | Token Bearer + Preferences |
| Mots de passe | bcrypt | bcrypt (vérifié côté serveur) |
| Contrôle d'accès | `check_profil()` par page | `authGuard` + vérification API |
| Chiffrement fichiers | AES-256-CBC (8 fichiers) | N/A (code compilé en APK) |
| Logs d'audit | Table `logs` MySQL | Via API (logs côté serveur) |
| CORS | Headers dans `.htaccess` | `cleartext: true` + `allowNavigation: ['*']` |
| Timeout | — | 15 secondes par requête |

---

## 7. Déploiement

### 7.1. Web

1. Installer Laragon (Apache + MySQL + PHP 8).
2. Cloner le dépôt `ctr.net-fardc` dans le dossier `www/`.
3. Importer la base de données MySQL.
4. Configurer `config/database.php` (hôte, utilisateur, mot de passe, nom de base).
5. Accéder à `http://localhost/ctr.net-fardc/login.php`.
6. (Optionnel) Configurer la tâche planifiée pour les sauvegardes automatiques.
7. (Optionnel) Chiffrer les fichiers sensibles via `php bin/encrypt.php encrypt`.

### 7.2. Mobile

1. Le serveur web doit être opérationnel et accessible sur le réseau Wi-Fi.
2. Télécharger l'APK depuis les artifacts GitHub Actions ou générer localement via `BUILD_APK.bat` / `build_apk.ps1`.
3. Utiliser `INSTALL_APK.bat` pour installation ADB rapide (USB) ou installer manuellement l'APK (`dist/apk/ctr-net-enrollement-mobile-latest-debug.apk`).
4. Au premier lancement : configurer l'IP du serveur et tester la connexion.
5. Se connecter avec un compte `ENROLEUR`.
6. Commencer les contrôles terrain.

---

## 8. Références

| Document | Emplacement | Contenu |
| --- | --- | --- |
| README web | `ctr.net-fardc/README.md` | Vue d'ensemble web |
| README mobile | `ctr-net-enrollement-mobile/README.md` | Vue d'ensemble mobile |
| Architecture web | `ctr.net-fardc/ARCHITECTURE.md` | Architecture technique web |
| Architecture mobile | `ctr-net-enrollement-mobile/ARCHITECTURE.md` | Architecture technique mobile |
| Versions web | `ctr.net-fardc/VERSION.md` | Historique versions web |
| Versions mobile | `ctr-net-enrollement-mobile/VERSION.md` | Historique versions mobile |
| Présentation web | `ctr.net-fardc/PRESENTATION_CTR_NET_FARDC.md` | Présentation slides web |
| Présentation mobile | `ctr-net-enrollement-mobile/PRESENTATION_ENROL_NET_MOBILE.md` | Présentation slides mobile |
| Prompt web | `ctr.net-fardc/PROMPT_PRESENTATION.md` | Prompt IA présentation web |
| Prompt mobile | `ctr-net-enrollement-mobile/PROMPT_PRESENTATION.md` | Prompt IA présentation mobile |
| Guide admin | `ctr.net-fardc/ADMIN_GUIDE.md` | Guide administrateur |
| Guide contrôleur | `ctr.net-fardc/CONTROLEUR_GUIDE.md` | Guide contrôleur terrain |
| Fonctionnement web | `ctr.net-fardc/FONCTIONNEMENT_APPLICATION.md` | Fonctionnement détaillé web |
| Démarrage rapide | `ctr-net-mobile/QUICKSTART.txt` | Installation rapide mobile |
| Structure | `ctr-net-mobile/STRUCTURE.txt` | Arborescence fichiers mobile |
