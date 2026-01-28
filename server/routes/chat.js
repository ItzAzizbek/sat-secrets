const express = require('express');
const router = express.Router();
const { getChatResponse } = require('../services/chatService');

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const aiResponse = await getChatResponse(history || [], message);
    res.status(200).json({ response: aiResponse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
