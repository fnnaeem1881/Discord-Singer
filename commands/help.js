module.exports = {
  name: 'help',
  async execute(message) {
    const helpText = `
**Music Commands:**
!play <song or URL> - Play a song or add to queue
!skip - Skip current song
!stop - Stop and clear queue
!pause - Pause playback
!resume - Resume playback
!queue - Show current queue

**Player Buttons (after !play):**
⏪ Backward 10s
⏸️ Pause
▶️ Resume
⏩ Forward 10s
⏭️ Skip
🔁 Loop (Toggle)
🔀 Shuffle
⏹️ Stop
    `;
    message.reply(helpText);
  }
};
