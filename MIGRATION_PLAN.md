# Plan de Migration : Dashboard DSU-V4 vers Angular

Ce document détaille la stratégie pour migrer le frontend actuel (EJS/Express) vers une Single Page Application (SPA) utilisant Angular.

## 1. Objectifs
*   Découpler le frontend du backend.
*   Améliorer la réactivité de l'interface utilisateur.
*   Conserver le style visuel **Brutaliste & Sobre**.

## 2. Architecture Technique

### Backend (Express)
Le serveur Express actuel sera transformé en API REST :
*   `POST /api/auth/login` : Authentification.
*   `GET /api/auth/status` : Vérification de session.
*   `GET /api/bot/stats` : Statistiques globales.
*   `GET /api/guilds` : Liste des serveurs.
*   `GET /api/guilds/:id` : Paramètres d'un serveur.
*   `POST /api/guilds/:id` : Mise à jour des paramètres.
*   Le serveur servira les fichiers statiques du build Angular depuis `src/web/public/dist`.

### Frontend (Angular)
Structure proposée :
*   **Services** :
    *   `ApiService` : Gestion des appels HTTP.
    *   `AuthService` : Gestion du login et de l'état de session.
*   **Composants** :
    *   `LoginComponent`
    *   `DashboardComponent` (Parent avec Navbar)
    *   `OverviewComponent` (Statistiques)
    *   `GuildListComponent`
    *   `GuildSettingsComponent` (Formulaire)
*   **Style** : Migration du CSS brutaliste actuel dans `styles.css`.

## 3. Étapes de Mise en Œuvre

### Phase 1 : Préparation & API (Backend)
1.  Créer les routes API dans `src/web/server.js`.
2.  Ajouter un middleware de protection des routes API.
3.  Tester les endpoints avec `curl` ou un client API.

### Phase 2 : Initialisation Angular
1.  Générer le projet Angular dans un dossier `frontend`.
2.  Configurer le proxy pour rediriger les appels API vers le port d'Express pendant le développement.

### Phase 3 : Développement des Composants
1.  Implémenter le service d'authentification.
2.  Créer les vues de base (Login, Liste).
3.  Implémenter le formulaire d'édition des paramètres.

### Phase 4 : Intégration & Build
1.  Configurer le build Angular pour qu'il exporte vers `src/web/public/dist`.
2.  Mettre à jour Express pour servir l'index Angular.

## 4. Validation
*   Lancement en mode "Réel" (via `npm start`) et "Test" (via `npm run test:ui`).
*   Vérification de la persistance des données.

---
**Approbation requise** : Souhaitez-vous que je commence par la Phase 1 (Création de l'API REST côté Express) ?
