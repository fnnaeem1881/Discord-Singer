module.exports = {
  name: 'queue',
  async execute(message, args, distube) {
    const queue = distube.getQueue(message.guildId);
    if (!queue) return message.reply('No songs in queue.');
    const songs = queue.songs
      .map((song, id) => `${id + 1}. ${song.name} - \`${song.formattedDuration}\``)
      .slice(0, 10)
      .join('\n');
    message.reply(`**Current Queue:**\n${songs}`);
  }
};
