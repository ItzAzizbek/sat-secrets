const fs = require('fs');
const LRU = require('lru-cache');

const requestCache = new LRU({
  max: 5000,
  maxAge: 1000 * 60 * 60 // 1 hour
});

function generateIP(i) {
  return `${(i >> 24) & 255}.${(i >> 16) & 255}.${(i >> 8) & 255}.${i & 255}`;
}

console.log('Starting LRU Cache Benchmark...');
console.log('Items,HeapUsed(MB)');

const LIMIT = 500000;
const LOG_INTERVAL = 50000;

const startHeap = process.memoryUsage().heapUsed;

for (let i = 0; i < LIMIT; i++) {
  const ip = generateIP(i);
  requestCache.set(ip, 'BANNED');

  if (i % LOG_INTERVAL === 0 || i === LIMIT - 1) {
    if (global.gc) global.gc();
    const currentHeap = process.memoryUsage().heapUsed;
    const diffMB = (currentHeap - startHeap) / 1024 / 1024;
    console.log(`${i},${diffMB.toFixed(2)}`);
  }
}

console.log('Finished.');
