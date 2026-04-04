# Prompt de présentation — ENROL.NET

Copiez-collez ce prompt dans votre assistant IA pour générer une présentation claire et professionnelle de l'application mobile.

---

## Prompt prêt à utiliser

Tu es un expert en communication de solutions mobiles et en systèmes d'information militaires.
Je dois présenter l'application mobile ENROL.NET devant [type de public : direction / enrôleurs terrain / équipe technique / partenaires].

Objectif de la présentation :

- Expliquer à quoi sert l'application mobile
- Montrer comment elle fonctionne sur le terrain
- Mettre en évidence le flux de contrôle, la capture GPS et la synchronisation avec le web
- Donner les points de vigilance et les recommandations

Contexte fonctionnel réel à respecter :

- Profil unique : `ENROLEUR`
- Flux réel : Splash → Configuration IP → Login → Scan QR → Infos → Photo → Empreintes → Revue → Synchronisation
- Fonction principale : enrôler un militaire vivant avec collecte biométrique et photo
- Stockage local : mise en file hors ligne via IndexedDB en attendant la synchronisation
- Communication : API REST via Wi-Fi intranet (token Bearer, timeout 15s)
- URL de base serveur : `http://{IP}/ctr.net-fardc/api/`
- Endpoint métier : `controles.php?action=enroll_vivant`
- Sécurité : token Bearer, contrôle du profil, messages de connexion explicites
- Branding : bleu BIC `#0057B8` / `#003C8F`

Technologies réelles :

- Ionic 8.0.0 + Angular 20.0.0 + Capacitor 8.2.0
- TypeScript 5.9.0, composants Angular standalone (pas de NgModules)
- RxJS 7.8.0 pour la programmation réactive
- Android SDK API 36, minSdk 24 (Android 7.0+)
- Build automatisé via GitHub Actions (Node 22, Java 21, Ubuntu-latest)
- Thème bleu BIC (#0057B8 / #003C8F), police Barlow
- Plugins : @capacitor/geolocation, @capacitor/network, @capacitor/preferences, @capacitor/splash-screen, @capacitor/status-bar

Consignes de production :

1. Génère un plan de présentation en 8 à 12 slides maximum.
2. Pour chaque slide, fournis :
   - Titre
   - Message clé
   - 3 à 5 points à dire à l'oral
3. Ajoute une section "Démonstration en direct" avec un scénario pas à pas :
   - Premier lancement (splash 5s → configuration IP)
   - Saisie manuelle de l'IP serveur, clic "Tester la connexion"
   - Message de succès vert → clic "Continuer"
   - Connexion avec identifiants CONTROLEUR
   - Recherche d'un militaire Actif → sélection → "Présent"
   - Recherche d'un militaire DCD_AV_BIO → Lien de parenté → "Favorable" ou "Défavorable"
   - Consultation profil (onglet Profil)
   - Déconnexion (onglet Quitter avec confirmation)
4. Ajoute une section "Questions/Réponses" avec 10 questions probables et réponses courtes.
5. Le ton doit être institutionnel, clair, orienté terrain.
6. Produis le résultat en français.
7. Termine par une conclusion orientée décision (déploiement et prochaines étapes).

Contraintes importantes :

- N'invente pas de fonctionnalités non présentes.
- Respecte strictement le profil CONTROLEUR et les mentions réelles (Présent, Favorable, Défavorable).
- Mentionne la dépendance au serveur web CTR.NET-FARDC pour l'API.
- Sois concret et orienté usage terrain.
- Le design de la page de configuration IP est identique à celui de la page de connexion (même fond, carte, boutons, tailles).

Format de sortie attendu :

- Section 1 : "Résumé exécutif"
- Section 2 : "Plan des slides"
- Section 3 : "Script de démonstration"
- Section 4 : "Q&R anticipées"
- Section 5 : "Conclusion et recommandations"

---

## Variante courte (30 secondes)

Fais-moi un pitch de 30 secondes de ENROL.NET pour un décideur, en mettant l'accent sur :

- la mobilité terrain des contrôleurs,
- la capture GPS automatique,
- la synchronisation temps réel avec le web,
- et la simplicité d'usage (recherche → validation en 2 clics).

## Variante moyenne (2 minutes)

Fais-moi un pitch de 2 minutes de ENROL.NET pour une réunion de pilotage, avec :

- problème initial (contrôles papier, pas de traçabilité terrain),
- solution apportée (app mobile dédiée au CONTROLEUR),
- fonctionnement réel (splash 5s → config IP → login → onglets Contrôle/Profil/Quitter),
- synchronisation avec le web (API REST, polling 10s via `controles_poll.php`, notifications toast),
- impacts métier (rapidité, GPS, fiabilité, preuve géographique),
- prochaines étapes.

## Variante technique (pour développeurs)

Fais-moi une présentation technique de ENROL.NET avec :

- Architecture : Ionic 8.0.0 + Angular 20.0.0 standalone + Capacitor 8.2.0
- Communication : HTTP REST avec token Bearer (header `Authorization`), timeout 15s
- Stockage local : Capacitor Preferences (`server_ip`, `auth_token`)
- GPS : `@capacitor/geolocation` avec timeout 5s non bloquant
- Build : GitHub Actions (Node 22, Java 21, Android SDK API 36)
- Design : thème bleu BIC (#0057B8 / #003C8F), police Barlow, cards modernes, config et login cohérents avec ENROL.NET
- Guards : `authGuard` (vérifie session, redirige vers /login ou /config) + `noAuthGuard` (empêche double login)
- Interfaces TypeScript : Militaire, User, LoginResponse, ApiResponse, ControleData
- Services : ApiService (client HTTP central) + AuthService (gestion session, BehaviorSubject)
- Routes : splash → config → login (noAuthGuard) → tabs (authGuard) → controle / profil
- Plugins : geolocation, network, preferences, splash-screen, status-bar
