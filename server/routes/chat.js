const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getChatResponse } = require('../services/chatService');
const { getOrCreateTicket, logInteraction, getTicketBySessionId } = require('../services/ticketService');

// GET /api/chat/history
router.get('/history', async (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ error: "Session ID required" });

    const ticket = await getTicketBySessionId(sessionId);
    if (!ticket) return res.status(200).json({ history: [] });

    // Map interactions to chat format
    const history = ticket.interactions.map(i => ({
      role: i.role,
      text: i.text,
      timestamp: i.timestamp
    }));

    res.status(200).json({ history });
  } catch (error) {
    console.error('[ChatRoute] History Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { message, history, userEmail } = req.body;
    // Use provided sessionId or generate a new one
    const sessionId = req.body.sessionId || crypto.randomUUID();

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // 1. Get or Create Ticket for this session
    const ticket = await getOrCreateTicket(sessionId, userEmail);

    // 2. Log User Message
    await logInteraction(ticket.id, 'user', message);

    // 3. Get AI Response (passes ticketId for intelligence analysis)
    const aiResponse = await getChatResponse(history || [], message, ticket.id);

    // 4. Log AI Response
    await logInteraction(ticket.id, 'model', aiResponse);

    // Return response + sessionId so client can persist it
    res.status(200).json({
      response: aiResponse,
      sessionId: sessionId,
      ticketId: ticket.id
    });
  } catch (error) {
    console.error('[ChatRoute] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
