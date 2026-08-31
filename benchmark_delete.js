const simulateNetworkDelay = () => new Promise(resolve => setTimeout(resolve, 50));

async function runBenchmark() {
  const docs = Array.from({ length: 20 }, (_, i) => ({ id: i }));

  console.time('Sequential Deletion');
  for (const doc of docs) {
    await simulateNetworkDelay();
  }
  console.timeEnd('Sequential Deletion');

  console.time('Concurrent Deletion');
  await Promise.all(docs.map(doc => simulateNetworkDelay()));
  console.timeEnd('Concurrent Deletion');
}

runBenchmark();
