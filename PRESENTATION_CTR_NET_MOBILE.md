# Présentation - ENROL.NET

## Section 1 : Résumé exécutif

`ENROL.NET` est l’application mobile de terrain dédiée au profil **`ENROLEUR`**. Elle permet l’enrôlement depuis une tablette ou un smartphone Android avec **capture photo**, **capture d’empreintes**, **lecture du QR d’identité** et **validation finale** avant synchronisation avec le backend `CTR.NET-FARDC`. Le titre affiché dans l’application est désormais **`ENROL.NET`**.

> Le QR scanné par `ENROL.NET` provient de `ctr.net-fardc/modules/controles/liste.php` et n’est généré **que** lorsqu’un militaire a été contrôlé avec le statut **vivant**. Si le statut coché est **décédé**, aucun QR d’enrôlement n’est affiché côté web.

---

## Section 2 : Plan des slides

### Slide 1 — Titre et objectif

**Message clé**
Présenter ENROL.NET comme l'outil terrain de l’enrôleur, complémentaire à l'application web.

**Points à dire :**

- ENROL.NET est une application Android dédiée à l’enrôlement terrain des militaires vivants peut importe leurs catégories respectives.
- Elle s'intègre à l'écosystème CTR.NET-FARDC existant via une API REST.
- Seul le profil `ENROLEUR` est autorisé à se connecter.
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
- Design cohérent avec l’écosystème web, avec une identité visuelle bleu BIC et la police Barlow.
- Fonctionne sur réseau Wi-Fi intranet (pas besoin d'Internet).

### Slide 4 — Flux complet de l’application

**Message clé**
De l’installation à la validation d’un dossier d’enrôlement en 8 étapes.

**Points à dire :**

1. **Installation** : APK distribué depuis GitHub Actions ou transfert direct.
2. **Splash screen** : splash natif Capacitor court, puis splash Angular `ENROL.NET` pendant environ 5 secondes.
3. **Configuration** : saisie manuelle de l'adresse IP du serveur avec test de connexion depuis la page dédiée.
4. **Connexion** : login/mot de passe (rôle `ENROLEUR` vérifié côté serveur).
5. **Photo** : capture ou import de la photo du militaire.
6. **Empreintes** : association ou saisie biométrique selon l’équipement disponible.
7. **QR / informations** : scan du QR affiché côté web, sans saisie manuelle/externe, puis chargement des données personnelles.
8. **Validation & sync** : revue finale du dossier puis envoi immédiat ou différé vers le serveur.

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
- Seul le profil `ENROLEUR` est autorisé (vérifié côté serveur API).
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

- GitHub Actions compile l'APK à chaque push sur la branche `enrollement-mobile`.
- L'APK de distribution à retenir est celui publié par le workflow GitHub.
- Pipeline : npm ci → ng build → cap sync → gradlew assembleDebug.
- L'APK est téléchargeable dans les artifacts du workflow GitHub.
- Alternatives : build en ligne de commande ou via Android Studio.
- Cible : Android API 36, minSdk 24 (Android 7.0+).

### Slide 9 — Thème visuel

**Message clé**
L'identité visuelle `ENROL.NET` est claire, moderne et cohérente avec l’écosystème.

**Points à dire :**

- Couleur primaire : bleu BIC `#0057B8`.
- Couleur secondaire : bleu profond `#003C8F`.
- Police : Barlow (Regular, Medium, SemiBold, Bold).
- Marque affichée : `ENROL.NET`.
- Cards modernes avec ombres douces et accents bleus.
- Design unifié : la page de configuration a le même style que la page de connexion.

### Slide 10 — Bénéfices opérationnels

**Message clé**
ENROL.NET apporte mobilité, capture biométrique et continuité opérationnelle.

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

- Ouvrir l'application sur un appareil Android ou en navigateur (`npm start`).
- Le splash natif Capacitor s'affiche brièvement, puis le splash Angular `ENROL.NET` pendant environ 5 secondes.
- La page login apparaît ; la page de configuration reste accessible via le bouton "Configurer le serveur".

#### Étape 2 — Configuration serveur

- Saisir manuellement l'adresse IPv4 du serveur web (PC) sur le même réseau Wi-Fi.
- Cliquer sur le bouton jaune "Tester la connexion".
- Montrer le message de succès vert.
- Cliquer sur "Continuer" pour accéder au login.

#### Étape 3 — Connexion

- Saisir les identifiants d'un compte `ENROLEUR`.
- Montrer le rejet si on tente avec un autre profil.
- Connexion réussie → redirection vers l’assistant d’enrôlement.

#### Étape 4 — Photo et empreintes

- Capturer la photo du militaire.
- Enregistrer ensuite les empreintes disponibles.
- Montrer les contrôles de validation entre chaque étape.

#### Étape 5 — Lecture du QR

- Scanner le QR affiché côté web, ou importer une image du QR.
- Montrer le chargement automatique des informations personnelles.
- Expliquer que la saisie manuelle/externe a été supprimée pour fiabiliser le flux.

#### Étape 6 — Validation finale et synchronisation

- Vérifier le dossier complet sur l’écran de revue.
- Valider l’enrôlement puis lancer la synchronisation.
- Ouvrir l’application web sur le PC serveur pour montrer la disponibilité du dossier synchronisé.

#### Étape 7 — Profil et déconnexion

- Aller dans l'onglet "Profil" → montrer les informations en lecture seule.
- Aller dans l'onglet "Quitter" → confirmer la déconnexion.
- Retour à la page de login.

---

## Section 4 : Q&R anticipées

1. **L'application fonctionne-t-elle sans Internet ?**
   Elle fonctionne sur réseau Wi-Fi intranet. Internet n'est pas nécessaire, mais le Wi-Fi avec accès au serveur est indispensable.

2. **Qui peut se connecter depuis le mobile ?**
   Uniquement les utilisateurs ayant le profil `ENROLEUR`. Les autres profils sont refusés par l'API.

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
   Oui, les deux applications partagent la même base visuelle et la police Barlow, mais ENROL.NET utilise un thème bleu BIC distinct de CTR.NET.

10. **L'application est-elle disponible sur iOS ?**
   Actuellement non. L'application cible Android uniquement (API 36, minSdk 24).

---

## Section 5 : Conclusion et recommandations

ENROL.NET apporte une capacité d’enrôlement mobile structurée, compatible avec les usages terrain et les contraintes de connectivité. L’application permet à l’`ENROLEUR` de capturer les éléments d’identification, de conserver localement les dossiers si besoin et de les synchroniser ensuite avec le système central.

### Prochaines actions recommandées

- Déployer l'APK sur les appareils des contrôleurs terrain.
- Former les contrôleurs au flux complet (config → login → contrôle → GPS).
- Surveiller les logs API côté serveur pour vérifier le bon fonctionnement.
- Envisager un mode hors-ligne avec synchronisation différée pour les zones sans Wi-Fi.
- Évaluer les premiers retours terrain après 2 semaines d'utilisation.
