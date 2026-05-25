const { execSync } = require('child_process');

try {
  console.log("=== Running git status ===");
  const statusOut = execSync('git status', { encoding: 'utf8' });
  console.log("STDOUT:\n", statusOut);
} catch (err) {
  console.error("ERROR running git status:\n", err.message);
  if (err.stdout) console.log("ERROR STDOUT:\n", err.stdout);
  if (err.stderr) console.error("ERROR STDERR:\n", err.stderr);
}

try {
  console.log("=== Running git log -n 3 ===");
  const logOut = execSync('git log -n 3', { encoding: 'utf8' });
  console.log("STDOUT:\n", logOut);
} catch (err) {
  console.error("ERROR running git log:\n", err.message);
}
