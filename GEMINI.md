# DSU-V4 — Règles de Développement

Ce fichier définit les standards de code et les comportements spécifiques pour le projet DSU-V4.

## 1. Interface & Design du Bot

- **Utilisation systématique des Embeds** : Toutes les réponses du bot destinées aux utilisateurs finaux doivent impérativement utiliser des Embeds. 
  - Utiliser l'utilitaire `src/utils/embeds.js` pour garantir la cohérence des couleurs et du style.
  - Les messages en texte brut sont réservés aux erreurs critiques ou aux flags éphémères simples si nécessaire, mais l'Embed reste la priorité.
- **Commandes distinctes** : Privilégier des commandes Slash individuelles et explicites plutôt que d'abuser des sous-commandes. Chaque fonctionnalité majeure doit être facilement identifiable dans le menu des commandes Discord.

---

## 2. Gestion des changements

- **Changements mineurs** : Commiter et pousser immédiatement les corrections légères, refactoring simple ou mises à jour de documentation.
- **Changements majeurs** : Demander confirmation avant toute modification structurelle ou architecturale importante.

---

## 3. Maintenance

- **Changelog** : Mettre à jour `CHANGELOG.md` à chaque commit (Date, Type, Description).
- **Analyse d'erreurs** : Toujours investiguer la cause racine d'un bug avant de proposer un correctif.
- **Validation** : Vérifier systématiquement les effets de bord et les logs avant de clôturer une tâche.
- **Cohérence** : Suivre scrupuleusement les patterns existants (Services, Models, Utils).
