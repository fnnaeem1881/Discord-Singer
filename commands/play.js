module.exports = {
  name: 'play',
  async execute(message, args, distube) {
    if (!args.length) return message.reply('Please provide a song name or URL.');

    try {
      const queue = distube.getQueue(message.guild.id);
      // queue might be undefined here, so don't access queue.songs yet

      await distube.play(message.member.voice.channel, args.join(' '), {
        member: message.member,
        textChannel: message.channel,
      });

      const newQueue = distube.getQueue(message.guild.id);
      if (!newQueue || !newQueue.songs.length) return message.channel.send('Something went wrong with the queue.');

      message.channel.send(`🎶 Now playing: \`${newQueue.songs[0].name}\``);

    } catch (e) {
      console.error(e);
      message.reply('Failed to play the song.');
    }
  },
};
