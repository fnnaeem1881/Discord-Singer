// Example: commands/loop.js
module.exports = {
  name: 'loop',
  async execute(message, args, distube) {
    const queue = distube.getQueue(message);
    if (!queue) return message.reply('There is no queue currently.');
    const mode = queue.toggleRepeatMode();
    const modeName = mode === 0 ? 'Off' : mode === 1 ? 'Repeat song' : 'Repeat queue';
    message.channel.send(`🔁 Loop mode is now: **${modeName}**`);
  },
};
