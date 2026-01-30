const express = require('express');
const router = express.Router();

const { db } = require('../services/firebaseService');
const authAdmin = require('../middleware/authAdmin');

// Apply admin authentication to all routes
router.use(authAdmin);

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

module.exports = router;
