require('dotenv').config();
const {
  Client,
  Collection,
  GatewayIntentBits,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const fs = require('fs');
const path = require('path');


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter((f) => f.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

const YOUTUBE_COOKIE_STRING = process.env.YOUTUBE_COOKIES || '';

client.distube = new DisTube(client, {
  plugins: [
    new YtDlpPlugin({
      update: true,
      requestOptions: { headers: { cookie: YOUTUBE_COOKIE_STRING } },
    }),
  ],

});

const prayerTimes = {
  fajr: '03:50',
  dhuhr: '11:55',
  asr: '15:16',
  maghrib: '18:36',
  isha: '20:00',
};

const ADHAN_AUDIO = path.join(__dirname, 'audios', 'adhan.mp3');
let lastPlayedPrayer = null;

function isPrayerTime() {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return Object.entries(prayerTimes).find(([name, time]) => time === currentTime) || null;
}

async function playPrayer(queue) {
  console.log('Attempting to play prayer audio via DisTube...');

  if (!queue) {
    console.log('playPrayer: Queue is undefined, cannot play.');
    return false;
  }
  
  const voiceChannel = queue.voiceChannel;
  if (!voiceChannel) {
    console.log('playPrayer: Bot is not in a voice channel. Cannot play adhan.');
    return false;
  }

  // Check if adhan audio file exists
  if (!fs.existsSync(ADHAN_AUDIO)) {
      console.error(`Error: Adhan audio file not found at ${ADHAN_AUDIO}`);
      return false;
  }

  try {
    console.log('playPrayer: Adding adhan to DisTube queue...');
    await client.distube.play(voiceChannel, ADHAN_AUDIO, {
      textChannel: queue.textChannel,
      member: voiceChannel.guild.members.me, 
      skip: true,
      type: 'file' // <--- ADDED THIS LINE
    });

    console.log('playPrayer: Adhan successfully added to DisTube queue.');
    return true;

  } catch (error) {
    console.error('Error playing prayer audio via DisTube:', error);
    return false;
  }
}


function createMusicPlayerButtons() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('backward').setLabel('⏪ Backward (10s)').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('pause').setLabel('⏸️ Pause').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('resume').setLabel('▶️ Resume').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('forward').setLabel('⏩ Forward (10s)').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('skip').setLabel('⏭️ Skip').setStyle(ButtonStyle.Danger)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('loop').setLabel('🔁 Loop').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('shuffle').setLabel('🔀 Shuffle').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('stop').setLabel('⏹️ Stop').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('prayer').setLabel('🕌 Prayer').setStyle(ButtonStyle.Primary)
  );

  return [row1, row2];
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  setInterval(async () => {
    const prayer = isPrayerTime();
    if (!prayer) {
      lastPlayedPrayer = null;
      return;
    }

    const [prayerName, prayerTime] = prayer;

    if (lastPlayedPrayer === prayerName) {
      return;
    }
    lastPlayedPrayer = prayerName;

    console.log(`Prayer time detected: ${prayerName} at ${prayerTime}`);

    for (const [guildId, guild] of client.guilds.cache) {
      const queue = client.distube.getQueue(guildId);
      
      // Prefer using an existing queue if it exists and the bot is in a voice channel
      if (queue && queue.voiceChannel) { 
        try {
          const msg = await queue.textChannel.send(
            `🕌 It's time for **${prayerName}** prayer. Playing Adhan now...`
          ).catch(() => null);
          
          const success = await playPrayer(queue);
          if (!success && msg) {
            await msg.edit('Failed to play Adhan.').catch(() => {});
          }
        } catch (error) {
          console.error(`Failed to play adhan in guild ${guildId}:`, error);
        }
      } else if (guild.me.voice.channel) {
        // If no DisTube queue, but bot is already in a voice channel (e.g., joined manually)
        console.log(`Bot is in voice channel ${guild.me.voice.channel.name} in guild ${guildId} but no active DisTube queue. Attempting to play adhan there directly.`);
        try {
            // Create a temporary queue-like object for playPrayer
            const tempQueue = {
                voiceChannel: guild.me.voice.channel,
                // Attempt to find a suitable text channel to send messages
                textChannel: guild.channels.cache.find(c => c.type === 0 && c.permissionsFor(client.user).has(PermissionsBitField.Flags.SendMessages)),
                guild: guild 
            };
            
            if (!tempQueue.textChannel) {
                console.warn(`Could not find a suitable text channel in guild ${guildId} to send adhan messages.`);
            }

            const msg = tempQueue.textChannel ? await tempQueue.textChannel.send(
                `🕌 It's time for **${prayerName}** prayer. Playing Adhan now...`
            ).catch(() => null) : null;

            const success = await playPrayer(tempQueue);
            if (!success && msg) {
                await msg.edit('Failed to play Adhan.').catch(() => {});
            }
        } catch (error) {
            console.error(`Failed to play adhan in guild ${guildId} (no queue, bot already in VC):`, error);
        }
      } else {
        console.log(`No active queue or bot not in voice channel in guild ${guildId}, skipping adhan.`);
      }
    }
  }, 60 * 1000); // Check every minute
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith('!')) return;

  const botMember = message.guild.members.me;
  const neededPerms = [
    PermissionsBitField.Flags.ReadMessageHistory,
    PermissionsBitField.Flags.SendMessages
  ];
  const missing = neededPerms.filter((p) => !message.channel.permissionsFor(botMember).has(p));
  if (missing.length) {
    console.warn(`Missing permissions in #${message.channel.name} for bot: ${missing.join(', ')}`);
    return message.reply(`I need the following permissions in this channel to function: ${missing.map(p => `\`${p}\``).join(', ')}.`).catch(() => {});
  }

  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args, client.distube);
  } catch (err) {
    console.error(err);
    message.reply('Error running command!').catch(() => {});
  }
});

client.distube.on('playSong', async (queue, song) => {
  try {
    await queue.textChannel.send({
      content: `🎶 Now playing: **${song.name}**\nRequested by: ${song.user}`,
      components: createMusicPlayerButtons(),
    });
  } catch (error) {
    console.error('Error sending music player UI:', error);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const queue = client.distube.getQueue(interaction.guild.id);

  try {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] }).catch(() => {});

    if (!queue) {
      return await interaction.editReply({ 
        content: 'There is no active music queue in this server.',
        flags: [MessageFlags.Ephemeral] 
      }).catch(() => {});
    }

    switch (interaction.customId) {
      case 'pause':
        if (!queue.paused) {
          queue.pause();
          await interaction.editReply({ content: '⏸️ Paused the music.' });
        } else {
          await interaction.editReply({ content: 'Music is already paused.' });
        }
        break;

      case 'resume':
        if (queue.paused) {
          queue.resume();
          await interaction.editReply({ content: '▶️ Resumed the music.' });
        } else {
          await interaction.editReply({ content: 'Music is not paused.' });
        }
        break;

      case 'skip':
        if (queue.songs.length > 1) {
          queue.skip();
          await interaction.editReply({ content: '⏭️ Skipped the song.' });
        } else {
          await interaction.editReply({ content: 'There are no more songs to skip to.' });
        }
        break;

      case 'stop':
        queue.stop();
        await interaction.editReply({ content: '⏹️ Stopped the music and cleared the queue.' });
        break;

      case 'loop': {
        let currentMode = queue.repeatMode;
        let newMode;
        let modeName;

        if (currentMode === 0) {
          newMode = 1;
          modeName = 'Repeat song';
        } else if (currentMode === 1) {
          newMode = 2;
          modeName = 'Repeat queue';
        } else {
          newMode = 0;
          modeName = 'Off';
        }
        
        queue.setRepeatMode(newMode);
        await interaction.editReply({ content: `🔁 Loop mode is now: **${modeName}**` });
        break;
      }

      case 'shuffle':
        queue.shuffle();
        await interaction.editReply({ content: '🔀 Shuffled the queue.' });
        break;

      case 'forward': {
        const currentTime = queue.currentTime;
        const duration = queue.songs[0]?.duration || 0;
        let seekTime = currentTime + 10;
        if (seekTime > duration && duration > 0) seekTime = duration;
        if (seekTime < 0) seekTime = 0;
        
        if (queue.songs.length > 0) {
            queue.seek(seekTime);
            await interaction.editReply({ content: '⏩ Skipped forward 10 seconds.' });
        } else {
            await interaction.editReply({ content: 'No song is currently playing to seek.' });
        }
        break;
      }

      case 'backward': {
        const currentTime = queue.currentTime;
        let seekTime = currentTime - 10;
        if (seekTime < 0) seekTime = 0;
        
        if (queue.songs.length > 0) {
            queue.seek(seekTime);
            await interaction.editReply({ content: '⏪ Skipped backward 10 seconds.' });
        } else {
            await interaction.editReply({ content: 'No song is currently playing to seek.' });
        }
        break;
      }

      case 'prayer': {
        const success = await playPrayer(queue);
        await interaction.editReply({
          content: success
            ? '🕌 Playing prayer Adhan sound now.'
            : 'Failed to play prayer sound. Check bot permissions or Adhan file.'
        });
        break;
      }

      default:
        await interaction.editReply({ content: 'Unknown button action.' });
    }
  } catch (error) {
    console.error('Error handling button interaction:', error);
    
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({
        content: 'An error occurred while processing your request. Check console for details.'
      }).catch(() => { });
    } else {
        await interaction.reply({
            content: 'An error occurred while processing your request. Check console for details.',
            flags: [MessageFlags.Ephemeral]
        }).catch(() => {});
    }
  }
});

client.login(process.env.TOKEN);