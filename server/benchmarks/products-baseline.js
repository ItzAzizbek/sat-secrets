const proxyquire = require('proxyquire');
const assert = require('assert');

const DELAY_MS = 200; // Simulated DB latency

// Mock Data
const mockDocs = Array.from({ length: 10 }, (_, i) => ({
    id: `doc_${i}`,
    data: () => ({ exam: `Exam ${i}`, dates: [] })
}));

const mockSnapshot = {
    docs: mockDocs
};

// Mock DB
const mockGet = async () => {
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    return mockSnapshot;
};

const mockOrderBy = () => ({
    get: mockGet
});

const mockDb = {
    collection: (name) => {
        if (name === 'products') {
            return {
                orderBy: mockOrderBy,
                get: mockGet
            };
        }
        return {};
    }
};

// Load the router with mocked DB
const productsRouter = proxyquire('../routes/products', {
    '../services/firebaseService': { db: mockDb }
});

// Find the handler for GET /
// Inspect stack to find the correct layer
const layer = productsRouter.stack.find(l => l.route && l.route.path === '/' && l.route.methods.get);

if (!layer) {
    console.error('Could not find GET / handler');
    process.exit(1);
}

const handler = layer.route.stack[0].handle;

async function runBenchmark() {
    console.log('Starting Benchmark...');
    console.log(`Simulated DB Delay: ${DELAY_MS}ms`);

    const iterations = 10;
    const start = process.hrtime();

    for (let i = 0; i < iterations; i++) {
        await new Promise((resolve, reject) => {
            const req = {};
            const res = {
                status: (code) => res, // chainable
                json: (data) => resolve(data)
            };
            try {
                handler(req, res);
            } catch (err) {
                reject(err);
            }
        });
        process.stdout.write('.');
    }
    console.log();

    const [seconds, nanoseconds] = process.hrtime(start);
    const totalTimeMs = seconds * 1000 + nanoseconds / 1e6;
    console.log(`Total time for ${iterations} requests: ${totalTimeMs.toFixed(2)}ms`);
    console.log(`Average time per request: ${(totalTimeMs / iterations).toFixed(2)}ms`);
}

runBenchmark().catch(err => console.error(err));
