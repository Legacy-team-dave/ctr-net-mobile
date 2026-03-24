# CTR.NET Mobile — Application CONTROLEUR (Ionic Angular)

## Description

Application mobile Android destinée exclusivement au profil **CONTROLEUR** de l'application web CTR.NET-FARDC. Elle communique avec l'API REST du projet web via le réseau Wi-Fi (IPv4).

> Ce projet est **indépendant** du projet web `ctr.net-fardc`. Il se trouve dans son propre dossier `ctr-net-mobile/`.

## Architecture

```text
ctr-net-mobile/
├── .github/
│   └── workflows/
│       └── build-apk.yml           ← CI/CD GitHub Actions (APK automatique)
├── src/
│   ├── app/
│   │   ├── guards/
│   │   │   └── auth.guard.ts       ← Guards d'authentification (authGuard, noAuthGuard)
│   │   ├── models/
│   │   │   └── interfaces.ts       ← Interfaces TypeScript (Militaire, User, ControleData)
│   │   ├── pages/
│   │   │   ├── config/             ← Configuration IP serveur + test connexion
│   │   │   ├── controle/           ← Recherche + validation militaire (2 étapes)
│   │   │   ├── login/              ← Connexion CONTROLEUR
│   │   │   ├── profil/             ← Affichage profil utilisateur (lecture seule)
│   │   │   ├── splash/             ← Écran de démarrage (5 secondes)
│   │   │   └── tabs/               ← Navigation par onglets (Contrôle, Profil, Quitter)
│   │   ├── services/
│   │   │   ├── api.service.ts      ← Client HTTP (API REST + gestion token)
│   │   │   ├── auth.service.ts     ← Gestion de l'authentification et session
│   │   │   └── cache.service.ts    ← Nettoyage automatique des caches
│   │   ├── app.component.ts
│   │   └── app.routes.ts           ← Routes principales
│   ├── assets/
│   │   ├── img/                    ← Logo FARDC, images
│   │   ├── icon/                   ← Icônes progressives
│   │   └── fonts/                  ← Police Barlow (Regular/Medium/SemiBold/Bold)
│   ├── theme/
│   │   └── variables.scss          ← Thème kaki militaire (#5C7A4D / #3F5A2E)
│   ├── environments/               ← Environnements dev/prod
│   ├── index.html
│   ├── main.ts
│   └── global.scss                 ← Styles globaux (police Barlow)
├── android/                        ← Projet Android Studio (Capacitor)
├── www/                            ← Build output (après ng build)
├── capacitor.config.ts             ← Configuration Capacitor (appId, plugins)
├── angular.json                    ← Configuration Angular CLI
├── ionic.config.json               ← Configuration Ionic
├── package.json                    ← Dépendances NPM
└── README.md
```

## Communication avec le serveur web

### 2. Communication avec l'application web

- L'application mobile communique avec l'application web `ctr.net-fardc` via IPv4 sur le réseau Wi-Fi.
- Le téléphone et le PC serveur doivent être connectés au même réseau.
- Avant connexion, l'utilisateur renseigne manuellement l'adresse IP du serveur web.
- Cette IP est stockée localement (`server_ip`) et peut être modifiée à tout moment depuis la page Configuration.

L'app mobile utilise les endpoints API dans `ctr.net-fardc/api/` :

| Endpoint | Méthode | Description |
| --- | --- | --- |
| `/api/auth.php?action=login` | POST | Connexion (CONTROLEUR uniquement) |
| `/api/auth.php?action=logout` | POST | Déconnexion |
| `/api/auth.php?action=check` | GET | Vérification de session |
| `/api/controles.php?action=search` | GET | Recherche de militaire (matricule ou nom) |
| `/api/controles.php?action=valider` | POST | Validation d'un contrôle + coordonnées GPS |
| `/api/controles.php?action=historique` | GET | Historique des contrôles |
| `/api/profil.php?action=get` | GET | Lecture du profil |
| `/api/profil.php?action=update` | POST | Mise à jour du profil |

## Prérequis

