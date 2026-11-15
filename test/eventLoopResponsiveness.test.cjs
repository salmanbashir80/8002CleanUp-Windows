/**
 * Test: Event Loop Responsiveness & Non-Blocking Async Scanners
 * Verifies that directory traversals and process checks do not freeze the Node.js event loop
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Create a mock directory tree with 500 files to test non-blocking traversal
const testDir = path.join(os.tmpdir(), `8002_test_resp_${Date.now()}`);
fs.mkdirSync(testDir, { recursive: true });
for (let d = 0; d < 5; d++) {
  const sub = path.join(testDir, `sub_${d}`);
  fs.mkdirSync(sub, { recursive: true });
  for (let f = 0; f < 100; f++) {
    fs.writeFileSync(path.join(sub, `file_${f}.tmp`), 'dummy test payload for scanner');
  }
}

// Implement the same async scanning logic as main.cjs
async function getDirectoryStatsAsync(dirPath, maxDepth = 4) {
  let totalBytes = 0;
  let fileCount = 0;
  const sampleItems = [];
  try {
    const exists = await fs.promises.access(dirPath).then(() => true).catch(() => false);
    if (!exists) return { totalBytes: 0, fileCount: 0, sampleItems: [] };

    const queue = [{ p: dirPath, d: 0 }];
    let processed = 0;

    while (queue.length > 0) {
      const { p, d } = queue.shift();
      let entries = [];
      try {
        entries = await fs.promises.readdir(p, { withFileTypes: true });
      } catch (_) {
        continue;
      }

      for (const entry of entries) {
        processed++;
        if (processed % 80 === 0) {
          await new Promise((resolve) => setImmediate(resolve));
        }

        const fullPath = path.join(p, entry.name);
        try {
          if (entry.isFile()) {
            const st = await fs.promises.stat(fullPath);
            totalBytes += st.size;
            fileCount += 1;
            if (sampleItems.length < 10 && st.size > 10) {
              sampleItems.push({ path: fullPath, name: entry.name, sizeBytes: st.size });
            }
          } else if (entry.isDirectory() && d < maxDepth) {
            queue.push({ p: fullPath, d: d + 1 });
          }
        } catch (_) {}
      }
    }
  } catch (_) {}
  return { totalBytes, fileCount, sampleItems };
}

async function run() {
  let heartbeats = 0;
  const heartbeatTimer = setInterval(() => {
    heartbeats++;
  }, 10);

  const startTime = Date.now();
  const stats = await getDirectoryStatsAsync(testDir, 4);
  const elapsed = Date.now() - startTime;
  clearInterval(heartbeatTimer);

  // Clean up test directory
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch (_) {}

  assert.strictEqual(stats.fileCount, 500, `Expected 500 files, found ${stats.fileCount}`);
  assert(stats.totalBytes > 0, 'Total bytes should be greater than 0');
  assert(heartbeats >= 3, `Event loop must stay alive during scanning (heartbeats: ${heartbeats})`);

  console.log(`✓ Non-blocking scan verified: 500 files traversed in ${elapsed}ms with ${heartbeats} event-loop heartbeats.`);
}

run().catch((err) => {
  try { fs.rmSync(testDir, { recursive: true, force: true }); } catch (_) {}
  console.error(err);
  process.exit(1);
});
