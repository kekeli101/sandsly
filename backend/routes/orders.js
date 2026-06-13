const express = require('express');
const router = express.Router();
const TelegramService = require('../services/telegramService');

/**
 * POST /api/orders
 * Create a new order and send Telegram notification
 */
router.post('/api/orders', async (req, res) => {
  try {
    const { items, total, customerName, customerPhone, notes } = req.body;

    // Validate required fields
    if (!items || !total || !customerName || !customerPhone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: items, total, customerName, customerPhone'
      });
    }

    // Send Telegram notification
    await TelegramService.sendOrderNotification({
      items,
      total,
      customerName,
      customerPhone,
      notes
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Order received! You will receive a confirmation shortly.',
      orderId: `ORDER-${Date.now()}`
    });
  } catch (error) {
    console.error('Order processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing order. Please try again.',
      error: error.message
    });
  }
});

/**
 * POST /api/reservations
 * Create a reservation and send Telegram notification
 */
router.post('/api/reservations', async (req, res) => {
  try {
    const { customerName, phone, email, guests, date, time, requests } = req.body;

    // Validate required fields
    if (!customerName || !phone || !email || !guests || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Send Telegram notification
    await TelegramService.sendReservationNotification({
      customerName,
      phone,
      email,
      guests,
      date,
      time,
      requests
    });

    res.status(200).json({
      success: true,
      message: 'Reservation request received! We will confirm shortly.',
      reservationId: `RES-${Date.now()}`
    });
  } catch (error) {
    console.error('Reservation processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing reservation. Please try again.',
      error: error.message
    });
  }
});

module.exports = router;
