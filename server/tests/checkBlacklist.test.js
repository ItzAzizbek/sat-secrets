const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

// Mocks
const mockGet = sinon.stub();
const mockLimit = sinon.stub().returns({ get: mockGet });
const mockWhere = sinon.stub().returns({ limit: mockLimit });
const mockCollection = sinon.stub().returns({ where: mockWhere });

const mockDb = {
  collection: mockCollection
};

// Reset function
function resetMocks() {
  mockGet.resetHistory();
  mockLimit.resetHistory();
  mockWhere.resetHistory();
  mockCollection.resetHistory();
  mockGet.resetBehavior();
}

// Load middleware with mocks
const checkBlacklist = proxyquire('../middleware/checkBlacklist', {
  '../services/firebaseService': { db: mockDb }
});

async function runTests() {
  console.log('Running checkBlacklist tests...');

  // Test 1: Banned IP (first hit) -> Access DB -> Cache -> 403
  {
    resetMocks();
    mockGet.resolves({ empty: false }); // IP found in ban list

    const req = {
      ip: '1.2.3.4',
      headers: {},
      connection: {},
      path: '/'
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    const next = sinon.stub();

    await checkBlacklist(req, res, next);

    assert(mockCollection.calledWith('banned_ips'), 'Should check banned_ips collection');
    assert(mockWhere.calledWith('ip', '==', '1.2.3.4'), 'Should query specific IP');
    assert(res.status.calledWith(403), 'Should return 403');
    assert(next.notCalled, 'Should not call next()');
    console.log('✔ Test 1 passed: Banned IP rejected (DB hit)');
  }

  // Test 2: Banned IP (second hit) -> Cache hit -> No DB -> 403
  {
    resetMocks();
    // mockGet should NOT be called if cache works
    mockGet.resolves({ empty: false });

    const req = {
      ip: '1.2.3.4',
      headers: {},
      connection: {},
      path: '/'
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    const next = sinon.stub();

    await checkBlacklist(req, res, next);

    assert(mockCollection.notCalled, 'Should NOT check DB (cache hit)');
    assert(res.status.calledWith(403), 'Should return 403');
    assert(next.notCalled, 'Should not call next()');
    console.log('✔ Test 2 passed: Banned IP rejected (Cache hit)');
  }

  // Test 3: Safe IP -> Access DB -> Not Banned -> next()
  {
    resetMocks();
    mockGet.resolves({ empty: true }); // IP not found

    const req = {
      ip: '5.6.7.8',
      headers: {},
      connection: {},
      path: '/'
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    const next = sinon.stub();

    await checkBlacklist(req, res, next);

    assert(mockCollection.calledWith('banned_ips'), 'Should check banned_ips collection');
    assert(next.called, 'Should call next()');
    console.log('✔ Test 3 passed: Safe IP allowed');
  }

  // Test 4: Safe IP again -> No Cache for safe IPs -> Access DB
  // The current logic only caches "BANNED". Safe IPs are re-checked.
  {
    resetMocks();
    mockGet.resolves({ empty: true });

    const req = {
      ip: '5.6.7.8',
      headers: {},
      connection: {},
      path: '/'
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    const next = sinon.stub();

    await checkBlacklist(req, res, next);

    assert(mockCollection.called, 'Should check DB again for safe IP');
    assert(next.called, 'Should call next()');
    console.log('✔ Test 4 passed: Safe IP re-checked (only BANNED are cached)');
  }

  console.log('All tests passed.');
}

runTests().catch(err => {
  console.error('Tests failed:', err);
  process.exit(1);
});
