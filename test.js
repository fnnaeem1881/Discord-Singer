require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, VoiceConnectionStatus, AudioPlayerStatus } = require('@discordjs/voice');
const path = require('path');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

const TEST_AUDIO = path.join(__dirname, 'audios', 'adhan.mp3'); // Or any short, valid MP3

client.once('ready', async () => { // <--- THIS IS ALREADY AN ASYNC FUNCTION
    console.log(`Test Bot logged in as ${client.user.tag}`);

    // *** REPLACE WITH YOUR GUILD ID AND A VOICE CHANNEL ID WHERE YOUR BOT HAS PERMISSIONS ***
    const guildId = '645304802489663499';
    const channelId = '1373577232164847647';

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
        console.error('Guild not found. Check GUILD_ID. Make sure the bot is in this guild.');
        client.destroy();
        return;
    }

    const voiceChannel = guild.channels.cache.get(channelId);
    if (!voiceChannel || voiceChannel.type !== 2) { // Type 2 is VoiceChannel
        console.error('Voice channel not found or is not a voice channel. Check CHANNEL_ID.');
        client.destroy();
        return;
    }

    console.log(`Attempting to join voice channel: ${voiceChannel.name} in guild: ${guild.name}`);

    let connection;
    let player;

    try {
        connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
        });

        console.log('Voice connection initiated. Waiting for ready state...');
        await entersState(connection, VoiceConnectionStatus.Ready, 30_000); // Give it more time
        console.log('Voice connection is READY!');

        if (!fs.existsSync(TEST_AUDIO)) {
            console.error(`ERROR: Test audio file not found at ${TEST_AUDIO}`);
            connection.destroy();
            client.destroy();
            return;
        }

        player = createAudioPlayer();
        const resource = createAudioResource(TEST_AUDIO);

        console.log('Starting audio playback...'); // Changed 'console' to 'console.log'
        player.play(resource);
        connection.subscribe(player);

        await new Promise((resolve, reject) => {
            player.once(AudioPlayerStatus.Idle, () => {
                console.log('Audio finished playing.');
                resolve();
            });
            player.once('error', (error) => {
                console.error('Audio player error:', error);
                reject(error);
            });
        });

        console.log('Playback complete. Disconnecting...');
        connection.destroy();

    } catch (error) {
        console.error('An error occurred during voice test:', error);
        if (connection) connection.destroy(); // Ensure connection is destroyed on error
    } finally {
        // client.destroy() here would stop the bot even if the connection was successful,
        // which might not be what you want for a continuous test.
        // For a single-shot test, it's fine. For your main bot, keep client.destroy() out of general finally blocks.
        client.destroy(); 
    }
});

client.login(process.env.DISCORD_TOKEN);