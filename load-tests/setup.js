#!/usr/bin/env node

// Test runner script for Artillery load tests
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Artillery Load Testing Suite');
console.log('===============================');

// Check if Artillery is installed
try {
  execSync('artillery --version', { stdio: 'pipe' });
  console.log('✅ Artillery is installed');
} catch (error) {
  console.log('❌ Artillery not found. Installing...');
  try {
    execSync('npm install -g artillery', { stdio: 'inherit' });
    console.log('✅ Artillery installed successfully');
  } catch (installError) {
    console.error('❌ Failed to install Artillery:', installError.message);
    process.exit(1);
  }
}

// Check if test files exist
const testFiles = [
  'auth-load-test.yml',
  'workspace-load-test.yml',
  'ai-load-test.yml',
  'communication-load-test.yml',
  'interactive-load-test.yml',
  'storage-load-test.yml',
  'comprehensive-load-test.yml'
];

console.log('\n📋 Checking test files:');
testFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} missing`);
  }
});

// Install dependencies if package.json exists
if (fs.existsSync(path.join(__dirname, 'package.json'))) {
  console.log('\n📦 Installing test dependencies...');
  try {
    execSync('npm install', { cwd: __dirname, stdio: 'inherit' });
    console.log('✅ Dependencies installed');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
  }
}

// Run connectivity test
console.log('\n🌐 Testing connectivity to https://learniinstitute.live...');
try {
  execSync('artillery quick --count 3 --num 5 https://learniinstitute.live', { 
    cwd: __dirname, 
    stdio: 'inherit',
    timeout: 30000 
  });
  console.log('✅ Connectivity test passed');
} catch (error) {
  console.log('⚠️  Connectivity test failed. Server might be down or rate-limited.');
  console.log('   You can still run the load tests manually.');
}

console.log('\n🎯 Load testing setup complete!');
console.log('\nAvailable test commands:');
console.log('  npm run load-test:auth         - Authentication service');
console.log('  npm run load-test:workspace    - Workspace management');
console.log('  npm run load-test:ai          - AI services');
console.log('  npm run load-test:communication - Chat and notifications');
console.log('  npm run load-test:interactive - Quiz and whiteboard');
console.log('  npm run load-test:storage     - File operations');
console.log('  npm run load-test:comprehensive - Full system test');
console.log('  npm run load-test:all         - All individual tests');
console.log('  npm run load-test:quick       - Quick smoke test');
console.log('  npm run load-test:spike       - Spike test');

console.log('\n📊 To run your first test:');
console.log('  cd load-tests');
console.log('  npm run test:quick');
console.log('\nFor detailed documentation, see README.md');