const proxyquire = require('proxyquire');
const sinon = require('sinon');
const express = require('express');
const assert = require('assert');
const http = require('http');

// Mocks
const mockDb = {
  collection: sinon.stub()
};

// Mock for banned_emails failure: simulate throw on .get()
const mockBannedEmails = {
  where: sinon.stub().returnsThis(),
  limit: sinon.stub().returnsThis(),
  get: sinon.stub().rejects(new Error('DB Connection Failed'))
};

// Mock for orders success
const mockOrders = {
  add: sinon.stub().resolves({ id: 'test-order-id' })
};

// Configure db.collection mock behavior
mockDb.collection.callsFake((name) => {
  if (name === 'banned_emails') return mockBannedEmails;
  if (name === 'orders') return mockOrders;
  // Default fallback for any other collection calls
  return {
    add: sinon.stub().resolves({}),
    where: sinon.stub().returnsThis(),
    limit: sinon.stub().returnsThis(),
    get: sinon.stub().resolves({ empty: true })
  };
});

const mockAiService = {
  analyzeScreenshot: sinon.stub().resolves({
    isReal: true,
    confidence: 0.9,
    reason: 'Mock AI'
  })
};

const mockTelegramService = {
  sendNotification: sinon.stub().resolves()
};

const mockCloudinary = {
  config: sinon.stub(),
  uploader: {
    upload_stream: (options, cb) => {
      // Simulate async upload
      setImmediate(() => {
        cb(null, { secure_url: 'http://example.com/image.png' });
      });
      return { write: () => {}, end: () => {}, on: () => {}, pipe: () => {} };
    }
  }
};

const mockStreamifier = {
  createReadStream: () => ({ pipe: (dest) => {} })
};

// Mock multer
// Must be a function because it's called as `multer({...})`
const mockMulter = () => {
  const middleware = (req, res, next) => {
    req.file = {
      buffer: Buffer.from('fake'),
      mimetype: 'image/png'
    };
    next();
  };
  return {
    single: () => middleware
  };
};
mockMulter.memoryStorage = () => {};

// Load router with mocks
// We use proxyquire to substitute dependencies
const ordersRouter = proxyquire('../routes/orders', {
  '../services/firebaseService': { db: mockDb },
  '../services/aiService': mockAiService,
  '../services/telegramService': mockTelegramService,
  'cloudinary': { v2: mockCloudinary },
  'streamifier': mockStreamifier,
  'multer': mockMulter
});

// Setup app
const app = express();
app.use(express.json()); // parses JSON body
app.use('/orders', ordersRouter);

// Spy on console.error
const consoleSpy = sinon.spy(console, 'error');

// Start test server
const server = app.listen(0, () => {
  const port = server.address().port;
  console.log(`Test server running on port ${port}`);

  const postData = JSON.stringify({
    userEmail: 'test@example.com',
    expectedAmount: '100'
  });

  const options = {
    hostname: 'localhost',
    port: port,
    path: '/orders',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log(`Response Status: ${res.statusCode}`);
      // console.log(`Response Body: ${data}`);

      let success = true;

      try {
        // 1. Assert Fail Open behavior (Status 200)
        assert.strictEqual(res.statusCode, 200, 'Should return 200 OK (Fail Open)');
        console.log('✅ Status Code: 200 OK');

        // 2. Assert Error Logging
        // We expect "Blacklist check failed, failing open"
        const loggedError = consoleSpy.getCalls().find(call =>
          call.args.join(' ').includes('Blacklist check failed, failing open')
        );

        if (loggedError) {
          console.log('✅ Error logged correctly');
        } else {
          console.error('❌ Error NOT logged correctly');
          success = false;
        }

        // 3. Assert Warning Flag in DB
        if (mockOrders.add.called) {
          const savedData = mockOrders.add.firstCall.args[0];
          // Check for verification_warnings
          if (savedData.verification_warnings &&
              savedData.verification_warnings.some(w => w.includes('Blacklist check failed'))) {
            console.log('✅ Verification warning saved to DB');
          } else {
            console.error('❌ Verification warning NOT saved to DB');
            console.log('Saved Data:', savedData);
            success = false;
          }
        } else {
          console.error('❌ Order NOT saved to DB');
          success = false;
        }

      } catch (e) {
        console.error('❌ Assertion Failed:', e.message);
        success = false;
      }

      server.close();
      process.exit(success ? 0 : 1);
    });
  });

  req.on('error', (e) => {
    console.error('Request Error:', e);
    server.close();
    process.exit(1);
  });

  req.write(postData);
  req.end();
});
