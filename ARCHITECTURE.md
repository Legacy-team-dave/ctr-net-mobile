# Architecture - CTR.NET Mobile

## Vue d'ensemble

Application Ionic Angular standalone compilée en APK Android via Capacitor. Destinée exclusivement au profil **`CONTROLEUR`** pour le **contrôle terrain** des militaires.

### Mise à jour Avril 2026

- nom installé : `CTR.NET` ;
- application sœur : `ENROL.NET` pour le profil `ENROLEUR` ;
- messages de connexion clarifiés côté mobile ;
- comptes `CONTROLEUR` créés inactifs par défaut jusqu’à activation.

## Stack technique

| Couche | Technologie | Version |
| --- | --- | --- |
| UI Framework | Ionic | 8.0.0 |
| Applicatif | Angular (standalone components) | 20.0.0 |
| Bridge natif | Capacitor | 8.2.0 |
| Langage | TypeScript | 5.9.0 |
| Build | Angular CLI | 20.0.0 |
| CI/CD | GitHub Actions | Node 22, Java 21, API 36 |

## Architecture applicative

```text
src/app/
├── app.routes.ts              ← Routes principales (splash → config → login → tabs)
├── app.component.ts           ← Composant racine
├── guards/
│   └── auth.guard.ts          ← authGuard (vérifie session) + noAuthGuard (empêche double login)
├── models/
│   └── interfaces.ts          ← Interfaces: Militaire, User, LoginResponse, ApiResponse, ControleData
├── services/
│   ├── api.service.ts         ← Client HTTP REST (token Bearer, timeout 15s, IP serveur + tests réseau)
│   ├── auth.service.ts        ← Session utilisateur (Observable user$, checkSession, login, logout)
│   └── cache.service.ts       ← Nettoyage automatique des caches (Preferences, orphans, 24h)
└── pages/
    ├── splash/                ← Splash Angular (5s, logo IG-FARDC, animation)
    ├── config/                ← Configuration IP serveur + test connexion
    ├── login/                 ← Formulaire connexion (CONTROLEUR uniquement)
    ├── controle/              ← Recherche militaire + validation contrôle (2 étapes)
    ├── profil/                ← Affichage profil utilisateur (lecture seule + avatar)
    └── tabs/                  ← Navigation onglets (Contrôle, Profil, Quitter)
```

## Flux de navigation

```text
splash (5s Angular après splash natif 2s) → login → tabs/controle
                                              │
                                              └── config (par bouton dédié ou redirection authGuard si aucune IP n'est configurée)

tabs/
├── controle (onglet 1)
├── profil   (onglet 2)
└── logout   (action de déconnexion)
```

## Communication API

### Schéma réseau

```text
App Mobile (Android)
    ↕ HTTP (Wi-Fi intranet)
Serveur Web (Laragon)
    ↕ PDO
Base de données MySQL
```

### Endpoints utilisés

| Endpoint | Méthode | Données envoyées | Réponse |
| --- | --- | --- | --- |
| `auth.php?action=login` | POST | `{login, password}` | `{success, token, user}` |
| `auth.php?action=logout` | POST | — | `{success}` |
| `auth.php?action=check` | GET | — | `{success, user}` |
| `controles.php?action=search` | GET | `?q=matricule_ou_nom` | `{success, data: Militaire[]}` |
| `controles.php?action=valider` | POST | `ControleData + GPS` | `{success, message}` |
| `controles.php?action=historique` | GET | `?limit=&offset=` | `{success, data: Controle[]}` |
| `profil.php?action=get` | GET | — | `{success, user: User}` |
| `profil.php?action=update` | POST | `{nom, email, ...}` | `{success, message}` |

### Authentification

- Token Bearer transmis via header `Authorization: Bearer <token>`
- Token stocké localement via `@capacitor/preferences`
- Vérification de session à chaque navigation (authGuard)
- Erreur 401 → déconnexion automatique

## Page Configuration — Design unifié (v1.1.0)

Depuis la v1.1.0, la page de configuration IP utilise le même design que la page login :

