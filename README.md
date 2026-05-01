# DSU-V4

DSU-V4 (Discord Server Utility) is a multi-purpose Discord bot developed with [discord.js](https://discord.js.org/). The project is built with a modular structure to simplify feature expansion and codebase maintenance.

## Architecture

The project employs a service-oriented approach to decouple business logic from the Discord interface:

- **Core (`src/client.js`)**: An extension of the Discord.js `Client` class, responsible for bot orchestration.
- **Modules (`src/modules/`)**: Domain-specific business logic (Economy, Moderation, Tickets, etc.).
- **Models (`src/models/`)**: Data schema definitions using Mongoose.
- **Commands (`src/commands/`)**: Implementation of Slash Commands.
- **Events (`src/events/`)**: Discord event handlers.
- **Database (`src/db.js`)**: Connection interface and abstraction layer for MongoDB.

## Features

- **Moderation**: Event logging system, warning (warns) management, and automated filtering.
- **Economy**: Virtual currency system, daily rewards, and leaderboards.
- **Utilities**: Ticket system, reaction-based roles, and announcements.
- **Integrations**: Experimental support for Gemini AI and GitHub repository tracking.
- **Social**: Interaction commands and marriage system.

## Prerequisites

- Node.js (v18.0.0 or higher)
- MongoDB (Local or Atlas)
- A Discord Developer account and a bot token

## Development

The project includes tools to maintain code consistency:

- `npm run lint`: Static code analysis via ESLint.
- `npm run format`: Automatic code formatting via Prettier.
- `npm run check`: Syntax and command integrity verification.

## License

This project is distributed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See the `LICENSE` file for details.
