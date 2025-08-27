#!/usr/bin/env node

/**
 * Memory monitoring script for parallel task execution
 * Usage: node scripts/memory-monitor.js
 */

function formatMemory(bytes) {
  return Math.round(bytes / 1024 / 1024) + ' MB';
}

function logMemoryUsage(label = 'Memory Usage') {
  const usage = process.memoryUsage();
  console.log(`\n=== ${label} ===`);
  console.log(`RSS: ${formatMemory(usage.rss)} (Resident Set Size - total memory)`);
  console.log(`Heap Total: ${formatMemory(usage.heapTotal)} (heap allocated)`);
  console.log(`Heap Used: ${formatMemory(usage.heapUsed)} (heap used)`);
  console.log(`External: ${formatMemory(usage.external)} (external memory)`);
  console.log(`Array Buffers: ${formatMemory(usage.arrayBuffers)} (array buffers)`);
  
  // Calculate memory efficiency
  const heapEfficiency = ((usage.heapUsed / usage.heapTotal) * 100).toFixed(1);
  console.log(`Heap Efficiency: ${heapEfficiency}%`);
  
  // Warning thresholds
  if (usage.rss > 4 * 1024 * 1024 * 1024) { // 4GB
    console.log('⚠️  WARNING: High memory usage detected!');
  }
  
  if (heapEfficiency > 90) {
    console.log('⚠️  WARNING: Heap nearly full, GC pressure likely!');
  }
}

// Log initial memory state
logMemoryUsage('Initial State');

// Monitor every 5 seconds
setInterval(() => {
  logMemoryUsage('Periodic Check');
}, 5000);

// Handle cleanup
process.on('SIGINT', () => {
  logMemoryUsage('Final State');
  process.exit(0);
});

console.log('\n🔍 Memory monitoring started. Press Ctrl+C to stop.');
console.log('Run your parallel tasks in another terminal...\n');