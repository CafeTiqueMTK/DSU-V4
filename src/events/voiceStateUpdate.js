const { Events } = require('discord.js');
const { getLogChannel } = require('../utils/logger');

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    const logChannel = await getLogChannel(newState.guild, "vocal");
    if (!logChannel) return;

    if (!oldState.channel && newState.channel) {
      logChannel.send({
        embeds: [{
          title: '🔊 Voice Channel Join',
          description: `${newState.member.user.tag} joined **${newState.channel.name}**`,
          color: 0x00bfff,
          timestamp: new Date()
        }]
      }).catch(e => console.error('Failed to send join log:', e));
    } else if (oldState.channel && !newState.channel) {
      logChannel.send({
        embeds: [{
          title: '🔇 Voice Channel Leave',
          description: `${oldState.member.user.tag} left **${oldState.channel.name}**`,
          color: 0xff5555,
          timestamp: new Date()
        }]
      }).catch(e => console.error('Failed to send leave log:', e));
    } else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
      logChannel.send({
        embeds: [{
          title: '🔄 Voice Channel Switch',
          description: `${newState.member.user.tag} switched from **${oldState.channel.name}** to **${newState.channel.name}**`,
          color: 0xffcc00,
          timestamp: new Date()
        }]
      }).catch(e => console.error('Failed to send switch log:', e));
    }
  },
};
