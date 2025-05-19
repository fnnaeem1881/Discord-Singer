module.exports = {
  name: 'stop',
  description: 'Stop playing and leave the voice channel',
  async execute(message, args, distube) {
    if (!message.member.voice.channel) {
      return message.reply('You need to be in a voice channel to stop music!');
    }
    const queue = distube.getQueue(message.guildId);
    if (!queue) return message.reply('There is no music playing.');

    try {
      queue.stop();
      message.reply('Stopped the music and left the voice channel.');
    } catch (error) {
      console.error(error);
      message.reply('Error occurred while stopping the music.');
    }
  },
};
