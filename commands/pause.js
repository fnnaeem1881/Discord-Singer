module.exports = {
  name: 'pause',
  async execute(message, args, distube) {
    const queue = distube.getQueue(message.guildId);
    if (!queue) return message.reply('No song is playing.');
    if (queue.paused) return message.reply('Already paused.');
    queue.pause();
    message.reply('⏸️ Paused the music.');
  }
};
