# Présentation - ENROL.NET

## Résumé exécutif

`ENROL.NET` est l’application mobile Android dédiée au profil **`ENROLEUR`**. Elle structure l’enrôlement terrain autour d’un parcours simple et fiable : **photo → empreintes → QR affiché côté web → vérification des informations personnelles → validation → synchronisation**.

> Aucun import d’image QR n’est prévu côté application. Le QR utilisé par `ENROL.NET` est lu directement à partir du code affiché sur l’interface web centrale.

---

## 1. Objectif de l’application

- accélérer l’enrôlement terrain ;
- fiabiliser la collecte biométrique ;
- supprimer les ressaisies inutiles ;
- transmettre les dossiers vers le backend central avec une traçabilité claire.

## 2. Parcours réel à présenter

1. **Splash** puis accès à la configuration IP du serveur.
2. **Connexion** avec un compte `ENROLEUR`.
3. **Capture photo** du militaire.
4. **Capture / association des empreintes**.
5. **Scan du QR affiché côté web**.
6. **Chargement et contrôle** des informations personnelles.
7. **Validation finale** du dossier.
8. **Synchronisation** immédiate ou différée selon la connectivité.

## 3. Points forts métier

- interface claire, pensée pour tablette ou smartphone Android ;
- thème bleu BIC `#0057B8 / #003C8F` et police Barlow ;
- stockage local via **Preferences + IndexedDB** ;
- file d’attente hors ligne pour les dossiers en attente ;
- authentification réservée au seul profil `ENROLEUR` ;
- génération de l’APK via **GitHub Actions**.

## 4. Démonstration conseillée

### Étape 1 — Configuration
- saisir l’adresse IP du serveur ;
- cliquer sur **Tester la connexion** ;
- valider le message de succès.

### Étape 2 — Connexion
- utiliser un compte `ENROLEUR` ;
- montrer le rejet des profils non autorisés ;
- accéder à l’assistant d’enrôlement.

### Étape 3 — Enrôlement
- prendre la photo ;
- enregistrer les empreintes ;
- scanner le QR affiché côté web ;
- vérifier les données chargées ;
- valider le dossier.

### Étape 4 — Synchronisation
- lancer l’envoi ;
- ouvrir le web central pour vérifier la disponibilité du dossier ;
- montrer l’onglet **Profil** puis la déconnexion.

## 5. Questions / réponses rapides

1. **Faut-il Internet ?**
   Non. Un réseau Wi‑Fi intranet avec accès au serveur suffit.

2. **Qui peut se connecter ?**
   Uniquement les utilisateurs ayant le profil `ENROLEUR`.

3. **Que faire si le QR n’est pas disponible ?**
   L’enrôlement n’est finalisé qu’après lecture du QR fourni côté web.

4. **L’application peut-elle attendre avant d’envoyer ?**
   Oui. Les dossiers peuvent rester en file locale puis être synchronisés plus tard.

5. **La version iOS existe-t-elle ?**
   Non. Le projet cible actuellement Android uniquement.

## Conclusion

`ENROL.NET` est prêt pour un déploiement terrain progressif. L’application apporte une collecte biométrique plus propre, un parcours plus professionnel et une meilleure continuité entre le terrain et le système central.

### Recommandations

- déployer l’APK sur les appareils des enrôleurs ;
- former les agents au parcours réel ;
- suivre les synchronisations et les logs ;
- recueillir les retours terrain pour les prochaines améliorations.
