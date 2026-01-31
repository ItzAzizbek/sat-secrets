const proxyquire = require('proxyquire');

// Mock Data
const mockArticles = [
  { title: "Verification Process", content: "Payment verification details...", tags: ["verification", "payment"] },
  { title: "Anonymity Protocol", content: "We value privacy...", tags: ["anonymity", "privacy"] },
  { title: "Refund Policy", content: "No refunds unless error...", tags: ["refund", "policy"] },
  { title: "Delivery Time", content: "Materials are delivered to your email...", tags: ["delivery", "time"] },
  { title: "Exam Dates", content: "Check dashboard for latest slots...", tags: ["dates", "schedule"] }
];

// Mock Firestore
const mockDb = {
  collection: (name) => ({
    get: async () => {
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 50));
      return {
        empty: mockArticles.length === 0,
        forEach: (callback) => mockArticles.forEach(data => callback({ data: () => data })),
        docs: mockArticles.map(data => ({ data: () => data }))
      };
    },
    doc: (id) => ({
      set: async (data) => {
         // Mock set
         return Promise.resolve();
      }
    })
  })
};

// Load service with mocked db
const knowledgeBaseService = proxyquire('../services/knowledgeBaseService', {
  './firebaseService': { db: mockDb }
});

async function runBenchmark() {
  console.log('Starting Search Benchmark...');

  // Warmup (optional, but good for JIT)
  // await knowledgeBaseService.searchArticles("payment");

  const iterations = 50;
  const start = Date.now();

  for (let i = 0; i < iterations; i++) {
    await knowledgeBaseService.searchArticles("payment verification");
  }

  const end = Date.now();
  const totalTime = end - start;
  const avgTime = totalTime / iterations;

  console.log(`Total time for ${iterations} searches: ${totalTime}ms`);
  console.log(`Average time per search: ${avgTime.toFixed(2)}ms`);
}

runBenchmark();
