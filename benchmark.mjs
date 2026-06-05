const mockDocs = Array(10).fill({ ref: 'mock_ref' });

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const deleteDoc = async (ref) => {
    await sleep(50); // Simulate network latency
};

async function sequentialDelete() {
    const start = performance.now();
    for (const docRef of mockDocs) {
        await deleteDoc(docRef.ref);
    }
    const end = performance.now();
    return end - start;
}

async function parallelDelete() {
    const start = performance.now();
    await Promise.all(mockDocs.map(docRef => deleteDoc(docRef.ref)));
    const end = performance.now();
    return end - start;
}

async function run() {
    console.log("Running baseline (sequential)...");
    const seqTime = await sequentialDelete();
    console.log(`Baseline time: ${seqTime.toFixed(2)}ms`);

    console.log("Running optimized (parallel)...");
    const parTime = await parallelDelete();
    console.log(`Optimized time: ${parTime.toFixed(2)}ms`);

    console.log(`Improvement: ${((seqTime - parTime) / seqTime * 100).toFixed(2)}% faster`);
}

run();
