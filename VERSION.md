# Historique des versions - CTR.NET Mobile

## État actuel (Mars 2026)

- Mode de configuration serveur actif : **saisie manuelle de l'IP** + test de connexion
- Cible Android effective : **SDK 36, minSdk 24**
- Version applicative (`package.json`) : **1.3.0**
- APK de référence : **artifact/release GitHub Actions** nommé `ctr.net-fardc-mobile.apk`
- Footer UI harmonisé sur les pages **Configuration** et **Login** : `IG-FARDC © 2026`

## v1.3.0 — Mars 2026

### Nettoyage automatique des caches + Release GitHub

- Nouveau service `CacheService` : nettoyage automatique des données périmées au démarrage
- Purge des clés Preferences orphelines (non gérées par l'app) toutes les 24h
- Nettoyage des données de session au logout (token Bearer)
- Méthodes utilitaires : `clearAll()` (reset complet), `getStorageStats()` (diagnostic)
- Intégration dans `AppComponent.ngOnInit()` — s'exécute à chaque lancement
- Intégration dans `AuthService.logout()` — purge session au lieu de clearToken seul
- Workflow GitHub Actions mis à jour : release GitHub automatique avec APK attachée
- Version package.json alignée à 1.3.0
- Le flux utilisateur officiel reste la saisie manuelle de l'IP ; les helpers de détection sont conservés pour diagnostic côté service

## v1.2.0 — Mars 2026

### Tentative de détection automatique de l'IP serveur

- Une logique de détection automatique a été ajoutée dans le service API
- Scan du sous-réseau avec IPs prioritaires puis scan complet
- Les méthodes de diagnostic sont restées disponibles : `detectServer()`, `pingServer()`, `detectSubnets()`, `getLocalIP()`, `scanSubnets()`
- Le flux utilisateur officiel a ensuite été recentré sur la saisie manuelle de l'IP (voir état actuel et v1.3.0)

## v1.1.0 — Mars 2026

### Alignement design et documentation

- Page de configuration IP : même design que la page de connexion (fond, carte, boutons, tailles, marges)
- Input group : margin-bottom 1rem identique au login
- Bouton "Tester" : margin-top 0.5rem identique au bouton "Se connecter"
- Meta theme-color : corrigé de #1b5e20 vers #3F5A2E (kaki foncé, cohérent avec le thème)
- Documentation complète : ARCHITECTURE.md, PRESENTATION.md, PROMPT_PRESENTATION.md, QUICKSTART.txt, STRUCTURE.txt
- Fichier de fonctionnement combiné web+mobile (FONCTIONNEMENT_COMPLET_WEB_MOBILE.md)
- Scripts de lancement : START.bat, INSTALL.bat, BUILD_APK.bat, launch.ps1, build_apk.ps1
- Mise à jour de toutes les versions dans les fichiers de documentation

## v1.0.0 — Juillet 2025

### Première version

### Fonctionnalités

- Écran splash animé (5 secondes, logo IG-FARDC)
- Page de configuration IP serveur avec test de connexion
- Authentification par login/mot de passe (rôle CONTROLEUR uniquement)
- Recherche de militaires par matricule ou nom
- Validation de contrôle en 2 étapes (recherche → détail)
- Gestion des 5 catégories : Actif, DCD_AV_BIO, DCD_AP_BIO, RETRAITES, INTEGRES
- Mentions Présent / Favorable / Défavorable
- Liens de parenté : Epouse/Epoux, Fils/Fille, Père/Mère, Frère/Sœur
- Bénéficiaire existant + nouveau bénéficiaire
- Observations texte libre
- Capture GPS automatique lors de la validation
- Affichage profil utilisateur avec avatar
- Déconnexion depuis l'onglet Quitter

### Technique

- Ionic 8 + Angular 20 + Capacitor 8
- Composants Angular standalone (pas de NgModules)
- Navigation par onglets (tabs) avec guards
- Token Bearer pour l'authentification API
- Thème kaki militaire (#5C7A4D / #3F5A2E)
- Police Barlow
- Build APK automatisé via GitHub Actions
- Cible Android SDK API 36, minSdk 24

### API REST consommées

- auth.php (login, logout, check)
- controles.php (search, valider, historique)
- profil.php (get, update)
