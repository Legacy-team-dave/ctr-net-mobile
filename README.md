# CTR.NET Mobile — Application CONTROLEUR (Ionic Angular)

## Description

Application mobile Android séparée, destinée exclusivement au profil **CONTROLEUR** de l'application web CTR.NET-FARDC. Elle communique avec l'API REST du projet web via le réseau Wi-Fi (IPv4).

> Ce projet est **indépendant** du projet web `ctr.net-fardc`. Il se trouve dans son propre dossier `ctr-net-mobile/`.

## Architecture

```
ctr-net-mobile/                     ← Projet Ionic Angular (SÉPARÉ)
├── src/
│   ├── app/
│   │   ├── guards/
│   │   │   └── auth.guard.ts       ← Guards d'authentification
│   │   ├── models/
│   │   │   └── interfaces.ts       ← Interfaces TypeScript
│   │   ├── pages/
│   │   │   ├── config/             ← Configuration IP serveur
│   │   │   ├── controle/           ← Recherche + validation militaire
│   │   │   ├── login/              ← Connexion CONTROLEUR
│   │   │   ├── profil/             ← Profil utilisateur
│   │   │   └── tabs/               ← Navigation par onglets
│   │   ├── services/
│   │   │   ├── api.service.ts      ← Client HTTP (API REST)
│   │   │   └── auth.service.ts     ← Gestion de l'authentification
│   │   ├── app.component.ts
│   │   └── app.routes.ts
│   ├── theme/
│   │   └── variables.scss          ← Thème CTR.NET (vert militaire)
│   └── index.html
├── android/                        ← Projet Android Studio (Capacitor)
├── capacitor.config.ts
├── angular.json
├── package.json
└── README.md
```

## Communication avec le serveur web

L'app mobile utilise les endpoints API existants dans `ctr.net-fardc/api/` :

| Endpoint | Méthode | Description |
|---|---|---|
| `/api/auth.php?action=login` | POST | Connexion (CONTROLEUR uniquement) |
| `/api/auth.php?action=logout` | POST | Déconnexion |
| `/api/auth.php?action=check` | GET | Vérification de session |
| `/api/controles.php?action=search` | GET | Recherche de militaire |
| `/api/controles.php?action=valider` | POST | Validation d'un contrôle |
| `/api/controles.php?action=historique` | GET | Historique des contrôles |
| `/api/profil.php?action=get` | GET | Lecture du profil |
| `/api/profil.php?action=update` | POST | Mise à jour du profil |

## Prérequis

1. **Node.js** (v18+) — [nodejs.org](https://nodejs.org)
2. **Java JDK 17+** — [adoptium.net](https://adoptium.net)
3. **Android Studio** — [developer.android.com](https://developer.android.com/studio)
   - Installer le **Android SDK** (API Level 34 recommandé)
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

## Compilation APK

### Méthode 1 : Ligne de commande

```bash
# 1. Build Angular
npx ng build

# 2. Synchroniser Capacitor
npx cap sync android

# 3. Build APK
cd android
gradlew assembleDebug

# L'APK se trouve dans : android/app/build/outputs/apk/debug/app-debug.apk
```

### Méthode 2 : Android Studio

```bash
npx ng build
npx cap sync android
npx cap open android
```

Puis dans Android Studio : **Build → Build Bundle(s)/APK(s) → Build APK(s)**

## Flux de l'application

1. **Premier lancement** → Écran de configuration IP du serveur
2. **Test de connexion** → Vérifie que l'API est joignable
3. **Connexion** → Login/mot de passe (profil CONTROLEUR uniquement)
4. **Écran principal** → Onglets Contrôle / Profil
5. **Contrôle** → Recherche par matricule/nom → Validation (Présent / Favorable / Défavorable)
6. **Profil** → Consultation et modification des informations

## Technologies

- **Ionic 8** + **Angular 20** (standalone components)
- **Capacitor 8** pour le build natif Android
- **TypeScript** avec typage strict
- Plugins Capacitor : Geolocation, Network, Preferences, SplashScreen, StatusBar
