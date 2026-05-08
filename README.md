# DSU-V4 | Multi-Function Discord Bot 🚀

DSU-V4 is a versatile and modular Discord bot designed with [discord.js](https://discord.js.org/). It offers a complete solution for managing, entertaining, and securing your server.

## ✨ Key Features

### 🛡️ Moderation & Security
- **Sanction System**: Ban, Kick, Mute (timeout), and Warn with database tracking.
- **Intelligent Automod**: Protection against spam, advertisement links, ghost pings, and forbidden words.
- **Detailed Logs**: Complete event tracking (deleted/edited messages, joins/leaves, moderation actions).
- **Role Management**: Reaction-role system for seamless self-assignment.

### 💰 Economy & Social
- **Virtual Economy**: Earn currency via `/daily` and `/work`. Play Rock-Paper-Scissors (`/rps`).
- **Leaderboard**: View the wealthiest users on the server.
- **Marriage System**: A complete module to get married, manage couple profiles, and social interactions.
- **Fun Commands**: Animal images (`/cat`, `/dog`), Reddit memes (`/meme`), and more.

### 🎫 Support & Utilities
- **Ticket System**: Integrated customer support with private channels and role-based management.
- **Welcome Messages**: Personalized welcome for new members.
- **Embed Builder**: Create professional announcements via a visual modal interface.
- **External Integrations**: Search GitHub profiles and repositories directly from Discord.

### 📊 Web Dashboard
- An intuitive web interface to configure the bot without using text commands.
- Real-time management of settings for each guild.
- **Style**: Modern "Manus AI" design with dark mode, glassmorphism, and bento grids.

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** v18.0.0 or higher.
- **MongoDB** (Local or Atlas).
- A Discord bot token.

### Configuration
1. Clone the repository.
2. Install dependencies: `npm install`.
3. Copy `.env.example` to `.env` and fill in the variables:
   ```env
   TOKEN=your_token
   MONGO_URI=your_mongodb_uri
   CLIENT_ID=bot_id
   ...
   ```

### Running
- **Deploy Slash Commands**: `npm run deploy:commands`
- **Start**: `npm start`
- **Development Mode**: `npm run dev`
- **UI Test Mode**: `./dsu.sh mockui`

---

## 🛠️ Architecture

The project uses a service-oriented approach to decouple business logic from the Discord interface:

- **Core (`src/client.js`)**: Bot orchestration.
- **Modules (`src/modules/`)**: Business logic (Economy, Moderation, Tickets).
- **Dashboard (`src/web/`)**: Express server and EJS templates for the web interface.

---

## 📜 License

This project is distributed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.
