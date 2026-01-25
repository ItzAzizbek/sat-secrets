const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;


// Create a bot instance
// polling: false because we only want to send messages, not receive updates via polling in this process
// If user wants full bot interactivity, they might need polling or webhook. 
// For now, simpler is better: just sending notifications.
const bot = new TelegramBot(token, { polling: false });

exports.sendNotification = async (message) => {
  if (!token || !chatId) {
    console.warn('Telegram credentials missing, skipping notification.');
    return;
  }
  try {
    // Enable HTML parsing for styled messages
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    console.log('Telegram notification sent.');
  } catch (error) {
    console.error('Telegram Error:', error.message);
  }
};
