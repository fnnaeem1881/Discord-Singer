require('dotenv').config();
const { Client, Collection, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

// Paste your YouTube cookie string here (get from browser, as explained)
const YOUTUBE_COOKIE_STRING = "GPS=1; PREF=f6=40000000&tz=Asia.Dhaka";

client.distube = new DisTube(client, {
  plugins: [
    new YtDlpPlugin({
      update: true,
      requestOptions: {
        headers: {
          cookie: YOUTUBE_COOKIE_STRING
        }
      }
    })
  ],
  leaveOnEmpty: true,
  emitNewSongOnly: true
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.author.bot || !message.content.startsWith('!')) return;

  const botMember = message.guild.members.me;

  // Permissions the bot absolutely needs to operate here
  const neededPerms = [
    PermissionsBitField.Flags.ReadMessageHistory,
    PermissionsBitField.Flags.SendMessages
  ];

  const missing = neededPerms.filter(perm => !message.channel.permissionsFor(botMember).has(perm));
  if (missing.length) {
    console.warn(`Missing permissions in #${message.channel.name}: ${missing.map(p => PermissionsBitField.Flags[p] || p).join(', ')}`);
    return; // Don't run if missing important permissions
  }

  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args, client.distube);
  } catch (error) {
    console.error(error);
    try {
      await message.reply('There was an error trying to execute that command!');
    } catch {
      console.warn('Cannot reply due to missing permissions.');
    }
  }
});

// Distube event handlers
client.distube
  .on('playSong', (queue, song) => {
    if (queue.textChannel.permissionsFor(queue.client.user).has(PermissionsBitField.Flags.SendMessages)) {
      queue.textChannel.send(`🎶 Playing: \`${song.name}\``);
    }
  })
  .on('addSong', (queue, song) => {
    if (queue.textChannel.permissionsFor(queue.client.user).has(PermissionsBitField.Flags.SendMessages)) {
      queue.textChannel.send(`✅ Added: \`${song.name}\``);
    }
  })
  .on('error', (channel, e) => {
    console.error(e);
    if (channel.permissionsFor(channel.client.user).has(PermissionsBitField.Flags.SendMessages)) {
      channel.send('❌ An error occurred: ' + e.message).catch(() => console.warn('Cannot send error message.'));
    }
  });

client.login(process.env.DISCORD_TOKEN);
