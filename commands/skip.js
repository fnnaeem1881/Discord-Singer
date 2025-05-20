// commands/skip.js
module.exports = {
  name: 'skip',
  description: 'Skip the currently playing song.',
  async execute(message, args, distube) {
    const queue = distube.getQueue(message);
    if (!queue) return message.reply('❌ There is no song to skip.');

    try {
      await queue.skip();
      message.channel.send('⏭️ Skipped to the next song.');
    } catch (error) {
      console.error('Error skipping song:', error);
      message.channel.send('⚠️ Unable to skip the song.');
    }
  },
};
