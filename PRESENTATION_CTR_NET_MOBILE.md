# Présentation - CTR.NET

> Présentation mise à jour : `CTR.NET` reste l’application de contrôle terrain du profil `CONTROLEUR`, distincte de `ENROL.NET` pour l’enrôlement.

## Section 1 : Résumé exécutif

CTR.NET Mobile est l'extension terrain de l'application web CTR.NET-FARDC. Conçue exclusivement pour le profil **CONTROLEUR**, elle permet la saisie des contrôles militaires directement depuis un smartphone Android, avec capture GPS automatique et synchronisation en temps réel avec le serveur central. L'application fonctionne sur réseau Wi-Fi intranet et communique avec l'API REST du serveur web via des requêtes HTTP authentifiées par token Bearer. Le contrôleur peut rechercher un militaire, valider un contrôle (Présent, Favorable ou Défavorable) et transmettre instantanément les données au système central, où elles apparaissent en temps réel via le mécanisme de polling.

---

## Section 2 : Plan des slides

### Slide 1 — Titre et objectif

**Message clé**
Présenter CTR.NET Mobile comme l'outil terrain du contrôleur, complémentaire à l'application web.

**Points à dire :**

- CTR.NET Mobile est une application Android dédiée au contrôle terrain des effectifs militaires.
- Elle s'intègre à l'écosystème CTR.NET-FARDC existant via une API REST.
- Seul le profil CONTROLEUR est autorisé à se connecter.
- L'objectif est d'accélérer la saisie et d'ajouter la géolocalisation automatique.

### Slide 2 — Problème adressé

**Message clé**
Le contrôle terrain nécessite mobilité, rapidité et traçabilité géographique.

**Points à dire :**

- Le contrôleur devait auparavant se rendre à un poste fixe pour saisir les contrôles.
- Aucune preuve géographique n'était capturée lors du contrôle.
- Les données arrivaient avec un délai entre l'action terrain et la saisie web.
- Les erreurs de retranscription étaient possibles lors de la saisie différée.

### Slide 3 — Solution apportée

**Message clé**
Une application Android légère, sécurisée, synchronisée en temps réel.

**Points à dire :**

