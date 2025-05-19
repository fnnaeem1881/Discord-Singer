module.exports = {
  name: 'play',
  description: 'Play a song from YouTube or other supported sources',
  async execute(message, args, distube) {
    if (!message.member.voice.channel) {
      return message.reply('You need to be in a voice channel to play music!');
    }
    if (!args.length) {
      return message.reply('Please provide a song name or URL!');
    }
    try {
      await distube.play(message.member.voice.channel, args.join(' '), {
        textChannel: message.channel,
        member: message.member,
      });
    } catch (error) {
      console.error(error);
      message.reply('Error occurred while trying to play the song.');
    }
  },
};
