# 📱 Telegram Integration Setup Guide for SandSly

This guide will help you set up Telegram notifications for orders and reservations.

## 🚀 Quick Start

### Step 1: Create a Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Start the chat and send: `/newbot`
3. Follow the prompts:
   - Choose a name for your bot (e.g., "SandSly Order Bot")
   - Choose a username (e.g., "sandsly_order_bot")
4. **Save your BOT TOKEN** - you'll need this!

### Step 2: Get Your Chat ID

1. Search for **@userinfobot** on Telegram
2. Start the chat - it will show your User ID (this is your CHAT_ID)
3. **Save your CHAT_ID**

### Step 3: Set Up the Backend

#### Option A: Using Node.js/Express (Recommended)

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `backend` folder:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_CHAT_ID=your_chat_id_here
   PORT=5000
   NODE_ENV=development
   ```

4. Start the server:
   ```bash
   npm start
   ```
   or for development:
   ```bash
   npm run dev
   ```

5. Verify the server is running:
   ```
   http://localhost:5000/api/health
   ```

#### Option B: Using Firebase Functions (Cloud-based)

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Create a Firebase project and initialize:
   ```bash
   firebase init functions
   ```

3. Use the provided `telegramService.js` in your Firebase function

4. Deploy:
   ```bash
   firebase deploy --only functions
   ```

### Step 4: Update Frontend Code

Edit `js/telegram-integration.js` and update the `API_URL`:

```javascript
const TelegramIntegration = {
  API_URL: 'http://your-backend-url:5000',  // Change this to your backend URL
  // ...
};
```

### Step 5: Integrate with Checkout

Update `js/main.js` - modify the checkout button handler:

```javascript
// Checkout button logic
document.getElementById('checkoutBtn').addEventListener('click', async function() {
  var btn = this;
  var originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  btn.disabled = true;
  
  // Get customer info (you may need to add a form for this)
  const customerName = prompt('Enter your name:');
  const customerPhone = prompt('Enter your phone number:');
  
  if (!customerName || !customerPhone) {
    btn.innerHTML = originalText;
    btn.disabled = false;
    return;
  }
  
  // Send to Telegram via backend
  const success = await TelegramIntegration.sendOrder(
    cartItems,
    parseFloat(document.getElementById('cartTotalDisplay').textContent.replace(/[^0-9.]/g, '')),
    {
      name: customerName,
      phone: customerPhone,
      notes: ''
    }
  );
  
  if (success) {
    setTimeout(function() {
      cartItems = [];
      updateCartDisplay();
      btn.innerHTML = '<i class="fas fa-check"></i> Order Placed!';
      btn.style.background = 'var(--green)';
      
      setTimeout(function() {
        closeCartPop();
        btn.innerHTML = originalText;
        btn.style.background = 'var(--primary)';
        btn.disabled = false;
      }, 2000);
    }, 1500);
  } else {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});
```

### Step 6: Integrate Reservations

Update the reservation form to use Telegram:

```javascript
document.getElementById('resBtn').addEventListener('click', async function() {
  var btn = this;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Booking...';
  btn.disabled = true;
  
  // Get form data (add IDs to form inputs)
  const reservationData = {
    customerName: document.getElementById('resName')?.value,
    phone: document.getElementById('resPhone')?.value,
    email: document.getElementById('resEmail')?.value,
    guests: document.getElementById('resGuests')?.value,
    date: document.getElementById('resDate')?.value,
    time: document.getElementById('resTime')?.value,
    requests: document.getElementById('resRequests')?.value
  };
  
  const success = await TelegramIntegration.sendReservation(reservationData);
  
  if (success) {
    btn.innerHTML = '<i class="fas fa-calendar-check"></i> Confirm Reservation';
    btn.disabled = false;
    var ok = document.getElementById('resOk');
    ok.style.display = 'block';
    ok.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else {
    btn.innerHTML = '<i class="fas fa-calendar-check"></i> Confirm Reservation';
    btn.disabled = false;
  }
});
```

## 🧪 Testing

1. **Test Backend:**
   ```bash
   curl -X POST http://localhost:5000/api/orders \
     -H "Content-Type: application/json" \
     -d '{
       "items": [{"title": "Pizza", "qty": 1, "price": 50}],
       "total": 50,
       "customerName": "John Doe",
       "customerPhone": "+233123456789",
       "notes": "Test order"
     }'
   ```

2. **Check Telegram:** You should receive a message in your Telegram chat!

## 🔧 Troubleshooting

### Bot not sending messages?
- ✅ Verify BOT_TOKEN is correct
- ✅ Verify CHAT_ID is correct (should be a number)
- ✅ Make sure bot is started (@BotFather → /mybots → select your bot)

### CORS errors?
- Add CORS headers in backend (already included in server.js)
- For production, update CORS to allow your domain:
  ```javascript
  app.use(cors({
    origin: 'https://your-domain.com'
  }));
  ```

### Connection refused?
- Ensure backend is running on correct port
- Check firewall settings
- Verify API_URL in frontend matches backend URL

## 📲 File Structure

```
project/
├── backend/
│   ├── config/
│   │   └── telegram.js          # Telegram config
│   ├── services/
│   │   └── telegramService.js   # Telegram API calls
│   ├── routes/
│   │   └── orders.js            # Order/Reservation endpoints
│   ├── server.js                # Express server
│   ├── package.json             # Dependencies
│   └── .env.example             # Environment template
├── js/
│   └── telegram-integration.js  # Frontend integration
└── README_TELEGRAM_SETUP.md     # This file
```

## 🚀 Deployment

### Deploying to Heroku

1. Create Heroku account at https://www.heroku.com
2. Install Heroku CLI
3. Login:
   ```bash
   heroku login
   ```

4. Create app:
   ```bash
   heroku create your-app-name
   ```

5. Set environment variables:
   ```bash
   heroku config:set TELEGRAM_BOT_TOKEN=your_token
   heroku config:set TELEGRAM_CHAT_ID=your_chat_id
   ```

6. Deploy:
   ```bash
   git push heroku main
   ```

7. View logs:
   ```bash
   heroku logs --tail
   ```

## ✨ Features

✅ Order notifications to Telegram
✅ Reservation notifications to Telegram
✅ Formatted messages with order details
✅ Error handling and logging
✅ CORS enabled for frontend
✅ Environment configuration

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review backend logs
3. Verify Telegram bot is working (@BotFather)
4. Check network connectivity

---

**Happy ordering! 🍕** 🍔 🍷
