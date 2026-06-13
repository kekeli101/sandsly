// Telegram Bot Configuration
// Get your bot token from BotFather: https://t.me/botfather

module.exports = {
  BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE',
  CHAT_ID: process.env.TELEGRAM_CHAT_ID || 'YOUR_CHAT_ID_HERE',
  API_URL: 'https://api.telegram.org/bot'
};
