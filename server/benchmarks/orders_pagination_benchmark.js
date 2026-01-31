const sinon = require('sinon');
const proxyquire = require('proxyquire');

// Mock data generator
const generateOrders = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `order_${i}`,
    data: () => ({
      timestamp: new Date().toISOString(),
      status: 'PENDING',
      contact_info: `user${i}@example.com`,
      image_url: `https://example.com/image_${i}.jpg`,
      ai_decision: { isReal: true, confidence: 0.9, reason: 'Looks good' }
    })
  }));
};

async function runBenchmark() {
  const paginatedDataset = generateOrders(20);

  // Mock Firestore
  const getStub = sinon.stub().resolves({ docs: paginatedDataset });
  const startAfterStub = sinon.stub().returnsThis();
  const limitStub = sinon.stub().returnsThis();
  const orderByStub = sinon.stub().returnsThis();
  const collectionStub = sinon.stub();

  // Setup query chain support
  const queryChain = {
      orderBy: orderByStub,
      limit: limitStub,
      startAfter: startAfterStub,
      get: getStub
  };

  // Need to ensure returnsThis() returns the queryChain object
  orderByStub.returns(queryChain);
  limitStub.returns(queryChain);
  startAfterStub.returns(queryChain);

  const dbMock = {
    collection: collectionStub
  };
  collectionStub.withArgs('orders').returns(queryChain);

  // Load the route module with mocked db
  const adminRouter = proxyquire('../routes/admin.js', {
    '../services/firebaseService': { db: dbMock, auth: {} }
  });

  // Find the handler for GET /requests
  const layer = adminRouter.stack.find(l => l.route && l.route.path === '/requests' && l.route.methods.get);
  if (!layer) {
    console.error("Could not find GET /requests handler");
    process.exit(1);
  }
  const handler = layer.route.stack[0].handle;

  // Test 1: Initial Page Load (No Params)
  const req1 = { query: {} };
  const res1 = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub()
  };

  console.log("Testing Initial Page Load...");
  const start1 = process.hrtime();
  await handler(req1, res1);
  const end1 = process.hrtime(start1);
  const time1 = (end1[0] * 1000 + end1[1] / 1e6).toFixed(2);

  // Verify limit called with 20
  if (!limitStub.calledWith(20)) {
     console.error("FAILED: limit(20) not called");
  } else {
     console.log("SUCCESS: limit(20) called");
  }

  const response1 = res1.json.firstCall.args[0];
  console.log(`Initial Load Time: ${time1} ms`);
  console.log(`Response contains ${response1.requests.length} items`);
  console.log(`Next Cursor:`, response1.nextCursor);


  // Test 2: Next Page Load (With Cursor)
  const lastDoc = response1.requests[19];
  const req2 = {
      query: {
          limit: 20,
          lastTimestamp: lastDoc.timestamp,
          lastId: lastDoc.id
      }
  };
  const res2 = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub()
  };

  console.log("\nTesting Next Page Load...");
  const start2 = process.hrtime();
  await handler(req2, res2);
  const end2 = process.hrtime(start2);
  const time2 = (end2[0] * 1000 + end2[1] / 1e6).toFixed(2);

  // Verify startAfter called
  if (!startAfterStub.calledWith(lastDoc.timestamp, lastDoc.id)) {
      console.error("FAILED: startAfter not called with correct params");
      console.error("Expected:", lastDoc.timestamp, lastDoc.id);
      console.error("Actual calls:", startAfterStub.args);
  } else {
      console.log("SUCCESS: startAfter called correctly");
  }

  console.log(`Next Page Load Time: ${time2} ms`);

  // Check response size
  const size1 = JSON.stringify(response1).length;
  console.log(`Response Size: ${(size1 / 1024).toFixed(2)} KB (vs ~225KB baseline)`);
}

runBenchmark().catch(console.error);