- Application native Android compilée via Capacitor (Ionic 8.0.0 + Angular 20.0.0).
- Saisie directe sur le terrain avec résultat immédiat côté serveur.
- Capture GPS automatique à chaque validation de contrôle.
- Design identique à l'application web (thème kaki, police Barlow).
- Fonctionne sur réseau Wi-Fi intranet (pas besoin d'Internet).

### Slide 4 — Flux complet de l'application

**Message clé**
De l'installation à la saisie d'un contrôle en 9 étapes.

**Points à dire :**

1. **Installation** : APK distribué depuis GitHub Actions ou transfert direct.
2. **Splash screen** : splash natif Capacitor court, puis splash Angular `CTR.NET` pendant environ 5 secondes.
3. **Configuration** : saisie manuelle de l'adresse IP du serveur avec test de connexion depuis la page dédiée.
4. **Connexion** : Login/mot de passe (rôle CONTROLEUR vérifié côté serveur).
5. **Recherche** : Saisie du matricule ou nom (minimum 2 caractères, recherche AJAX).
6. **Sélection** : Le militaire trouvé s'affiche avec sa fiche complète et son badge catégorie.
7. **Validation** : Selon le statut (vivant → Présent, décédé → liens de parenté + mention).
8. **GPS** : Coordonnées capturées automatiquement (timeout 5s, non bloquant).
9. **Envoi** : Les données sont transmises au serveur et visibles immédiatement sur le web.

### Slide 5 — Catégories et mentions

**Message clé**
Cinq catégories de militaires et trois mentions de contrôle structurent la saisie.

**Points à dire :**

- **ACTIF** : Militaire en service actif → mention "Présent".
- **DCD_AV_BIO** : Décédé avant biométrie → bénéficiaire + lien de parenté → "Favorable" ou "Défavorable".
- **DCD_AP_BIO** : Décédé après biométrie → même logique que DCD_AV_BIO.
- **RETRAITES** : Militaire retraité → contrôle standard.
- **INTEGRES** : Militaire intégré → contrôle standard.
- Les liens de parenté disponibles sont saisis individuellement : Epouse, Epoux, Fils, Fille, Père, Mère, Frère, Sœur.

### Slide 6 — Sécurité

**Message clé**
L'authentification et la session sont protégées à chaque niveau.

**Points à dire :**

- Token Bearer stocké localement via Capacitor Preferences (pas de cookies).
- Vérification de session à chaque changement de page (authGuard).
- Déconnexion automatique sur erreur 401 (session expirée).
- Seul le profil CONTROLEUR est autorisé (vérifié côté serveur API).
- Timeout de 15 secondes sur chaque requête pour éviter les blocages.

### Slide 7 — Synchronisation avec le web

**Message clé**
Les contrôles mobiles sont visibles en temps réel sur l'application web.

**Points à dire :**

- L'API endpoint `api/controles_poll.php` est interrogé toutes les 10 secondes par le web.
- Une notification toast apparaît côté web quand un contrôle mobile est détecté.
- Le DataTable des contrôles est rechargé automatiquement.
- Le design des notifications est identique : gradient kaki avec animation slideIn.

### Slide 8 — Build et déploiement

**Message clé**
L'APK de référence est généré automatiquement par GitHub Actions à chaque push sur `main`.

**Points à dire :**

- GitHub Actions compile l'APK à chaque push sur la branche `controle-mobile`.
- L'APK de distribution à retenir est celui publié par le workflow GitHub.
- Pipeline : npm ci → ng build → cap sync → gradlew assembleDebug.
- L'APK est téléchargeable dans les artifacts du workflow GitHub.
- Alternatives : build en ligne de commande ou via Android Studio.
- Cible : Android API 36, minSdk 24 (Android 7.0+).

### Slide 9 — Thème visuel

**Message clé**
L'identité visuelle est cohérente entre web et mobile.

**Points à dire :**

- Couleur primaire : kaki militaire #5C7A4D.
- Couleur secondaire : kaki foncé #3F5A2E.
- Police : Barlow (Regular, Medium, SemiBold, Bold).
- Marque affichée : `CTR.NET`.
- Cards modernes avec ombres douces et gradient kaki en en-tête.
- Design unifié : la page de configuration a le même design que la page de connexion.

### Slide 10 — Bénéfices opérationnels

**Message clé**
CTR.NET Mobile apporte mobilité, rapidité et preuve géographique.

**Points à dire :**

- Réduction du temps entre l'action terrain et l'enregistrement (temps réel).
- Preuve de localisation via GPS automatique.
- Élimination des erreurs de retranscription.
- Simplicité d'usage : recherche → sélection → validation en 3 étapes.
- Supervision en temps réel depuis le web.

### Slide 11 — Conclusion et prochaines étapes

**Message clé**
L'application est opérationnelle et prête pour un déploiement terrain.

**Points à dire :**

- Les fondamentaux sont en place : authentification, contrôle, GPS, synchronisation.
- L'APK est compilé automatiquement et prêt à distribuer.
- Prochaines étapes possibles : mode hors-ligne, synchronisation différée, historique local.
- Décision attendue : valider le déploiement terrain et former les contrôleurs.

---

## Section 3 : Script de démonstration

### Scénario de démo en direct (5 à 8 minutes)

#### Étape 1 — Premier lancement

- Ouvrir l'application sur un appareil Android ou en navigateur (npm start).
- Le splash natif Capacitor s'affiche brièvement, puis le splash Angular `CTR.NET` pendant environ 5 secondes.
- La page login apparaît ; la page de configuration reste accessible via le bouton "Configurer le serveur".

#### Étape 2 — Configuration serveur

- Saisir manuellement l'adresse IPv4 du serveur web (PC) sur le même réseau Wi-Fi.
- Cliquer sur le bouton jaune "Tester la connexion".
- Montrer le message de succès vert.
- Cliquer sur "Continuer" pour accéder au login.

#### Étape 3 — Connexion

- Saisir les identifiants d'un compte CONTROLEUR.
- Montrer le rejet si on tente avec un autre profil.
- Connexion réussie → redirection vers l'onglet Contrôle.

#### Étape 4 — Contrôle d'un militaire vivant

- Taper le matricule ou nom (minimum 2 caractères).
- Les résultats apparaissent avec badges de catégorie (Actif, DCD, etc.).
- Sélectionner un militaire Actif.
- La fiche s'affiche avec le statut "Vivant" coché automatiquement.
- Cliquer sur "Présent" → GPS capturé → envoi au serveur → toast de succès.

#### Étape 5 — Contrôle d'un militaire décédé

- Rechercher un militaire de catégorie DCD_AV_BIO.
- Le statut "Décédé" est coché automatiquement.
- Le bénéficiaire existant s'affiche.
- Sélectionner un lien de parenté (ex: Epouse).
- Ajouter une observation (optionnel).
- Cliquer sur "Favorable" ou "Défavorable".
- Montrer le toast de confirmation.

#### Étape 6 — Vérification côté web

- Ouvrir l'application web sur le PC serveur.
- Montrer que la notification toast apparaît automatiquement.
- Ouvrir la liste des contrôles et montrer le contrôle mobile avec coordonnées GPS.

#### Étape 7 — Profil et déconnexion

- Aller dans l'onglet "Profil" → montrer les informations en lecture seule.
- Aller dans l'onglet "Quitter" → confirmer la déconnexion.
- Retour à la page de login.

---

## Section 4 : Q&R anticipées

1. **L'application fonctionne-t-elle sans Internet ?**
   Elle fonctionne sur réseau Wi-Fi intranet. Internet n'est pas nécessaire, mais le Wi-Fi avec accès au serveur est indispensable.

2. **Qui peut se connecter depuis le mobile ?**
   Uniquement les utilisateurs ayant le profil CONTROLEUR. Les autres profils sont refusés par l'API.

3. **Les coordonnées GPS sont-elles obligatoires ?**
   Non. Le GPS est capturé automatiquement mais n'est pas bloquant. Si le GPS n'est pas disponible, le contrôle est enregistré sans coordonnées.

4. **Comment la synchronisation fonctionne-t-elle ?**
   Le contrôle est envoyé en temps réel au serveur via l'API REST. Le web interroge le serveur toutes les 10 secondes pour détecter les nouveaux contrôles mobiles.

5. **Peut-on modifier un contrôle après envoi ?**
   Non, les contrôles sont définitifs une fois validés, conformément aux règles métier.

6. **Comment distribuer l'APK aux contrôleurs ?**
   L'APK est généré automatiquement par GitHub Actions. Il peut être téléchargé et transféré par USB, Bluetooth ou partage réseau.

7. **L'application consomme-t-elle beaucoup de batterie ?**
   Non. Le GPS n'est activé que pendant la validation (quelques secondes). Il n'y a pas de service en arrière-plan.

8. **Que se passe-t-il si la connexion Wi-Fi est coupée pendant un contrôle ?**
   Le contrôle échoue et un message d'erreur s'affiche. Le contrôleur peut réessayer dès que la connexion est rétablie.

9. **Le design est-il le même que l'application web ?**
   Oui, les deux applications partagent le même thème kaki, la même police Barlow, et les mêmes composants visuels (cards, badges, boutons).

10. **L'application est-elle disponible sur iOS ?**
   Actuellement non. L'application cible Android uniquement (API 36, minSdk 24).

---

## Section 5 : Conclusion et recommandations

CTR.NET Mobile apporte une dimension terrain indispensable au dispositif de contrôle. L'application permet au CONTROLEUR d'effectuer ses saisies directement sur le terrain avec preuve GPS, tout en maintenant une synchronisation instantanée avec le système central. Le design unifié entre web et mobile garantit une expérience cohérente et réduit la courbe d'apprentissage.

### Prochaines actions recommandées

- Déployer l'APK sur les appareils des contrôleurs terrain.
- Former les contrôleurs au flux complet (config → login → contrôle → GPS).
- Surveiller les logs API côté serveur pour vérifier le bon fonctionnement.
- Envisager un mode hors-ligne avec synchronisation différée pour les zones sans Wi-Fi.
- Évaluer les premiers retours terrain après 2 semaines d'utilisation.
