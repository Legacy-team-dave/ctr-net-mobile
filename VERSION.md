# Historique des versions — ENROL.NET Mobile

## 1.4.0 (2026-04-04)

### 🆕 Application d’enrôlement dédiée

- séparation complète entre `CTR.NET` (contrôle) et `ENROL.NET` (enrôlement) ;
- nom installé `ENROL.NET` et `appId` dédié `net.ctr.fardc.enrollement.mobile` ;
- authentification réservée au profil **`ENROLEUR`** ;
- assistant d’enrôlement terrain : **photo → empreintes → QR / informations personnelles → validation → sync** ;
- stockage local IndexedDB pour la **synchronisation différée** ;
- thème visuel migré en **bleu BIC** (`#0057B8`, `#003C8F`) ;
- messages de connexion plus explicites pour utilisateur absent, compte inactif ou mot de passe erroné.

## 1.3.0 (Mars 2026)

### Stabilisation mobile

- configuration IP manuelle avec test de connexion ;
- nettoyage automatique du cache local ;
- build Android via GitHub Actions ;
- base Angular/Ionic/Capacitor consolidée.

## 1.0.0

Version de départ du socle mobile ayant servi de base au projet `ENROL.NET`.
