# ENROL.NET — Application mobile ENROLEUR (Ionic Angular)

## Description

`ENROL.NET` est l’application Android dédiée à l’**enrôlement terrain** reliée au backend web central. Elle est réservée au profil **`ENROLEUR`** et suit désormais un flux métier professionnel : **capture de la carte → empreintes via capteur → scan QR professionnel → vérification des informations → validation finale → synchronisation**. Dans l’interface, le titre affiché est **`ENROL.NET`**.

> Le QR utilisé par `ENROL.NET` doit provenir de `ctr.net-fardc/modules/controles/liste.php` et n’est généré **que pour les contrôles marqués vivants** (`type_controle = Militaire`). Aucun QR d’enrôlement n’est proposé pour un contrôle marqué **décédé / bénéficiaire**.

> Ce projet est **séparé** de `ctr-net-mobile/`. Le contrôle terrain et l’enrôlement terrain sont désormais gérés par **deux applications différentes**.

## Points clés

- **Nom installé** : `ENROL.NET`
- **App ID** : `net.ctr.fardc.enrollement.mobile`
- **Profil autorisé** : `ENROLEUR`
- **Couleurs** : bleu BIC `#0057B8` / `#003C8F`
- **Mode terrain** : compatible tablette Android / Coppernic
- **Stockage local** : file d’attente hors ligne pour synchronisation différée
- **Mise à jour APK** : signature stable + versionnement Android pour permettre les prochaines mises à jour sans désinstallation

> Si un appareil possède encore une très ancienne APK `ENROL.NET` signée différemment, une **désinstallation unique** peut être nécessaire avant de revenir à un cycle normal de mise à jour.

## Flux métier réel

1. **Splash** puis configuration du serveur
2. **Connexion** avec un compte `ENROLEUR`
3. **Capture de la carte** du militaire avec la caméra arrière
4. **Capture des empreintes via le capteur biométrique**
5. **Scan du QR** généré côté web avec le scanner professionnel intégré, **sans import d’image QR et sans saisie manuelle/externe**
6. **Chargement et vérification** des informations personnelles récupérées depuis le backend central
7. **Validation finale** du dossier d’enrôlement
8. **Synchronisation immédiate** ou envoi en fin de journée

## Authentification et comptes

- L’application n’accepte que les comptes ayant le profil **`ENROLEUR`**.
- Les comptes `OPERATEUR`, `CONTROLEUR` et `ENROLEUR` sont créés avec le mot de passe par défaut **`987654321`** dans le web.
- Ces comptes sont **inactifs par défaut** tant qu’un `ADMIN_IG` ne les a pas activés.
- Les messages de connexion sont explicites :
  - `Utilisateur non créé dans la base de données.`
  - `Ce compte existe mais il est en attente d'activation.`
  - `Utilisateur ou mot de passe incorrects.`

## Communication avec le serveur web

L’application consomme les endpoints du backend `ctr.net-fardc/api/` :

| Endpoint | Méthode | Usage |
| --- | --- | --- |
| `/api/auth.php?action=login` | POST | Connexion mobile `ENROLEUR` |
| `/api/auth.php?action=logout` | POST | Déconnexion |
| `/api/auth.php?action=check` | GET | Vérification de session |
| `/api/controles.php?action=search` | GET | Recherche/chargement d’un militaire |
| `/api/controles.php?action=enroll_vivant` | POST | Envoi d’un enrôlement vivant |
| `/api/controles.php?action=historique` | GET | Historique/suivi |
| `/api/profil.php?action=get` | GET | Consultation du profil |

## Architecture résumée

```text
ctr-net-enrollement-mobile/
├── src/app/pages/enrollement/          ← assistant multi-étapes d’enrôlement
├── src/app/services/enrollement-local.service.ts
│                                        ← file d’attente locale IndexedDB
├── src/app/pages/login/                 ← connexion ENROLEUR
├── src/app/pages/config/                ← configuration IP serveur
├── src/app/pages/profil/                ← consultation du profil connecté
├── src/theme/variables.scss             ← thème bleu BIC
├── capacitor.config.ts                  ← appName ENROL.NET + appId dédié
└── .github/workflows/build-apk.yml      ← génération APK GitHub Actions
```

## Prérequis développement

1. **Node.js** v22+
2. **Java JDK 21**
3. **Android Studio** avec SDK 36 / build-tools 35
4. Un backend `ctr.net-fardc` accessible sur le même réseau Wi-Fi

## Installation locale

```bash
cd ctr-net-enrollement-mobile
npm install
npm start
```

## Compilation APK

### GitHub Actions

L’APK de référence est généré par le workflow GitHub Actions du dépôt. L’artifact publié suit le format :

- `enrol-net-enrollement-mobile-apk-v<version>`

### Local

```bash
npx ng build --configuration production
npx cap sync android
cd android
./gradlew assembleDebug
```

Sorties usuelles :

- source Gradle : `android/app/build/outputs/apk/debug/app-debug.apk`
- copie distribuable locale : `dist/apk/enrol-net-enrollement-mobile-latest-debug.apk`

## Technologies

| Technologie | Version | Rôle |
| --- | --- | --- |
| Ionic | 8 | UI mobile |
| Angular | 20 | Application standalone |
| Capacitor | 8 | Bridge Android |
| TypeScript | 5.9 | Logique applicative |
| IndexedDB | navigateur/app webview | stockage local des enrôlements |

## Charte visuelle

- **Primaire** : `#0057B8`
- **Secondaire** : `#003C8F`
- **Police** : Barlow
- **Nom affiché** : `ENROL.NET`

## Documentation liée

- `ARCHITECTURE.md`
- `VERSION.md`
- `FONCTIONNEMENT_COMPLET_WEB_MOBILE.md`
- `PRESENTATION_ENROL_NET_MOBILE.md`
- `PROMPT_PRESENTATION.md`
- `../ctr.net-fardc/README.md`

