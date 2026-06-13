/**
 * Telegram Integration for SandSly Orders
 * Sends order and reservation data to backend for Telegram notification
 */

const TelegramIntegration = {
  // API endpoint (update this to your backend URL)
  API_URL: 'http://localhost:5000',
  
  /**
   * Send order to backend (which forwards to Telegram)
   * @param {Array} cartItems - Items in the cart
   * @param {Number} total - Total price
   * @param {Object} customerData - Customer info {name, phone, notes}
   */
  async sendOrder(cartItems, total, customerData) {
    try {
      // Validate inputs
      if (!customerData.name || !customerData.phone) {
        alert('Please provide your name and phone number');
        return false;
      }

      const orderData = {
        items: cartItems,
        total: total,
        customerName: customerData.name,
        customerPhone: customerData.phone,
        notes: customerData.notes || ''
      };

      const response = await fetch(`${this.API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Order sent to Telegram!', result.orderId);
        return true;
      } else {
        console.error('❌ Error sending order:', result.message);
        alert('Error: ' + result.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Network error sending order:', error);
      alert('Network error. Please check your connection.');
      return false;
    }
  },

  /**
   * Send reservation to backend (which forwards to Telegram)
   * @param {Object} reservationData - Reservation details
   */
  async sendReservation(reservationData) {
    try {
      // Validate required fields
      if (!reservationData.customerName || !reservationData.phone || 
          !reservationData.email || !reservationData.guests || 
          !reservationData.date || !reservationData.time) {
        alert('Please fill in all required fields');
        return false;
      }

      const response = await fetch(`${this.API_URL}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reservationData)
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Reservation sent to Telegram!', result.reservationId);
        return true;
      } else {
        console.error('❌ Error sending reservation:', result.message);
        alert('Error: ' + result.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Network error sending reservation:', error);
      alert('Network error. Please check your connection.');
      return false;
    }
  }
};
