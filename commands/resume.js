module.exports = {
  name: 'resume',
  async execute(message, args, distube) {
    const queue = distube.getQueue(message.guildId);
    if (!queue) return message.reply('No song is playing.');
    if (!queue.paused) return message.reply('The music is already playing.');
    queue.resume();
    message.reply('▶️ Resumed the music.');
  }
};
