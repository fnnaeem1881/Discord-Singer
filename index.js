require('dotenv').config();
const { Client, Collection, GatewayIntentBits } = require('discord.js');
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

// Load commands dynamically from ./commands folder
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

// Setup DisTube with yt-dlp plugin and ffmpeg-static under the hood
client.distube = new DisTube(client, {
  plugins: [new YtDlpPlugin()],
  leaveOnEmpty: true,
  emitNewSongOnly: true,
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.author.bot || !message.content.startsWith('!')) return;
  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args, client.distube);
  } catch (error) {
    console.error(error);
    message.reply('There was an error trying to execute that command!');
  }
});

// DisTube event listeners
client.distube
  .on('playSong', (queue, song) =>
    queue.textChannel.send(`🎶 Now playing: \`${song.name}\` - \`${song.formattedDuration}\``)
  )
  .on('addSong', (queue, song) =>
    queue.textChannel.send(`✅ Added to queue: \`${song.name}\` - \`${song.formattedDuration}\``)
  )
  .on('error', (channel, error) => {
    console.error(error);
    if (channel) channel.send(`❌ An error occurred: ${error.message}`);
  });

client.login(process.env.DISCORD_TOKEN);
