const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'player',
  async execute(message, args, distube) {
    const queue = distube.getQueue(message.guild);
    if (!queue) return message.channel.send('❌ No music is currently playing.');

    const song = queue.songs[0];

    const embed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('🎵 Now Playing')
      .setDescription(`**[${song.name}](${song.url})**\nDuration: \`${song.formattedDuration}\``)
      .setFooter({ text: 'Use the buttons below to control music playback.' })
      .setThumbnail(song.thumbnail || null);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('backward').setLabel('⏪ 10s').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('pause').setLabel('⏸️ Pause').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('resume').setLabel('▶️ Resume').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('forward').setLabel('⏩ 10s').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('skip').setLabel('⏭️ Skip').setStyle(ButtonStyle.Primary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('loop').setLabel('🔁 Loop').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('shuffle').setLabel('🔀 Shuffle').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('stop').setLabel('⏹️ Stop').setStyle(ButtonStyle.Danger)
    );

    message.channel.send({ embeds: [embed], components: [row, row2] });
  },
};
