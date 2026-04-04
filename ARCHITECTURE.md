# Architecture — ENROL.NET Mobile

## Vue d’ensemble

`ENROL.NET` est une application Ionic/Angular/Capacitor dédiée à l’**enrôlement des militaires vivants**. Elle est conçue pour le profil **`ENROLEUR`**, sur tablette ou smartphone Android, avec un **mode hors ligne** permettant la mise en file locale des dossiers avant synchronisation.

## Stack technique

| Couche | Technologie | Version |
| --- | --- | --- |
| UI mobile | Ionic | 8 |
| Application | Angular standalone | 20 |
| Natif Android | Capacitor | 8 |
| Langage | TypeScript | 5.9 |
| Stockage local | IndexedDB + Preferences | runtime |
| Build | GitHub Actions / Gradle | Node 22 + Java 21 |

## Architecture applicative

```text
src/app/
├── app.routes.ts
├── guards/auth.guard.ts
├── models/interfaces.ts
├── services/
│   ├── api.service.ts                    ← client HTTP + token Bearer
│   ├── auth.service.ts                   ← session ENROLEUR
│   ├── cache.service.ts                  ← nettoyage stockage
│   └── enrollement-local.service.ts      ← file IndexedDB + sync différée
└── pages/
    ├── splash/                           ← splash de démarrage
    ├── config/                           ← IP serveur + test de connexion
    ├── login/                            ← connexion ENROLEUR
    ├── enrollement/                      ← assistant multi-étapes
    ├── profil/                           ← consultation du profil
    └── tabs/                             ← navigation principale
```

## Flux de navigation

```text
splash → config → login → tabs/enrollement
                           ├── Enrôlement
                           ├── Profil
                           └── Déconnexion
```

## Flux métier d’enrôlement

1. **Identification** : scan QR ou recherche du militaire
2. **Préremplissage** : récupération des données déjà connues
3. **Capture photo**
4. **Capture des empreintes**
5. **Revue du dossier**
6. **Choix de synchronisation** : maintenant ou fin de journée

## Communication API

| Endpoint | Méthode | Usage |
| --- | --- | --- |
| `auth.php?action=login` | POST | Authentification `ENROLEUR` |
| `auth.php?action=check` | GET | Vérification session |
| `controles.php?action=search` | GET | Recherche militaire / QR |
| `controles.php?action=enroll_vivant` | POST | Envoi du dossier d’enrôlement |
| `controles.php?action=historique` | GET | Historique / suivi |
| `profil.php?action=get` | GET | Lecture du profil |

### Authentification

- Token Bearer stocké localement
- Profil autorisé : `ENROLEUR`
- Gestion de messages explicites en cas d’utilisateur absent, mot de passe erroné, compte inactif ou profil non autorisé

## Stockage local et mode hors ligne

Le service `enrollement-local.service.ts` conserve les dossiers en attente dans IndexedDB afin de permettre :

- l’utilisation en zone à faible connectivité ;
- la reprise d’un dossier non encore synchronisé ;
- l’envoi groupé en fin de journée.

## Thème visuel

- **Primaire** : bleu BIC `#0057B8`
- **Secondaire** : bleu foncé `#003C8F`
- **Police** : Barlow
- **Nom applicatif** : `ENROL.NET`

## Configuration Capacitor

```ts
appId: 'net.ctr.fardc.enrollement.mobile'
appName: 'ENROL.NET'
webDir: 'www'
```

## CI/CD

Le workflow `.github/workflows/build-apk.yml` produit l’APK distribuable du projet :

- artifact/release : `ctr-net-enrollement-mobile-latest-debug.apk`
- build local secondaire : `android/app/build/outputs/apk/debug/ctr.net-fardc-mobile.apk`

