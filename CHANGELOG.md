# Changelog

All notable changes to this project will be documented in this file.

## [2026-05-08]
- feat: refonte complète du dashboard web avec le style "Manus AI" (OLED Dark, glassmorphism, bento grids)
- feat: intégration de Tailwind CSS et Lucide Icons pour une interface moderne et réactive
- feat: nouveau système de tickets complet gérable depuis le web (catégorie, rôle support, messages personnalisés)
- feat: création d'un builder d'Embeds visuel avec prévisualisation Discord en temps réel
- feat: ajout d'un manager CLI `dsu.sh` pour simplifier le lancement (prod, dev, mockui) et la gestion de MongoDB
- feat: implémentation d'un mode de test UI autonome (`test-ui.js`) avec mocking complet de Discord.js et MongoDB
- feat: support de l'option `-nowebui` pour désactiver l'interface web au lancement
- docs: mise à jour de `archi.md` pour refléter la nouvelle structure de gestion et de test
- docs: ajout de `CLAUDE.md` pour définir les standards de développement du projet

## [2026-05-02]
- feat: expanded web dashboard with full server management (moderation, logs, automod, general settings)
- feat: implemented member moderation via web (ban, kick, warn, mute) with modals
- feat: added detailed configuration for log categories and automod security modules
- refactor: redesigned settings page with a sidebar layout for better navigation
- refactor: moved moderation logging to ModerationService for consistency between Discord and Web
- fix: fixed grid layout bug causing vertical stacking on the guilds page
- fix: ensured all main sections span full width for proper horizontal alignment
- fix: aligned guilds page components (header and cards) with the left margin of the navigation bar
- fix: restored left-aligned grid for guilds to ensure margin consistency across sections
- fix: aligned guilds page header horizontally with card content (padding offset)
- fix: aligned all section margins using a unified 4-column master grid
- fix: maintained centered widget layout for the servers page while keeping container alignment
- fix: unified dashboard grid system (4 equal columns for stats and quick actions)
- fix: standardized internal card alignment (fixed height, vertical centering of values)
- fix: refactored dashboard UI using CSS Grid for perfect alignment of text, buttons, and components
- fix: refined web dashboard UI (increased font sizes, adjusted margins and component dimensions for better readability)
- feat: added custom web dashboard with authentication (thm.dsu/Thomas49)
- feat: implemented a coherent dark-themed UI for the web interface
- chore: added `ejs` dependency for web templating
- refactor: integrated web server into the bot's initialization process
- refactor: removed hardcoded IDs and repository paths, moved to environment variables (`OWNER_ID`, `GITHUB_OWNER`, `GITHUB_REPO`)
- fix: translated remaining French strings in `messageCreate.js` and leveling system
- fix: corrected invalid nested subcommand structure in `config.js`
- refactor: modularized `src/db.js` by extracting logic into domain services
- refactor: moved entry point to `src/index.js` and introduced a `Bot` class in `src/client.js`
- chore: updated `package.json` scripts and added ESLint/Prettier configuration
- chore: added `.env.example` and translated README.md to English
- refactor: centralized command structure into thematic files
- feat: updated command loader to support files exporting multiple commands via arrays
- feat: added production and local modes for environment configuration

## [2026-05-07]
- feat: extension de l'Automod avec anti-link, anti-invite et anti-role ping
- feat: ajout des sous-commandes de configuration `/automod antilink/antiinvite/antirole/blockrole`
- refactor: fusion des listes `nsfw_en.json` et `nsfw_fr.json` vers `banword.json` et chargement dynamique par le bot
- docs: création de `GEMINI.md` avec les règles de design du bot (embeds uniquement, commandes distinctes)
- feat: ajout de la commande standalone `/ping` pour mesurer la latence
- feat: suppression complète de l'intégration Google Gemini (commandes, logs, config)
- docs: refonte complète du README.md pour présenter les fonctionnalités du bot en français

## [2026-05-06]
- chore: removed all emojis from terminal and file logs for a cleaner output
- fix: corrected corrupted structure and syntax errors in `src/db.js`
- feat: complete visual overhaul of Discord embeds for a "richer" and more premium look
- feat: introduced `src/utils/embeds.js` to centralize bot styling (colors, emojis, templates)
- refactor: updated all command modules (admin, economy, fun, moderation, general, tickets, roles, integrations) to use the new styling utility
- refactor: enhanced event embeds for welcome, farewell, and log notifications
- feat: improved `info server` and `info bot` commands with more detailed statistics and better layout
- feat: added more interactive visual cues (emojis, fields) to all moderation and economy responses
