import { build } from 'vite';

try {
  await build();
} catch (e) {
  console.error('Build failed with errors:');
  if (e.errors) {
    e.errors.forEach((err, i) => {
      console.error(`Error ${i}:`, err);
    });
  } else {
    console.error(e);
  }
  process.exit(1);
}
