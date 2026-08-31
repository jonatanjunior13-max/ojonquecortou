const { performance } = require('perf_hooks');

const simulateDeleteDoc = async () => {
  return new Promise(resolve => setTimeout(resolve, 50)); // simulate 50ms network latency
};

const simulateGetDocs = async (numDocs) => {
  return {
    docs: Array.from({ length: numDocs }).map((_, i) => ({
      ref: `doc_${i}`
    }))
  };
};

async function benchmark() {
  const numDocs = 20;
  const qSnap = await simulateGetDocs(numDocs);

  // Baseline: Sequential
  const startSequential = performance.now();
  for (const docRef of qSnap.docs) {
    await simulateDeleteDoc(docRef.ref);
  }
  const endSequential = performance.now();
  const sequentialTime = endSequential - startSequential;

  // Optimized: Promise.all
  const startOptimized = performance.now();
  await Promise.all(qSnap.docs.map(docRef => simulateDeleteDoc(docRef.ref)));
  const endOptimized = performance.now();
  const optimizedTime = endOptimized - startOptimized;

  console.log(`Docs count: ${numDocs}`);
  console.log(`Sequential time: ${sequentialTime.toFixed(2)}ms`);
  console.log(`Optimized time: ${optimizedTime.toFixed(2)}ms`);
  console.log(`Improvement: ${((sequentialTime - optimizedTime) / sequentialTime * 100).toFixed(2)}%`);
}

benchmark();
