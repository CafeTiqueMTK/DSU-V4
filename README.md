# DSU Preview Documentation

## 📜 Bot Commands

### Moderation
- `/mod [ban|kick|warn|mute]` - Core moderation actions with DM notifications.
- `/unban [userId]` - Remove a ban from a user.
- `/unmute [user]` - Remove mute status from a member.
- `/purge [all|bot]` - Bulk delete messages in a channel.
- `/clearmsg [user] [count]` - Delete specific user messages.
- `/clearwarn [user]` - Reset warnings for a member.

### Economy & Leveling
- `/claim` - Claim daily currency rewards.
- `/work` - Earn coins through work (1h cooldown).
- `/mycoins` - View your current balance and account status.
- `/rank` - Display the wealth leaderboard.
- `/ecoman [addcoins|freeze]` - Admin economy management.

### Administration & Config
- `/config` - Comprehensive bot settings (Logging, Roles, Welcome, etc.).
- `/automod [status|enable|disable|infochannel|safechannel]` - Configure global protections.
- `/strike [ghostping|raid|spam|nsfw|antilink|antiinvite|antirole]` - Toggle specific shields.
- `/keywords [add|list]` - Manage blacklisted words.
- `/ticket setup` - Initialize the private ticket support system.
- `/own guilds` - Bot owner only tools.
- `/reload` - Hot-reload all commands and deploy to Discord.

### Utility & Fun
- `/info [user|server|bot]` - Get detailed statistics and information.
- `/github [profile|repo]` - Lookup GitHub data and track updates.
- `/social [marry|hug]` - Interaction commands between users.
- `/fun [cat|dog|meme|rps|rate]` - Entertainment and games.
- `/weather [city]` - Current weather information.
- `/wiki [query]` - Search Wikipedia articles.
- `/ping` - Check bot and API latency.
- `/about` - Technical details about DSU Preview.

---

## 🏗️ Bot Architecture

The project follows a modular service-oriented architecture designed for stability and scalability.

### Core Structure
- `src/index.js` - **Entry Point**: Handles the supervisor wrapper and watchdog logic.
- `src/client.js` - **Bot Client**: Extends Discord.js Client, initializes modules and event listeners.
- `src/db.js` - **Database Engine**: Manages MongoDB connection, caching, and service orchestration.

### Directories
- `src/commands/` - implementation of all Slash commands organized by category.
- `src/events/` - Discord event handlers (MessageCreate, InteractionCreate, etc.).
- `src/modules/` - **Business Logic**: Contains specialized services (Economy, Moderation, Marriage, Tickets).
- `src/models/` - Mongoose schemas for MongoDB data persistence.
- `src/utils/` - Shared utilities:
  - `env.js`: Centralized configuration and secret management.
  - `embeds.js`: Global UI/UX styling and error handling.
  - `logger.js`: Asynchronous logging system.
  - `commandLoader.js`: Dynamic command discovery and registration.

### Data Persistence
- **MongoDB**: Primary store for guild settings and user data.
- **Memory Buffer**: High-performance cache for frequently updated data (XP/Coins).
- `data/`: Local storage for logs and legacy JSON backups.
