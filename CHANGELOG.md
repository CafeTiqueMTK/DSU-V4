# Changelog

All notable changes to this project will be documented in this file.

## [2026-05-02]
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
