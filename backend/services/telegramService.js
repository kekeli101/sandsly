const axios = require('axios');
const config = require('../config/telegram');

class TelegramService {
  /**
   * Send order notification via Telegram
   * @param {Object} orderData - Order information
   * @returns {Promise}
   */
  static async sendOrderNotification(orderData) {
    try {
      const message = this.formatOrderMessage(orderData);
      const response = await axios.post(
        `${config.API_URL}${config.BOT_TOKEN}/sendMessage`,
        {
          chat_id: config.CHAT_ID,
          text: message,
          parse_mode: 'HTML'
        }
      );
      
      console.log('Telegram notification sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending Telegram notification:', error.message);
      throw error;
    }
  }

  /**
   * Format order data into a readable Telegram message
   * @param {Object} orderData - Order information
   * @returns {String} - Formatted message
   */
  static formatOrderMessage(orderData) {
    const { items, total, customerName, customerPhone, notes } = orderData;
    
    let itemsList = '';
    if (items && items.length > 0) {
      itemsList = items
        .map(item => `  • <b>${item.title}</b> x${item.qty} - GH₵${(item.price * item.qty).toFixed(2)}`)
        .join('\n');
    }
    
    const message = `
<b>🍔 NEW ORDER RECEIVED</b>
━━━━━━━━━━━━━━━━━

<b>Customer Info:</b>
👤 Name: ${customerName || 'Not provided'}
📱 Phone: ${customerPhone || 'Not provided'}

<b>Items Ordered:</b>
${itemsList || 'No items'}

<b>Total Amount:</b> GH₵${total ? total.toFixed(2) : '0.00'}

${notes ? `<b>Special Notes:</b>\n${notes}` : ''}

<b>Status:</b> Pending ⏳
━━━━━━━━━━━━━━━━━
<i>Time: ${new Date().toLocaleString()}</i>
    `.trim();
    
    return message;
  }

  /**
   * Send a simple text message via Telegram
   * @param {String} message - Message text
   * @param {String} chatId - Optional custom chat ID
   * @returns {Promise}
   */
  static async sendMessage(message, chatId = null) {
    try {
      const response = await axios.post(
        `${config.API_URL}${config.BOT_TOKEN}/sendMessage`,
        {
          chat_id: chatId || config.CHAT_ID,
          text: message,
          parse_mode: 'HTML'
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error sending Telegram message:', error.message);
      throw error;
    }
  }

  /**
   * Send reservation notification via Telegram
   * @param {Object} reservationData - Reservation information
   * @returns {Promise}
   */
  static async sendReservationNotification(reservationData) {
    try {
      const { customerName, phone, email, guests, date, time, requests } = reservationData;
      
      const message = `
<b>🎫 NEW RESERVATION</b>
━━━━━━━━━━━━━━━━━

<b>Customer Info:</b>
👤 Name: ${customerName}
📱 Phone: ${phone}
✉️ Email: ${email}

<b>Reservation Details:</b>
👥 Guests: ${guests}
📅 Date: ${date}
⏰ Time: ${time}

${requests ? `<b>Special Requests:</b>\n${requests}` : '<b>Special Requests:</b> None'}

<b>Status:</b> Pending Confirmation ⏳
━━━━━━━━━━━━━━━━━
<i>Received: ${new Date().toLocaleString()}</i>
      `.trim();
      
      return await this.sendMessage(message);
    } catch (error) {
      console.error('Error sending reservation notification:', error.message);
      throw error;
    }
  }
}

module.exports = TelegramService;
