const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`🤖 Bot is ready and logged in as ${client.user.tag}`);
        console.log('Bot is fully operational and listening for events.');
    },
};