- Même fond d'image (fardc2.jpg) avec overlay sombre
- Même carte `.card-modern` (border-radius 16px, backdrop-filter blur)
- Même `.input-group-modern` avec icône intégrée
- Boutons natifs `<button>` au lieu de `<ion-button>` (taille identique au login)
- Bouton "Tester" jaune (#ffc107) + Bouton "Continuer" kaki (#3F5A2E)

## Page Contrôle — Logique métier

### Étape 1 : Recherche

- Input libre (minimum 2 caractères, debounce 300ms)
- Recherche par matricule ou nom
- Résultats affichés avec badges catégorie (ACTIF, DCD AV BIO, DCD AP BIO, RETRAITES, INTEGRES)
- Les militaires déjà contrôlés restent visibles, portent le badge `Déjà contrôlé` et ne sont pas sélectionnables

### Étape 2 : Validation

**Militaire Vivant :**

- Statut "Vivant" coché → Bouton "Présent"
- Envoi : `{matricule, mention: 'Présent', lien: 'Militaire lui-même', statut_vivant: true}`

**Militaire Décédé :**

- Statut "Décédé" coché (automatique si catégorie DCD_AV_BIO)
- Bénéficiaire existant affiché + champ nouveau bénéficiaire
- Liens de parenté saisis individuellement : `Epouse`, `Epoux`, `Fils`, `Fille`, `Père`, `Mère`, `Frère`, `Sœur` (sélection exclusive)
- Observations (optionnel)
- Boutons "Favorable" / "Défavorable"
- Envoi : `{matricule, mention, lien, beneficiaire, new_beneficiaire, observations, statut_decede: true}`

### GPS

- Coordonnées GPS capturées automatiquement lors de la validation (timeout 5s)
- Non bloquant en cas d'échec (GPS non disponible)
- Champs `latitude` et `longitude` ajoutés au payload

## Plugins Capacitor

| Plugin | Utilisation |
| --- | --- |
| `@capacitor/geolocation` | Localisation GPS lors de la validation d'un contrôle |
| `@capacitor/network` | Vérification de la connectivité réseau |
| `@capacitor/preferences` | Stockage local de l'IP serveur et du token |
| `@capacitor/splash-screen` | Écran de démarrage natif (2s, couleur kaki) |
| `@capacitor/status-bar` | Barre d'état Android (couleur kaki, texte clair) |
| `WifiIp` (plugin natif local) | Détection de l'adresse IP WiFi locale (Android natif) |

## Configuration serveur (mode actuel)

L'application mobile fonctionne actuellement en **saisie manuelle de l'IP serveur** sur la page `config` :

1. L'utilisateur saisit l'IP du serveur (ex. `10.71.62.9`)
2. L'app teste la connectivité via `auth.php?action=check`
3. En cas de succès, l'IP est sauvegardée (`server_ip`) et réutilisée aux prochaines ouvertures

Les mécanismes de détection automatique restent présents côté service API pour diagnostic, mais **le flux utilisateur officiel est manuel**.

### Plugin natif WifiIp

Plugin Capacitor local (`WifiIpPlugin.java`) enregistré dans `MainActivity.java` :
- Utilise `ConnectivityManager` (API 23+) en priorité
- Fallback sur `WifiManager.getConnectionInfo()` pour les anciennes versions
- Permissions requises : `ACCESS_WIFI_STATE`, `ACCESS_NETWORK_STATE`

### Prérequis réseau

- Le PC serveur (Laragon) et le mobile doivent être sur le **même réseau WiFi**
- Par défaut, Laragon expose Apache sur `0.0.0.0:80` : dans ce cas, aucun `:port` n’est à saisir côté mobile
- Un port explicite n’est nécessaire que si vous avez changé la configuration par défaut de Laragon / Apache
- Le pare-feu Windows doit autoriser Apache en entrée (au minimum sur le port réellement utilisé)

## Thème visuel

- **Primaire** : Kaki militaire `#5C7A4D`
- **Secondaire** : Kaki foncé `#3F5A2E`
- **Police** : Barlow (Regular, Medium, SemiBold, Bold)
- **Icône** : Logo IG-FARDC
- **Cards** : `.card-modern` avec ombre douce et gradient
- **Badges** : Couleurs par catégorie (vert actif, rouge décédé, orange retraité, bleu intégré)

## CI/CD

Build APK automatisé via GitHub Actions (`.github/workflows/build-apk.yml`) :

1. Déclenché par push sur `main` ou `workflow_dispatch`
2. Ubuntu-latest + Node 22 + Java 21 + Android SDK API 36 (minSdk 24)
3. `npm ci` → `ng build --configuration production` → `cap sync android` → `gradlew assembleDebug`
4. APK uploadé en artifact (`ctr.net-fardc-mobile.apk`)
5. Release GitHub créée ou mise à jour automatiquement pour le tag `v<version>` avec l'APK en téléchargement direct

## Gestion du cache (v1.3.0)

Le `CacheService` gère le nettoyage automatique des données locales :

| Mécanisme | Déclencheur | Action |
| --- | --- | --- |
| Purge orphelines | Démarrage app (toutes les 24h) | Supprime les clés Preferences non gérées |
| Session cleanup | Logout | Supprime le token Bearer |
| Reset complet | Manuel (`clearAll()`) | Supprime toutes les clés Preferences |
| Diagnostic | Manuel (`getStorageStats()`) | Retourne le nombre de clés et d'orphelines |

### Clés Preferences gérées

| Clé | Usage | Durée de vie |
| --- | --- | --- |
| `server_ip` | Adresse IP du serveur | Persistant |
| `auth_token` | Token Bearer de session | Jusqu'au logout |
| `last_cache_cleanup` | Timestamp dernière purge | Interne (24h) |

## Synchronisation avec le web

- Les contrôles effectués depuis le mobile sont immédiatement visibles côté web
- `modules/controles/liste.php` (web) interroge `api/controles_poll.php` toutes les 10 secondes
- Toast notification affiché côté web avec le même design que le mobile
- Rechargement automatique du DataTable
