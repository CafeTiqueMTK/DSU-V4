# Architecture du projet DSU-V4

Ce document décrit l'architecture globale du bot Discord DSU-V4 et précise le rôle et les responsabilités de chaque composant majeur du système. Le projet est construit autour de l'API `discord.js` avec une persistance des données sur MongoDB, et il intègre plusieurs interfaces d'administration web.

## 1. Cœur de l'application

### `src/client.js`
Il s'agit du point d'entrée central du bot, qui étend la classe `Client` de `discord.js`. Ses responsabilités incluent :
- L'initialisation de la connexion à la base de données.
- Le chargement dynamique des commandes (slash commands) et des événements de Discord via les utilitaires dédiés.
- Le déploiement des commandes sur l'API Discord.
- L'instanciation et le démarrage des services parallèles, notamment le tableau de bord web (`WebDashboard`) et le vérificateur de mises à jour (`UpdateChecker`).
- La gestion globale du cycle de vie de l'application (connexion à l'API Discord et arrêt gracieux du processus).

## 2. Persistance et Accès aux Données

### `src/db.js`
Ce fichier agit comme le point d'entrée principal (Façade) pour toutes les interactions avec la base de données MongoDB.
- **Initialisation** : Il établit la connexion avec Mongoose.
- **Mise en cache** : Il maintient un cache local en mémoire (`guildSettingsCache`) des paramètres de chaque serveur (Guild) afin de réduire les appels redondants vers la base de données, tout en gérant une rétrocompatibilité avec un ancien format de stockage (`legacyStores`).
- **Délégation** : Au lieu de contenir l'ensemble de la logique métier, il sert de routeur et délègue les opérations complexes aux services des modules concernés (économie, modération, mariages, tickets).

### `src/models/`
Ce dossier contient les schémas de données définis via Mongoose. Il définit la structure stricte des documents stockés dans MongoDB. Par exemple :
- `GuildSetting.js` : Structure l'ensemble des configurations propres à chaque serveur (Auto-modération, systèmes de logs, protections anti-raid, messages de bienvenue, rôles de support, etc.).
- `UserData.js` / `Marriage.js` : Structurent les données relatives aux joueurs (portefeuille économique, historique de modération, données de commandes amusantes).

## 3. Interfaces Web et Tableaux de Bord

Le bot propose des interfaces pour configurer les serveurs sans utiliser de commandes Discord.

### `src/web/server.js`
C'est une application web classique développée avec le framework Express.js. Elle sert de tableau de bord d'administration :
- **Design System** : Utilise une interface moderne "Manus AI" (Dark Mode OLED, glassmorphism, bento grids) construite avec Tailwind CSS.
- **Authentification** : Elle sécurise l'accès via un système de session (`express-session`).
- **Configuration** : Elle permet de lire et de mettre à jour les paramètres de la base de données (systèmes de logs, automod, tickets, bienvenue/départs) via une interface graphique générée côté serveur (avec EJS).
- **Actions directes** : Elle expose des requêtes (POST) permettant d'effectuer des actions de modération (kick, ban, mute, warn) et de création d'Embeds (avec prévisualisation) directement sur Discord.
- **Flexibilité** : Le démarrage du dashboard peut être désactivé via la variable d'environnement `DISABLE_WEB=true`.

### `src/wap.js`
... (inchangé) ...

## 4. Services et Logique Métier
... (inchangé) ...

## 7. Gestion et Outils de Développement

### `dsu.sh` (CLI Manager)
Script shell à la racine servant de centre de commande pour le projet.
- **`./dsu.sh dev` / `prod`** : Gère automatiquement la vérification et le démarrage du service MongoDB avant de lancer le bot. Supporte l'option `-nowebui` pour lancer le bot sans l'interface web.
- **`./dsu.sh mockui`** : Lance l'interface web en mode isolation totale pour les tests visuels.

### `test-ui.js` (UI Testing Environment)
Environnement de test autonome pour le dashboard web.
- **Mocking** : Simule entièrement les objets Discord.js (`Client`, `Guild`, `Channel`, `Role`) et la base de données MongoDB.
- **Isolation** : Permet de travailler sur l'interface (identifiants `admin`/`password`) sans avoir besoin d'un bot actif ou d'une base de données réelle.

### `src/update-checker.js`
Un service s'exécutant en arrière-plan à intervalles réguliers (toutes les 5 minutes), dont le rôle est de surveiller le dépôt GitHub source du bot.
- Il interroge l'API GitHub pour vérifier si de nouveaux "commits" ont été poussés sur la branche principale.
- Si une mise à jour est détectée, il envoie automatiquement une notification d'annonce riche (embed) incluant le titre du commit et son auteur dans les canaux Discord des serveurs ayant configuré cette option.

### `src/modules/`
L'application adopte une architecture modulaire. Chaque sous-dossier (ex: `economy`, `moderation`, `marriage`, `tickets`) isole la logique métier spécifique à un domaine.
- **Exemple (`ModerationService.js`)** : Ce fichier encapsule les actions spécifiques à la modération (ajouter un avertissement, enregistrer un log visuel dans un salon défini, geler un utilisateur). `db.js` s'appuie directement sur les méthodes de ce service pour exécuter ses requêtes.

## 5. Commandes et Événements

### `src/commands/`
Contient toutes les commandes Slash du bot divisées par catégories (admin, automod, economy, fun, general, integrations, moderation, roles, tickets).

### `src/events/`
Contient les écouteurs d'événements Discord (messageCreate, interactionCreate, guildMemberAdd, etc.). La logique des événements fait le lien entre les interactions des utilisateurs et les services ou la base de données.

## 6. Outils Transverses

### `src/utils/`
Ce dossier rassemble diverses fonctions utilitaires purement techniques ou réutilisables dans l'ensemble de l'application :
- `env.js` : Centralise, analyse et valide les variables d'environnement requises au démarrage.
- `commandLoader.js` : Scanne le système de fichiers pour injecter automatiquement les commandes disponibles dans le bot.
- `embeds.js` : Exporte des palettes de couleurs et des émojis constants afin d'assurer l'homogénéité du design des messages envoyés par le bot.
- `logger.js` : Gère le formatage visuel des processus de journalisation (logs) dans le terminal (erreurs, succès, informations).
