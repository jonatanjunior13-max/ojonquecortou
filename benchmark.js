const { performance } = require('perf_hooks');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const updateDoc = async (ref, data) => {
  await wait(50); // Simulate 50ms network roundtrip
};

const addedProducts = Array.from({ length: 10 }, (_, i) => ({ productId: `prod_${i}`, quantity: 1 }));
const products = Array.from({ length: 10 }, (_, i) => ({ id: `prod_${i}`, quantity: 10 }));

async function runSequential() {
  const start = performance.now();
  for (const added of addedProducts) {
    const match = products.find(p => p.id === added.productId);
    if (match) {
      const newQty = Math.max(0, match.quantity - added.quantity);
      await updateDoc({}, { quantity: newQty });
    }
  }
  const end = performance.now();
  return end - start;
}

async function runConcurrent() {
  const start = performance.now();
  const promises = addedProducts.map(added => {
    const match = products.find(p => p.id === added.productId);
    if (match) {
      const newQty = Math.max(0, match.quantity - added.quantity);
      return updateDoc({}, { quantity: newQty });
    }
    return Promise.resolve();
  });
  await Promise.all(promises);
  const end = performance.now();
  return end - start;
}

async function main() {
  console.log('Running benchmark for 10 products update (50ms latency per update)...');
  const seqTime = await runSequential();
  console.log(`Sequential time: ${seqTime.toFixed(2)} ms`);

  const concTime = await runConcurrent();
  console.log(`Concurrent time: ${concTime.toFixed(2)} ms`);

  console.log(`Improvement: ${((seqTime - concTime) / seqTime * 100).toFixed(2)}% faster`);
}

main();
