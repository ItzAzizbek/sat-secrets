const express = require('express');
const router = express.Router();
// const { processContactForm } = require('../controllers/contactController'); // Optional controller separation

const { summarizeMessage } = require('../services/aiService');

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { name, message } = req.body;
    if (!name || !message) {
      return res.status(400).json({ error: 'Name and message are required' });
    }

    const aiResult = await summarizeMessage(name, message);

    if (aiResult.status === 'REJECT') {
       // Ideally we might just silently ignore or send a rejection email
       return res.status(200).json({ status: 'REJECT', message: 'Message filtered by AI System.' });
    }

    // 2. Save to Firestore
    const { db } = require('../services/firebaseService'); // Ensure db is exported
    await db.collection('contacts').add({
      name,
      message,
      ai_status: aiResult.status,
      ai_summary: aiResult.summary,
      timestamp: new Date().toISOString()
    });

    // 3. Send Telegram Notification
    const { sendNotification } = require('../services/telegramService');
    const notification = `
New Contact Message:
Name: ${name}
Status: ${aiResult.status}
Summary: ${aiResult.summary}
Offered Price: ${aiResult.offered_price || 'N/A'}
Message: ${message}
    `;
    await sendNotification(notification);
    
    res.status(200).json({ status: 'OK', data: aiResult });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
