module.exports = {
  name: 'play',
  async execute(message, args, distube) {
    if (!args[0]) return message.reply('Provide a song name or link.');
    if (!message.member.voice.channel) return message.reply('Join a voice channel first.');

    distube.play(message.member.voice.channel, args.join(' '), {
      textChannel: message.channel,
      member: message.member
    });
  }
};
