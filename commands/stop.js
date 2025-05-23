module.exports = {
  name: 'stop',
  async execute(message, args, distube) {
    const queue = distube.getQueue(message.guildId);
    if (!queue) return message.reply('No song is playing.');
    queue.stop();
    message.reply('⏹️ Stopped playback and cleared the queue.');
  }
};
