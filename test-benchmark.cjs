const { performance } = require('perf_hooks');

const mockSetDoc = (doc, data, options) => {
  return new Promise(resolve => setTimeout(resolve, 50)); // simulate 50ms latency
};

const finalServices = Array.from({ length: 20 }).map((_, idx) => ({ id: `id-${idx}`, position: idx }));

async function runSequential() {
  const start = performance.now();
  for (const s of finalServices) {
    try {
      await mockSetDoc({}, { position: s.position }, { merge: true });
    } catch (err) {
      console.error(err);
    }
  }
  return performance.now() - start;
}

async function runParallel() {
  const start = performance.now();
  try {
    await Promise.all(
      finalServices.map(s =>
        mockSetDoc({}, { position: s.position }, { merge: true }).catch(err => console.error(err))
      )
    );
  } catch (err) {
    console.error(err);
  }
  return performance.now() - start;
}

async function main() {
  const seqTime = await runSequential();
  console.log(`Sequential time: ${seqTime.toFixed(2)} ms`);

  const parTime = await runParallel();
  console.log(`Parallel time: ${parTime.toFixed(2)} ms`);
}

main();