1. **Node.js** (v22+) — [nodejs.org](https://nodejs.org)
2. **Java JDK 21** — [adoptium.net](https://adoptium.net)
3. **Android Studio** — [developer.android.com](https://developer.android.com/studio)
   - Installer le **Android SDK** (API Level 36)
   - Build Tools 35.0.0
   - Configurer la variable `ANDROID_HOME`

## Installation

```bash
cd ctr-net-mobile
npm install
```

## Développement (navigateur)

```bash
npm start
# ou
ionic serve
```

L'application s'ouvre sur `http://localhost:4200`.

## Compilation APK

### Méthode 1 : GitHub Actions (recommandée)

Chaque push sur la branche `main` déclenche automatiquement le build APK via GitHub Actions. L'APK est disponible en téléchargement dans la section **Artifacts** du workflow.

Repository : <https://github.com/Legacy-team-dave/ctr-net-mobile/actions>

### Méthode 2 : Ligne de commande

```bash
# 1. Build Angular production
npx ng build --configuration production

# 2. Synchroniser Capacitor
npx cap sync android

# 3. Build APK
cd android
./gradlew assembleDebug

# L'APK se trouve dans : android/app/build/outputs/apk/debug/app-debug.apk
```

### Méthode 3 : Android Studio

```bash
npx ng build --configuration production
npx cap sync android
npx cap open android
```

Puis dans Android Studio : **Build → Build Bundle(s)/APK(s) → Build APK(s)**

## Flux de l'application

1. **Splash screen** → Logo IG-FARDC avec animation (5 secondes)
2. **Premier lancement** → Saisie manuelle de l'IP serveur + test de connexion
3. **Test de connexion** → Vérifie que l'API est joignable
4. **Connexion** → Login/mot de passe (profil CONTROLEUR uniquement)
5. **Onglet Contrôle** → Recherche par matricule/nom → Sélection militaire
6. **Contrôle Vivant** → Bouton "Présent" (mention automatique)
7. **Contrôle Décédé** → Bénéficiaire + Lien de parenté + Observations → "Favorable" ou "Défavorable"
8. **Onglet Profil** → Consultation des informations (lecture seule avec avatar)
9. **Quitter** → Déconnexion avec confirmation

## Mentions de contrôle

- **Présent** — Militaire vivant confirmé sur site
- **Favorable** — Bénéficiaire décédé conforme
- **Défavorable** — Bénéficiaire décédé non conforme

## Liens de parenté (pour décédé)

- Epouse / Epoux
- Fils / Fille
- Père / Mère
- Frère / Sœur

## Catégories militaires

| Catégorie | Badge | Description |
| --- | --- | --- |
| Actif | Vert | Militaire en service actif |
| DCD_AV_BIO | Rouge foncé | Décédé avant biométrie |
| DCD_AP_BIO | Rouge | Décédé après biométrie |
| RETRAITES | Orange | Militaire retraité |
| INTEGRES | Bleu | Militaire intégré |

## Technologies

| Technologie | Version | Rôle |
| --- | --- | --- |
| **Ionic** | 8.0.0 | Framework UI mobile |
| **Angular** | 20.0.0 | Framework applicatif (standalone components) |
| **Capacitor** | 8.2.0 | Bridge natif Android |
| **TypeScript** | 5.9.0 | Langage typé |
| **RxJS** | 7.8.0 | Programmation réactive |

## Plugins Capacitor

| Plugin | Version | Utilisation |
| --- | --- | --- |
| `@capacitor/geolocation` | 8.1.0 | Coordonnées GPS lors de la validation |
| `@capacitor/network` | 8.0.1 | Détection connectivité Wi-Fi |
| `@capacitor/preferences` | 8.0.1 | Stockage local (IP serveur, token) |
| `@capacitor/splash-screen` | 8.0.1 | Écran de démarrage natif |
| `@capacitor/status-bar` | 8.0.1 | Barre d'état kaki #3F5A2E |

## Configuration Capacitor

```typescript
appId: 'net.ctr.fardc.mobile'
appName: 'CTR.NET FARDC'
webDir: 'www'
server: {
  androidScheme: 'http',     // Intranet HTTP
  cleartext: true,
  allowNavigation: ['*']
}
```

## CI/CD — GitHub Actions

Le workflow `.github/workflows/build-apk.yml` :

1. Setup Node.js v22 + cache npm
2. Setup Java JDK 21 (Temurin)
3. Setup Android SDK (API 36 + build-tools 35.0.0)
4. `npm ci` — Installation dépendances
5. `npx ng build --configuration production` — Build Angular
6. `npx cap sync android` — Synchronisation Capacitor
7. `./gradlew assembleDebug` — Build APK
8. Upload artifact — APK téléchargeable (`ctr.net-fardc-mobile.apk`)

## Thème visuel

- **Couleur primaire** : Kaki militaire `#5C7A4D`
- **Couleur secondaire** : Kaki foncé `#3F5A2E`
- **Police** : Barlow (Regular, Medium, SemiBold, Bold)
- **Icône** : IG-FARDC (logo inspectorat)

## Documentation liée

- **Web** : `ctr.net-fardc/README.md`
- **API** : `ctr.net-fardc/api/`
- **Architecture mobile** : `ARCHITECTURE.md`
- **Versions** : `VERSION.md`
- **Structure** : `STRUCTURE.txt`
- **Démarrage rapide** : `QUICKSTART.txt`
- **Présentation mobile** : `PRESENTATION_CTR_NET_MOBILE.md`
- **Prompt présentation** : `PROMPT_PRESENTATION.md`
- **Fonctionnement web+mobile** : `FONCTIONNEMENT_COMPLET_WEB_MOBILE.md`

## Scripts de lancement

| Script | Type | Description |
| --- | --- | --- |
| `START.bat` | Batch | Démarrer le serveur de développement |
| `INSTALL.bat` | Batch | Installer les dépendances npm |
| `BUILD_APK.bat` | Batch | Compiler l'APK Android (3 étapes) |
| `launch.ps1` | PowerShell | Démarrer le serveur dev |
| `build_apk.ps1` | PowerShell | Compiler l'APK Android |
