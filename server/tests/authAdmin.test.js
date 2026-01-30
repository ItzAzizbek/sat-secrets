const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

// Mocks
const verifyIdTokenStub = sinon.stub();
const authStub = {
  verifyIdToken: verifyIdTokenStub
};

// Mock firebaseService
const firebaseServiceMock = {
  auth: authStub,
  db: {} // not used but good to have
};

const authAdmin = proxyquire('../middleware/authAdmin', {
  '../services/firebaseService': firebaseServiceMock
});

async function runTests() {
  console.log('Running authAdmin tests...');

  // Setup Environment
  process.env.ADMIN_SECRET = 'supersecret';
  process.env.ADMIN_EMAILS = 'admin@example.com,root@example.com';

  // Helper to create mock Req/Res
  const createMocks = (headers = {}) => {
    const req = { headers };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    const next = sinon.stub();
    return { req, res, next };
  };

  // Test 1: Valid Secret -> Next
  {
    const { req, res, next } = createMocks({ 'x-admin-secret': 'supersecret' });
    await authAdmin(req, res, next);
    assert(next.called, 'Should call next() with valid secret');
    assert(res.status.notCalled, 'Should not return error');
    console.log('✔ Test 1 Passed: Valid Secret');
  }

  // Test 2: Invalid Secret, No Token -> 401
  {
    const { req, res, next } = createMocks({ 'x-admin-secret': 'wrong' });
    await authAdmin(req, res, next);
    assert(next.notCalled, 'Should not call next()');
    assert(res.status.calledWith(401), 'Should return 401');
    assert(res.json.calledWithMatch({ error: 'Admin access denied' }), 'Should return access denied message');
    console.log('✔ Test 2 Passed: Invalid Secret');
  }

  // Test 3: Valid Token + Admin Email -> Next
  {
    verifyIdTokenStub.resolves({ email: 'admin@example.com', uid: '123' });
    const { req, res, next } = createMocks({ 'authorization': 'Bearer valid_token' });

    await authAdmin(req, res, next);

    assert(verifyIdTokenStub.calledWith('valid_token'), 'Should verify token');
    assert(next.called, 'Should call next()');
    assert.deepStrictEqual(req.user, { email: 'admin@example.com', uid: '123' }, 'Should attach user to req');
    console.log('✔ Test 3 Passed: Valid Token & Admin Email');
  }

  // Test 4: Valid Token + Non-Admin Email -> 403
  {
    verifyIdTokenStub.resolves({ email: 'user@example.com', uid: '456' });
    const { req, res, next } = createMocks({ 'authorization': 'Bearer valid_token_user' });

    await authAdmin(req, res, next);

    assert(res.status.calledWith(403), 'Should return 403');
    assert(next.notCalled, 'Should not call next()');
    console.log('✔ Test 4 Passed: Valid Token & Non-Admin Email');
  }

  // Test 5: Invalid Token -> 401
  {
    verifyIdTokenStub.rejects(new Error('Invalid token'));
    const { req, res, next } = createMocks({ 'authorization': 'Bearer invalid_token' });

    await authAdmin(req, res, next);

    assert(res.status.calledWith(401), 'Should return 401');
    console.log('✔ Test 5 Passed: Invalid Token');
  }

  console.log('All tests passed.');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
