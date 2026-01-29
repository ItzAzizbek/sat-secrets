const express = require('express');
const router = express.Router();

const { db } = require('../services/firebaseService');
const { getAllTickets, addAdminReply } = require('../services/ticketService');
const { getAllArticles, addArticle, deleteArticle } = require('../services/knowledgeBaseService');

// Middleware to check admin auth (Basic implementation based on email in body or header? 
// For now, let's assume client sends an 'admin-secret' header or similar simple protection as requested by .env approach)
const isAdmin = (req, res, next) => {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(email => email.trim().toLowerCase());
  const userEmail = (req.headers['x-user-email'] || '').trim().toLowerCase();
  
  if (userEmail && adminEmails.includes(userEmail)) {
    next();
  } else {
    // Check for admin-secret as a fallback or for development
    const adminSecret = req.headers['x-admin-secret'];
    if (adminSecret && adminSecret === process.env.ADMIN_SECRET) {
      return next();
    }
    res.status(403).json({ error: 'Admin access denied' });
  }
};

// GET /api/admin/requests
router.get('/requests', async (req, res) => {
  try {
    const snapshot = await db.collection('orders').orderBy('timestamp', 'desc').get();
    const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/decision
router.post('/decision', async (req, res) => {
  try {
    const { orderId, decision } = req.body; // decision: 'REAL' or 'FAKE'
    
    await db.collection('orders').doc(orderId).update({
      status: decision,
      admin_decision_time: new Date().toISOString()
    });

    if (decision === 'FAKE') {
      const order = await db.collection('orders').doc(orderId).get();
      const data = order.data() || {};
      const ip = data.user_ip;
      const userEmail = (data.user_email || '').trim().toLowerCase();
      if (ip) {
        await db.collection('banned_ips').add({ ip, reason: 'Manual Admin Ban', timestamp: new Date().toISOString() });
      }
      if (userEmail) {
        await db.collection('banned_emails').add({
          email: userEmail,
          reason: 'Manual Admin Ban',
          timestamp: new Date().toISOString()
        });
      }
    }

    res.status(200).json({ message: 'Decision recorded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/tickets
router.get('/tickets', async (req, res) => {
  try {
    const tickets = await getAllTickets();
    res.status(200).json({ tickets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/tickets/:id/reply
router.post('/tickets/:id/reply', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    await addAdminReply(req.params.id, message);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/kb
router.get('/kb', async (req, res) => {
  try {
    const articles = await getAllArticles();
    res.status(200).json({ articles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/kb
router.post('/kb', async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    if (!title || !content) return res.status(400).json({ error: "Title and Content required" });

    await addArticle(title, content, tags || []);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/kb/:id
router.delete('/kb/:id', async (req, res) => {
  try {
    await deleteArticle(req.params.id);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
