# Historique des versions - CTR.NET Mobile

## v1.0.0 — Juillet 2025

### Première version

**Fonctionnalités**
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

**Technique**
- Ionic 8 + Angular 20 + Capacitor 8
- Composants Angular standalone (pas de NgModules)
- Navigation par onglets (tabs) avec guards
- Token Bearer pour l'authentification API
- Thème kaki militaire (#5C7A4D / #3F5A2E)
- Police Barlow
- Build APK automatisé via GitHub Actions
- Cible Android SDK API 36, minSdk 22

**API REST consommées**
- auth.php (login, logout, check)
- controles.php (search, valider, historique)
- profil.php (get, update)
