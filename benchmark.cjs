const { performance } = require('perf_hooks');

const simulateNetworkDelay = () => new Promise(resolve => setTimeout(resolve, 100));

async function runSequential(n) {
  const start = performance.now();
  for (let i = 0; i < n; i++) {
    await simulateNetworkDelay();
  }
  return performance.now() - start;
}

async function runConcurrent(n) {
  const start = performance.now();
  const promises = [];
  for (let i = 0; i < n; i++) {
    promises.push(simulateNetworkDelay());
  }
  await Promise.all(promises);
  return performance.now() - start;
}

async function runBatch(n) {
  const start = performance.now();
  // Simulate a single batch network request
  await simulateNetworkDelay();
  return performance.now() - start;
}

async function main() {
  const n = 5;
  console.log(`Simulating ${n} updates (assume 100ms latency per request)...`);
  const seqTime = await runSequential(n);
  const concTime = await runConcurrent(n);
  const batchTime = await runBatch(n);
  console.log(`Baseline (Sequential): ${seqTime.toFixed(2)}ms`);
  console.log(`Concurrent: ${concTime.toFixed(2)}ms`);
  console.log(`Batch: ${batchTime.toFixed(2)}ms`);
}
main();