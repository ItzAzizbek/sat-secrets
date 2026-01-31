const express = require('express');
const router = express.Router();

const { db } = require('../services/firebaseService');

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
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const lastTimestamp = req.query.lastTimestamp;
    const lastId = req.query.lastId;

    let query = db.collection('orders')
      .orderBy('timestamp', 'desc')
      .orderBy('__name__', 'desc')
      .limit(limit);

    if (lastTimestamp && lastId) {
      query = query.startAfter(lastTimestamp, lastId);
    }

    const snapshot = await query.get();
    const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    let nextCursor = null;
    if (requests.length === limit) {
      const lastDoc = requests[requests.length - 1];
      nextCursor = {
        timestamp: lastDoc.timestamp,
        id: lastDoc.id
      };
    }

    res.status(200).json({ requests, nextCursor });
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

module.exports = router;
