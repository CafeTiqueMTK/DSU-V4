# Spécifications Fonctionnelles - Dashboard DSU-V4

Ce document définit les objectifs, les fonctionnalités et l'architecture du tableau de bord web du bot DSU-V4.

## 1. Objectifs du Dashboard
Le dashboard a pour but de fournir une interface graphique intuitive pour :
*   Visualiser l'état global du bot et ses statistiques.
*   Gérer la liste des serveurs (guildes) où le bot est présent.
*   Configurer les modules (Automod, Logs, Économie, etc.) spécifiquement pour chaque serveur sans utiliser de commandes textuelles.

---

## 2. Architecture de Navigation
L'interface est structurée en trois niveaux principaux :
1.  **Portail de Connexion** : Authentification sécurisée des administrateurs.
2.  **Vue d'Ensemble (Accueil)** : Statistiques globales du bot.
3.  **Gestion des Guildes** :
    *   Liste des serveurs accessibles.
    *   Panneau de configuration individuel par serveur.

---

## 3. Spécifications Fonctionnelles

### 3.1 Authentification
*   **Accès restreint** : Seuls les administrateurs définis dans les variables d'environnement (`DASHBOARD_USER`) peuvent accéder au dashboard.
*   **Gestion des sessions** : Utilisation de sessions persistantes pour éviter les reconnexions fréquentes.
*   **Sécurité** : Les mots de passe ne doivent jamais apparaître en clair dans les logs ou le code source.

### 3.2 Vue d'Ensemble (Home)
Affiche des cartes de statistiques en temps réel :
*   **Statut** : Connecté/Hors ligne.
*   **Compteurs** : Nombre de serveurs, nombre total d'utilisateurs, nombre de commandes chargées.
*   **Quick Actions** : Liens directs vers les fonctionnalités les plus utilisées.

### 3.3 Liste des Guildes
*   Affichage sous forme de grille ou de liste.
*   **Informations par guilde** : Nom, icône (ou placeholder si absente).
*   **Action** : Bouton "Gérer" redirigeant vers les paramètres spécifiques.

### 3.4 Configuration par Guilde (Settings)
Chaque serveur dispose de son propre formulaire de configuration découpé en sections :

#### A. Administration & Logs
*   **Logs** : Activation/Désactivation globale, choix du salon de réception des logs.
*   **Catégories de Logs** : Sélection granulaire des événements à logger (messages supprimés, arrivées, sanctions, etc.).

#### B. Automod (Modération Automatique)
*   **Toggle Global** : Activer ou non la protection.
*   **Salon d'alerte** : Définition du salon où les rapports d'Automod sont envoyés.
*   **Protections spécifiques** : Ghost Ping, Anti-Spam, Anti-Liens, Mots interdits.

#### C. Économie
*   **Statut du système** : Activer/Désactiver l'économie sur le serveur.
*   **Configuration des gains** : (À venir) Paramétrage des récompenses journalières et du travail.

#### D. Utilitaires & Social
*   **Tickets** : Configuration des salons de support et des rôles autorisés.
*   **Bienvenue/Au revoir** : Personnalisation des messages et choix des salons.

---

## 4. Exigences UI/UX (Design)
*   **Thème Sombre (Dark Mode)** : Inspiré de l'interface Discord (couleurs : `#313338`, `#5865F2`, `#2b2d31`).
*   **Responsivité** : L'interface doit être utilisable sur mobile et tablette.
*   **Feedback Utilisateur** : Affichage d'alertes de succès/erreur lors de l'enregistrement des paramètres.

---

## 5. Spécifications Techniques
*   **Frontend** : EJS (Embedded JavaScript templates) pour le rendu dynamique, Vanilla CSS pour le style.
*   **Backend** : Express.js avec gestion de sessions.
*   **Base de données** : Intégration directe avec le module `db.js` (Mongoose) pour assurer la cohérence entre les commandes Discord et le web.
*   **Vitesse** : Utilisation du cache interne du bot pour un chargement instantané des paramètres.

---

## 6. Évolutions Futures (Roadmap)
*   **OAuth2 Discord** : Permettre aux modérateurs de se connecter avec leur propre compte Discord.
*   **Visualiseur de Logs en direct** : Flux temps réel des actions du bot sur la page web.
*   **Éditeur d'Embeds** : Interface visuelle pour créer des annonces stylisées.
