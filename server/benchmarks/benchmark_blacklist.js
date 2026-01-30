const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const assert = require('assert');

// Setup Mocks
const getStub = sinon.stub();
const limitStub = sinon.stub().returns({ get: getStub });
const whereStub = sinon.stub().returns({ limit: limitStub });
const collectionStub = sinon.stub().returns({ where: whereStub });
const dbMock = { collection: collectionStub };

// Load the module with mocked dependencies
// We need to make sure LRU cache is fresh for each test run if possible,
// or we just instantiate it once and manage keys.
// Since 'checkBlacklist.js' instantiates the cache at the top level,
// we need to re-require it to reset the cache, or just use different IPs.
function loadMiddleware() {
  return proxyquire('../middleware/checkBlacklist', {
    '../services/firebaseService': { db: dbMock }
  });
}

async function runBenchmark() {
  console.log('--- Benchmarking checkBlacklist ---');

  // --- Scenario 1: Safe IP (Performance Check) ---
  console.log('\nScenario 1: Safe IP (1000 requests)');

  // Reload middleware to get a fresh cache
  let checkBlacklist = loadMiddleware();

  // Reset mocks
  getStub.resetHistory();
  // Safe IP -> empty result
  getStub.resolves({ empty: true });

  const reqSafe = {
    ip: '192.168.1.100',
    headers: {},
    connection: { remoteAddress: '192.168.1.100' },
    path: '/api/test'
  };
  const res = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub()
  };
  const next = sinon.stub();

  const startSafe = process.hrtime();
  for (let i = 0; i < 1000; i++) {
    await checkBlacklist(reqSafe, res, next);
  }
  const endSafe = process.hrtime(startSafe);
  const timeSafe = (endSafe[0] * 1000 + endSafe[1] / 1e6).toFixed(2);

  console.log(`Execution time: ${timeSafe} ms`);
  console.log(`Firestore DB calls: ${getStub.callCount}`);

  // Verification for Safe IP
  if (next.callCount !== 1000) {
      console.error('ERROR: next() should have been called 1000 times for safe IP');
  } else {
      console.log('Verification: Passed (next() called correctly)');
  }


  // --- Scenario 2: Banned IP (Correctness Check) ---
  console.log('\nScenario 2: Banned IP (10 requests)');

  // Use a new IP
  const reqBanned = {
    ip: '10.0.0.666',
    headers: {},
    connection: { remoteAddress: '10.0.0.666' },
    path: '/api/test'
  };

  // Reset mocks
  getStub.resetHistory();
  next.resetHistory();
  res.status.resetHistory();
  res.json.resetHistory();

  // Banned IP -> not empty result
  getStub.resolves({ empty: false });

  for (let i = 0; i < 10; i++) {
    await checkBlacklist(reqBanned, res, next);
  }

  console.log(`Firestore DB calls: ${getStub.callCount}`);

  // Verification for Banned IP
  if (next.called) {
      console.error('ERROR: next() should NOT be called for banned IP');
  } else if (res.status.callCount === 10 && res.status.alwaysCalledWith(403)) {
      console.log('Verification: Passed (403 Access Denied returned)');
  } else {
      console.error('ERROR: Incorrect response for banned IP');
  }
}

runBenchmark().catch(err => console.error(err));
