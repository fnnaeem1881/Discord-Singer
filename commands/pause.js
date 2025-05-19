module.exports = {
  name: 'pause',
  execute(message, args, distube) {
    const queue = distube.getQueue(message);
    if (!queue) return message.channel.send('❌ Nothing is playing.');
    distube.pause(message);
    message.channel.send('⏸️ Music paused.');
  }
};
