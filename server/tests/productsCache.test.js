const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

// Mocks
const mockGet = sinon.stub();
const mockOrderBy = sinon.stub().returns({ get: mockGet });
const mockCollection = sinon.stub();

const mockDb = {
  collection: mockCollection
};

// Setup mock behavior
mockCollection.withArgs('products').returns({
  orderBy: mockOrderBy,
  get: mockGet
});

// Load the router with mocked DB
const productsRouter = proxyquire('../routes/products', {
  '../services/firebaseService': { db: mockDb }
});

// Find the handler for GET /
const layer = productsRouter.stack.find(l => l.route && l.route.path === '/' && l.route.methods.get);
if (!layer) {
    console.error('Could not find GET / handler');
    process.exit(1);
}
const handler = layer.route.stack[0].handle;

async function runTests() {
  console.log('Running productsCache tests...');

  const mockData = { docs: [{ id: '1', data: () => ({ exam: 'SAT', dates: [] }) }] };

  // Test 1: First request -> Cache Miss -> DB Call
  {
    mockGet.resetHistory();
    mockCollection.resetHistory();
    mockGet.resolves(mockData);

    const req = {};
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };

    await handler(req, res);

    assert(mockCollection.calledWith('products'), 'Should access products collection');
    assert(mockGet.called, 'Should call get() on DB');

    // Check response structure
    const responseArg = res.json.firstCall.args[0];
    assert.deepStrictEqual(responseArg.products, [{ id: '1', exam: 'SAT', dates: [] }]);

    console.log('✔ Test 1 passed: Cache Miss -> DB Hit');
  }

  // Test 2: Second request -> Cache Hit -> No DB Call
  {
    mockGet.resetHistory();
    mockCollection.resetHistory();
    // Even if we resolve, it shouldn't be called
    mockGet.resolves(mockData);

    const req = {};
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };

    await handler(req, res);

    assert(mockCollection.notCalled, 'Should NOT access products collection');
    assert(mockGet.notCalled, 'Should NOT call get() on DB');

    // Check response structure
    const responseArg = res.json.firstCall.args[0];
    assert.deepStrictEqual(responseArg.products, [{ id: '1', exam: 'SAT', dates: [] }]);

    console.log('✔ Test 2 passed: Cache Hit -> No DB Hit');
  }

  console.log('All tests passed.');
}

runTests().catch(err => {
  console.error('Tests failed:', err);
  process.exit(1);
});
