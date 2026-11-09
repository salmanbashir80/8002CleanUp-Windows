/**
 * 8002CleanUp Pro — Comprehensive Test Suite Runner
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('====================================================');
console.log('  8002CleanUp Pro Windows — Quality & Safety Suite  ');
console.log('====================================================\n');

const tests = [
  { name: 'License & Gumroad Manager Tests', file: 'test/licenseManager.test.cjs' },
  { name: 'Windows Safety Guard & Path Allowlist Tests', file: 'test/safetyGuard.test.cjs' }
];

let totalPassed = 0;
let totalFailed = 0;

for (const t of tests) {
  process.stdout.write(`[RUNNING] ${t.name}... `);
  try {
    const fullPath = path.resolve(__dirname, '..', t.file);
    execSync(`node "${fullPath}"`, { stdio: 'pipe' });
    console.log('PASSED ✓');
    totalPassed++;
  } catch (err) {
    console.log('FAILED ✗');
    console.error(err.stdout ? err.stdout.toString() : err.message);
    totalFailed++;
  }
}

console.log('\n----------------------------------------------------');
console.log(`Results: ${totalPassed} passed, ${totalFailed} failed (Total: ${tests.length})`);
console.log('----------------------------------------------------');

if (totalFailed > 0) {
  process.exit(1);
} else {
  console.log('All automated safety and functional tests passed successfully!\n');
}
