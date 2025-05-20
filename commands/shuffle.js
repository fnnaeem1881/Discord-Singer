// commands/shuffle.js
module.exports = {
  name: 'shuffle',
  description: 'Shuffle the current music queue.',
  async execute(message, args, distube) {
    const queue = distube.getQueue(message);
    if (!queue) return message.reply('❌ There is no active queue to shuffle.');

    queue.shuffle();
    message.channel.send('🔀 The queue has been shuffled.');
  },
};
