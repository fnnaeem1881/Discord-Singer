module.exports = {
  name: 'np',
  description: 'Shows now playing song',
  async execute(message, args, distube) {
    const queue = distube.getQueue(message);
    if (!queue || !queue.songs.length) return message.reply("❌ Nothing is playing.");
    
    const song = queue.songs[0];
    message.channel.send(`🎶 Now Playing: \`${song.name}\` - \`${song.formattedDuration}\``);
  }
};
