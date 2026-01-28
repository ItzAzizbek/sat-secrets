const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const multer = require('multer');
const crypto = require('crypto');

// Configure multer with 5MB file size limit
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadFromBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    let cld_upload_stream = cloudinary.uploader.upload_stream(
      { folder: "exam_offers" },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    streamifier.createReadStream(buffer).pipe(cld_upload_stream);
  });
};

const { analyzeScreenshot } = require('../services/aiService');
const { sendNotification } = require('../services/telegramService');
const { db } = require('../services/firebaseService');

const BLACKLIST_REDIRECT = process.env.CLIENT_URL ? `${process.env.CLIENT_URL.replace(/\/$/, '')}/blacklisted` : 'http://localhost:5173/blacklisted';

// POST /api/orders
router.post('/', upload.single('screenshot'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Screenshot is required' });
    }

    const userEmail = (req.body.userEmail || '').trim().toLowerCase();
    const expectedAmount = req.body.expectedAmount !== undefined && req.body.expectedAmount !== '' && req.body.expectedAmount !== 'none'
      ? parseFloat(req.body.expectedAmount)
      : null;

    // Check email blacklist (body is available after multer)
    if (userEmail) {
      try {
        const emailSnap = await db.collection('banned_emails').where('email', '==', userEmail).limit(1).get();
        if (!emailSnap.empty) {
          return res.status(403).json({ error: 'Access denied', reason: 'This account has been blacklisted.', redirect: BLACKLIST_REDIRECT });
        }
      } catch (e) {
        // Fail open on DB error
      }
    }

    console.log('[Orders] Step 1: Starting AI analysis...');
    
    // 1. Analyze with AI (pass expectedAmount for amount matching)
    let aiResult;
    try {
      aiResult = await analyzeScreenshot(req.file.buffer, req.file.mimetype, expectedAmount);
      console.log('[Orders] Step 1 Complete: AI Analysis Result:', aiResult);
    } catch (aiError) {
      console.error('[Orders] Step 1 FAILED - AI Analysis Error:', aiError.message);
      // Fallback to allow manual review
      aiResult = { 
        isReal: true, 
        confidence: 0, 
        reason: 'AI Analysis Unavailable, pending manual review.' 
      };
    }

    // 2. Decide based on AI: ban by email when fake + high confidence
    if (!aiResult.isReal && aiResult.confidence > 0.8) {
      console.log('[Orders] Step 2: High confidence fake detected, banning by email...');
      if (userEmail) {
        try {
          await db.collection('banned_emails').add({
            email: userEmail,
            reason: 'AI detected fake or non-matching payment proof',
            timestamp: new Date().toISOString()
          });
        } catch (e) {
          console.error('[Orders] Failed to add banned_emails:', e.message);
        }
      }
      return res.status(403).json({ 
        error: 'Verification Failed', 
        reason: 'Our automated system detected a fake or non-matching screenshot. You have been blacklisted.',
        details: aiResult.reason,
        redirect: BLACKLIST_REDIRECT
      });
    }

    console.log('[Orders] Step 3: Uploading to Cloudinary...');
    
    // 3. Upload to Cloudinary
    let imageUrl;
    try {
      const cloudinaryResult = await uploadFromBuffer(req.file.buffer);
      imageUrl = cloudinaryResult.secure_url;
      console.log('[Orders] Step 3 Complete: Cloudinary URL:', imageUrl);
    } catch (cloudinaryError) {
      console.error('[Orders] Step 3 FAILED - Cloudinary Error:', cloudinaryError.message);
      return res.status(500).json({ error: 'Failed to upload screenshot. Please try again.' });
    }

    console.log('[Orders] Step 4: Saving to Firestore...');
    
    // 4. Save to Firestore
    // Hash the IP to preserve anonymity (Strategic Directive: Privacy is Absolute)
    const ipHash = crypto.createHash('sha256').update(req.ip || 'unknown').digest('hex');

    const orderData = {
      image_url: imageUrl,
      contact_info: req.body.contactInfo || 'Not Provided',
      user_email: userEmail || null,
      expected_amount: expectedAmount,
      ai_decision: aiResult,
      status: 'PENDING_ADMIN',
      timestamp: new Date().toISOString(),
      user_ip_hash: ipHash // Storing hash instead of raw IP
    };

    let docRef;
    try {
      docRef = await db.collection('orders').add(orderData);
      console.log('[Orders] Step 4 Complete: Order ID:', docRef.id);
    } catch (firestoreError) {
      console.error('[Orders] Step 4 FAILED - Firestore Error:', firestoreError.message);
      return res.status(500).json({ error: 'Failed to save order. Please try again.' });
    }

    console.log('[Orders] Step 5: Sending Telegram notification...');
    
    try {
      const statusIcon = aiResult.isReal ? '✅' : '⚠️';
      
      let statusText = 'AI Suspicious';
      if (aiResult.isReal) {
         statusText = aiResult.confidence === 0.5 ? 'AI Skipped (Manual Review Needed)' : 'AI Approved (Real)';
      }

      const notification = `
<b>New Purchase Received</b> ${statusIcon}

<b>Ticket ID:</b> <code>${docRef.id}</code>
<b>Status:</b> ${statusText}
<b>Confidence:</b> ${(aiResult.confidence * 100).toFixed(1)}%
<b>Contact:</b> ${req.body.contactInfo || 'N/A'}

<b>AI Analysis:</b>
<i>${aiResult.reason || 'No analysis details provided.'}</i>

<a href="${imageUrl}">View Screenshot</a>
      `;
      await sendNotification(notification);
      console.log('[Orders] Step 5 Complete: Telegram notification sent');
    } catch (telegramError) {
      console.error('[Orders] Step 5 WARNING - Telegram Error:', telegramError.message);
      // Don't fail the request just because Telegram notification failed
    }

    console.log('[Orders] All steps complete, sending success response');
    res.status(200).json({ 
      message: 'Order received', 
      orderId: docRef.id,
      aiDecision: aiResult 
    });
  } catch (error) {
    console.error('[Orders] UNEXPECTED ERROR:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
