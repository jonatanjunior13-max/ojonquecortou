const simulateDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const updateDocSimulated = async () => {
    await simulateDelay(50); // Simulate 50ms network request
};

async function runBenchmark() {
    const numItems = 10;

    console.log(`Benchmarking with ${numItems} simulated items (50ms delay each)...`);

    // Sequential
    const startSequential = performance.now();
    for (let i = 0; i < numItems; i++) {
        await updateDocSimulated();
    }
    const endSequential = performance.now();
    const durationSequential = endSequential - startSequential;
    console.log(`Sequential execution time: ${durationSequential.toFixed(2)} ms`);

    // Parallel
    const startParallel = performance.now();
    const promises = [];
    for (let i = 0; i < numItems; i++) {
        promises.push(updateDocSimulated());
    }
    await Promise.all(promises);
    const endParallel = performance.now();
    const durationParallel = endParallel - startParallel;
    console.log(`Parallel execution time: ${durationParallel.toFixed(2)} ms`);

    console.log(`Improvement: ${(durationSequential / durationParallel).toFixed(2)}x faster (${((durationSequential - durationParallel) / durationSequential * 100).toFixed(2)}% reduction in time)`);
}

runBenchmark();
