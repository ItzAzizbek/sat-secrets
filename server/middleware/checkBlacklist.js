const { db } = require('../services/firebaseService');

const requestCache = new Map();
const BLACKLIST_REDIRECT = process.env.CLIENT_URL
  ? `${process.env.CLIENT_URL.replace(/\/$/, '')}/blacklisted`
  : 'http://localhost:5173/blacklisted';

const checkBlacklist = async (req, res, next) => {
  const ip = req.ip ||
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.connection.remoteAddress;

  // 1. IP blacklist
  if (requestCache.has(ip) && requestCache.get(ip) === 'BANNED') {
    return res.status(403).json({ error: 'Access denied', redirect: BLACKLIST_REDIRECT });
  }

  try {
    const ipSnap = await db.collection('banned_ips').where('ip', '==', ip).limit(1).get();
    if (!ipSnap.empty) {
      requestCache.set(ip, 'BANNED');
      return res.status(403).json({ error: 'Access denied', redirect: BLACKLIST_REDIRECT });
    }
  } catch (error) {
    if (error.code === 7 || error.code === 5 || (error.message && error.message.includes('PERMISSION_DENIED'))) {
      console.warn(`Blacklist Check Skipped: Firestore Error Code ${error.code}`);
    } else {
      console.error('Blacklist Check Error:', error);
    }
    // Fail open for IP check
  }

  // 2. Email blacklist: block banned emails from ALL buying-related APIs (everywhere except /api/admin)
  const userEmail = (req.headers['x-user-email'] || '').trim().toLowerCase();
  if (userEmail && req.path && !req.path.startsWith('/api/admin')) {
    try {
      const emailSnap = await db.collection('banned_emails').where('email', '==', userEmail).limit(1).get();
      if (!emailSnap.empty) {
        return res.status(403).json({
          error: 'Access denied',
          reason: 'This account has been permanently banned from making purchases.',
          redirect: BLACKLIST_REDIRECT
        });
      }
    } catch (error) {
      if (error.code === 7 || error.code === 5 || (error.message && error.message.includes('PERMISSION_DENIED'))) {
        console.warn(`Blacklist Email Check Skipped: Firestore Error Code ${error.code}`);
      } else {
        console.error('Blacklist Email Check Error:', error);
      }
      // Fail open
    }
  }

  next();
};

module.exports = checkBlacklist;
